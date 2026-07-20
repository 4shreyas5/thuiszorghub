import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

interface OperationalFilters {
  startDate?: string | undefined;
  endDate?: string | undefined;
  branchId?: string | undefined;
  employeeId?: string | undefined;
  clientId?: string | undefined;
  visitType?: string | undefined;
  status?: string | undefined;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "report.view");
    if (permError) return permError;

    const organizationId = context.organizationId;

    // Parse filters
    const searchParams = request.nextUrl.searchParams;
    const filters: OperationalFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      visitType: searchParams.get("visitType") || undefined,
      status: searchParams.get("status") || undefined,
    };

    // Get date range
    const now = new Date();
    const startDate =
      filters.startDate ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endDate = filters.endDate || now.toISOString().split("T")[0];

    // Build query for scheduled visits
    let query = supabase
      .from("scheduled_visits")
      .select(
        `
        id,
        status,
        visit_type,
        scheduled_date,
        estimated_duration_minutes,
        employee_id,
        client_id,
        branch_id
      `
      )
      .eq("organization_id", organizationId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate);

    if (filters.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
    if (filters.clientId) query = query.eq("client_id", filters.clientId);
    if (filters.visitType) query = query.eq("visit_type", filters.visitType);
    if (filters.status) query = query.eq("status", filters.status);

    // scheduledVisits, visit_executions and assignments are independent
    // queries (none filters on another's result) - run them concurrently.
    const [
      { data: scheduledVisits, error: scheduledError },
      { data: rawExecutions, error: executionError },
      { data: assignments },
    ] = await Promise.all([
      query,
      // Get visit executions for completion rates. visit_executions has no
      // employee_id/client_id/executed_date columns of its own (see
      // supabase/migrations/009_create_visit_execution.sql and the gotcha
      // documented in 011_reporting_analytics.sql:99-101) - those live on the
      // parent scheduled_visits row, so date-range filtering uses the
      // execution's own completed_at (same convention already proven in
      // src/core/billing/billing-engine.ts), and employee/client filtering
      // happens client-side on the embedded scheduled_visits fields.
      supabase
        .from("visit_executions")
        .select(
          `
        id,
        status,
        scheduled_visit_id,
        actual_duration_minutes,
        completed_at,
        scheduled_visits(employee_id, client_id, branch_id)
      `
        )
        .eq("organization_id", organizationId)
        .gte("completed_at", `${startDate}T00:00:00Z`)
        .lte("completed_at", `${endDate}T23:59:59Z`),
      // Get assignments count
      supabase
        .from("assignments")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("is_deleted", false)
        .gte("created_at", startDate),
    ]);

    if (scheduledError) throw scheduledError;
    if (executionError) throw executionError;

    const executions = (rawExecutions || []).filter((e) => {
      const scheduled = e.scheduled_visits as unknown as {
        employee_id?: string;
        client_id?: string;
      } | null;
      if (filters.employeeId && scheduled?.employee_id !== filters.employeeId) return false;
      if (filters.clientId && scheduled?.client_id !== filters.clientId) return false;
      return true;
    });

    // Calculate metrics
    const totalScheduled = scheduledVisits?.length || 0;
    const completed = executions?.filter((e) => e.status === "completed").length || 0;
    const cancelled = scheduledVisits?.filter((v) => v.status === "cancelled").length || 0;
    const noShows = totalScheduled - (completed || 0) - cancelled;
    const completionRate = totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0;

    const avgDuration =
      executions && executions.length > 0
        ? executions.reduce((sum, e) => sum + (e.actual_duration_minutes || 0), 0) /
          executions.length
        : 0;

    // Get unique employees and clients
    const uniqueEmployees = new Set(scheduledVisits?.map((v) => v.employee_id) || []).size;
    const uniqueClients = new Set(scheduledVisits?.map((v) => v.client_id) || []).size;

    // Daily visit counts
    const visitsByDay: Record<string, number> = {};
    scheduledVisits?.forEach((v) => {
      visitsByDay[v.scheduled_date] = (visitsByDay[v.scheduled_date] || 0) + 1;
    });

    // By branch
    const visitsByBranch: Record<string, number> = {};
    scheduledVisits?.forEach((v) => {
      visitsByBranch[v.branch_id || "unknown"] =
        (visitsByBranch[v.branch_id || "unknown"] || 0) + 1;
    });

    // By employee
    const visitsByEmployee: Record<string, number> = {};
    scheduledVisits?.forEach((v) => {
      visitsByEmployee[v.employee_id || "unknown"] =
        (visitsByEmployee[v.employee_id || "unknown"] || 0) + 1;
    });

    // Log the report
    await supabase.from("report_audit_logs").insert({
      organization_id: organizationId,
      user_id: context.userId,
      report_type: "operational",
      action: "generated",
      filters,
      row_count: totalScheduled,
    });

    return NextResponse.json({
      data: {
        totalScheduled,
        completionRate,
        completed,
        cancelled,
        noShows,
        avgDuration: Math.round(avgDuration * 100) / 100,
        uniqueEmployees,
        uniqueClients,
        assignmentCount: assignments?.length || 0,
        visitsByDay,
        visitsByBranch,
        visitsByEmployee,
      },
    });
  } catch (error) {
    console.error("Error fetching operational report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
