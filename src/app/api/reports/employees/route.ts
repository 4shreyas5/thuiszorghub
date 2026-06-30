import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

interface EmployeeFilters {
  startDate?: string | undefined;
  endDate?: string | undefined;
  employeeId?: string | undefined;
  branchId?: string | undefined;
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
    const filters: EmployeeFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      branchId: searchParams.get("branchId") || undefined,
    };

    const now = new Date();
    const startDate = filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = filters.endDate || now.toISOString().split('T')[0];

    // Get employees
    let employeeQuery = supabase
      .from("employees")
      .select("id, first_name, last_name, email, hourly_rate, branch_id, is_active")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    if (filters.branchId) employeeQuery = employeeQuery.eq("branch_id", filters.branchId);
    if (filters.employeeId) employeeQuery = employeeQuery.eq("id", filters.employeeId);

    const { data: employees } = await employeeQuery;

    // Get timesheets
    let timesheetQuery = supabase
      .from("timesheets")
      .select("id, employee_id, billable_hours, night_hours, weekend_hours, holiday_hours, hourly_rate, is_billed, timesheet_date")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("timesheet_date", startDate)
      .lte("timesheet_date", endDate);

    if (filters.employeeId) timesheetQuery = timesheetQuery.eq("employee_id", filters.employeeId);

    const { data: timesheets } = await timesheetQuery;

    // Get visit executions
    let visitQuery = supabase
      .from("visit_executions")
      .select("id, employee_id, status, actual_duration_minutes, executed_date")
      .eq("organization_id", organizationId)
      .gte("executed_date", startDate)
      .lte("executed_date", endDate);

    if (filters.employeeId) visitQuery = visitQuery.eq("employee_id", filters.employeeId);

    const { data: visits } = await visitQuery;

    // Calculate per-employee metrics
    const employeeMetrics: Record<string, any> = {};

    employees?.forEach(emp => {
      const empTimesheets = timesheets?.filter(t => t.employee_id === emp.id) || [];
      const empVisits = visits?.filter(v => v.employee_id === emp.id) || [];

      const totalBillableHours = empTimesheets.reduce((sum, t) => sum + (t.billable_hours || 0), 0);
      const nightHours = empTimesheets.reduce((sum, t) => sum + (t.night_hours || 0), 0);
      const weekendHours = empTimesheets.reduce((sum, t) => sum + (t.weekend_hours || 0), 0);
      const holidayHours = empTimesheets.reduce((sum, t) => sum + (t.holiday_hours || 0), 0);

      const completedVisits = empVisits.filter(v => v.status === "completed").length;
      const cancelledVisits = empVisits.filter(v => v.status === "cancelled").length;

      const avgVisitTime = empVisits.length > 0
        ? empVisits.reduce((sum, v) => sum + (v.actual_duration_minutes || 0), 0) / empVisits.length
        : 0;

      const totalRevenue = empTimesheets.reduce((sum, t) => sum + (t.billable_hours * (t.hourly_rate || 0)), 0);
      const unbilledRevenue = empTimesheets
        .filter(t => !t.is_billed)
        .reduce((sum, t) => sum + (t.billable_hours * (t.hourly_rate || 0)), 0);

      employeeMetrics[emp.id] = {
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        billableHours: Math.round(totalBillableHours * 100) / 100,
        nightHours: Math.round(nightHours * 100) / 100,
        weekendHours: Math.round(weekendHours * 100) / 100,
        holidayHours: Math.round(holidayHours * 100) / 100,
        completedVisits,
        cancelledVisits,
        avgVisitTime: Math.round(avgVisitTime * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        unbilledRevenue: Math.round(unbilledRevenue * 100) / 100,
        hourlyRate: emp.hourly_rate,
        isActive: emp.is_active,
        timesheetCount: empTimesheets.length,
      };
    });

    // Aggregate metrics
    const totalBillableHours = timesheets?.reduce((sum, t) => sum + (t.billable_hours || 0), 0) || 0;
    const totalCompletedVisits = visits?.filter(v => v.status === "completed").length || 0;
    const totalCancelledVisits = visits?.filter(v => v.status === "cancelled").length || 0;

    // Utilization percentage
    const avgHours = totalBillableHours / (employees?.length || 1);
    const utilizationPercent = avgHours > 0 ? (avgHours / 40) * 100 : 0; // Assuming 40 hour work week

    // Log the report
    await supabase
      .from("report_audit_logs")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        report_type: "employees",
        action: "generated",
        filters,
        row_count: employees?.length || 0,
      });

    return NextResponse.json({
      data: {
        employeeMetrics,
        summary: {
          activeEmployees: employees?.filter(e => e.is_active).length || 0,
          totalEmployees: employees?.length || 0,
          totalBillableHours: Math.round(totalBillableHours * 100) / 100,
          totalCompletedVisits,
          totalCancelledVisits,
          avgUtilizationPercent: Math.round(utilizationPercent * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching employee report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
