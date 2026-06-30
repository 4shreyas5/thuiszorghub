import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organizationId = userData.organization_id;

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
    const startDate = filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = filters.endDate || now.toISOString().split('T')[0];

    // Build query for scheduled visits
    let query = supabase
      .from("scheduled_visits")
      .select(`
        id,
        status,
        visit_type,
        scheduled_date,
        estimated_duration_minutes,
        employee_id,
        client_id,
        branch_id
      `)
      .eq("organization_id", organizationId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate);

    if (filters.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
    if (filters.clientId) query = query.eq("client_id", filters.clientId);
    if (filters.visitType) query = query.eq("visit_type", filters.visitType);
    if (filters.status) query = query.eq("status", filters.status);

    const { data: scheduledVisits, error: scheduledError } = await query;

    if (scheduledError) throw scheduledError;

    // Get visit executions for completion rates
    let executionQuery = supabase
      .from("visit_executions")
      .select(`
        id,
        status,
        scheduled_visit_id,
        employee_id,
        actual_duration_minutes,
        executed_date
      `)
      .eq("organization_id", organizationId)
      .gte("executed_date", startDate)
      .lte("executed_date", endDate);

    if (filters.employeeId) executionQuery = executionQuery.eq("employee_id", filters.employeeId);

    const { data: executions, error: executionError } = await executionQuery;

    if (executionError) throw executionError;

    // Calculate metrics
    const totalScheduled = scheduledVisits?.length || 0;
    const completed = executions?.filter(e => e.status === "completed").length || 0;
    const cancelled = scheduledVisits?.filter(v => v.status === "cancelled").length || 0;
    const noShows = totalScheduled - (completed || 0) - cancelled;
    const completionRate = totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0;

    const avgDuration = executions && executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.actual_duration_minutes || 0), 0) / executions.length
      : 0;

    // Get unique employees and clients
    const uniqueEmployees = new Set(scheduledVisits?.map(v => v.employee_id) || []).size;
    const uniqueClients = new Set(scheduledVisits?.map(v => v.client_id) || []).size;

    // Get assignments count
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("created_at", startDate);

    // Daily visit counts
    const visitsByDay: Record<string, number> = {};
    scheduledVisits?.forEach(v => {
      visitsByDay[v.scheduled_date] = (visitsByDay[v.scheduled_date] || 0) + 1;
    });

    // By branch
    const visitsByBranch: Record<string, number> = {};
    scheduledVisits?.forEach(v => {
      visitsByBranch[v.branch_id || "unknown"] = (visitsByBranch[v.branch_id || "unknown"] || 0) + 1;
    });

    // By employee
    const visitsByEmployee: Record<string, number> = {};
    scheduledVisits?.forEach(v => {
      visitsByEmployee[v.employee_id || "unknown"] = (visitsByEmployee[v.employee_id || "unknown"] || 0) + 1;
    });

    // Log the report
    await supabase
      .from("report_audit_logs")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
