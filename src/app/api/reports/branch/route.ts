import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

interface BranchFilters {
  startDate?: string | undefined;
  endDate?: string | undefined;
  branchId?: string | undefined;
}

interface BranchMetricValue {
  branchName: string;
  employeeCount: number;
  clientCount: number;
  visitCount: number;
  totalRevenue: number;
  billableHours: number;
  averageHourlyRate: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const searchParams = request.nextUrl.searchParams;
    const filters: BranchFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      branchId: searchParams.get("branchId") || undefined,
    };

    const now = new Date();
    const startDate =
      filters.startDate ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endDate = filters.endDate || now.toISOString().split("T")[0];

    let branchQuery = supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);
    if (filters.branchId) branchQuery = branchQuery.eq("id", filters.branchId);
    const { data: branches } = await branchQuery;

    const { data: employees } = await supabase
      .from("employees")
      .select("id, branch_id, hourly_rate, is_active")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    const { data: clients } = await supabase
      .from("clients")
      .select("id, branch_id, is_active")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    const { data: visits } = await supabase
      .from("scheduled_visits")
      .select("id, branch_id, scheduled_date")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate);

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, branch_id, total_amount, invoice_date")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    // timesheets has no branch_id of its own - derive it from the
    // employee's branch (migration 008_create_billing_system.sql:197-224).
    const { data: timesheets } = await supabase
      .from("timesheets")
      .select("employee_id, billable_hours")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("visit_date", startDate)
      .lte("visit_date", endDate);

    const employeeBranch = new Map((employees || []).map((e) => [e.id, e.branch_id]));

    const branchMetrics: Record<string, BranchMetricValue> = {};

    (branches || []).forEach((branch) => {
      const branchEmployees = (employees || []).filter((e) => e.branch_id === branch.id);
      const activeBranchEmployees = branchEmployees.filter((e) => e.is_active);
      const branchClients = (clients || []).filter((c) => c.branch_id === branch.id && c.is_active);
      const branchVisits = (visits || []).filter((v) => v.branch_id === branch.id);
      const branchInvoices = (invoices || []).filter((i) => i.branch_id === branch.id);
      const branchTimesheets = (timesheets || []).filter(
        (t) => employeeBranch.get(t.employee_id) === branch.id
      );

      const totalRevenue = branchInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const billableHours = branchTimesheets.reduce((sum, t) => sum + (t.billable_hours || 0), 0);
      const averageHourlyRate =
        activeBranchEmployees.length > 0
          ? activeBranchEmployees.reduce((sum, e) => sum + (e.hourly_rate || 0), 0) /
            activeBranchEmployees.length
          : 0;

      branchMetrics[branch.id] = {
        branchName: branch.name,
        employeeCount: activeBranchEmployees.length,
        clientCount: branchClients.length,
        visitCount: branchVisits.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        averageHourlyRate: Math.round(averageHourlyRate * 100) / 100,
      };
    });

    // Log the report
    await supabase.from("report_audit_logs").insert({
      organization_id: organizationId,
      user_id: user.id,
      report_type: "branch",
      action: "generated",
      filters,
      row_count: branches?.length || 0,
    });

    return NextResponse.json({
      data: {
        branchMetrics,
        summary: {
          totalBranches: branches?.length || 0,
          totalRevenue:
            Math.round((invoices || []).reduce((sum, i) => sum + (i.total_amount || 0), 0) * 100) /
            100,
          totalEmployees: (employees || []).filter((e) => e.is_active).length,
          totalClients: (clients || []).filter((c) => c.is_active).length,
          totalVisits: visits?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching branch report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
