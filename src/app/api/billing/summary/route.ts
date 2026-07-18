/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const period = searchParams.get("period") || "month"; // day, month, year
    const clientId = searchParams.get("clientId") || undefined;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = userData?.organization_id;
    const currentDate = new Date(date);
    let startDate: Date;
    const endDate = currentDate;

    // Calculate period boundaries
    if (period === "day") {
      startDate = currentDate;
    } else if (period === "month") {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
    } else {
      startDate = currentDate;
    }

    // Try to get cached financial summary first - the cache is org-wide, so
    // a client-scoped request always falls through to the live aggregation.
    const { data: cachedSummary } = clientId
      ? { data: null }
      : await (supabase.from("financial_summary") as any)
          .select("*")
          .eq("organization_id", orgId)
          .eq("summary_date", date)
          .eq("is_deleted", false)
          .single();

    if (cachedSummary) {
      return NextResponse.json({
        date,
        period,
        summary: {
          revenue_today: parseFloat(cachedSummary.revenue_today) || 0,
          revenue_this_month: parseFloat(cachedSummary.revenue_this_month) || 0,
          revenue_this_year: parseFloat(cachedSummary.revenue_this_year) || 0,
          outstanding_amount: parseFloat(cachedSummary.outstanding_amount) || 0,
          outstanding_invoices_count: cachedSummary.outstanding_invoices_count || 0,
          overdue_amount: parseFloat(cachedSummary.overdue_amount) || 0,
          overdue_invoices_count: cachedSummary.overdue_invoices_count || 0,
          paid_amount: parseFloat(cachedSummary.paid_amount) || 0,
          paid_invoices_count: cachedSummary.paid_invoices_count || 0,
          billable_hours: parseFloat(cachedSummary.billable_hours_today) || 0,
          billable_hours_month: parseFloat(cachedSummary.billable_hours_this_month) || 0,
        },
      });
    }

    // Calculate from timesheets and invoices
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = new Date(endDate).toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    // Get today's billable hours
    let todayTimesheetsQuery = (supabase.from("timesheets") as any)
      .select("billable_hours")
      .eq("organization_id", orgId)
      .eq("visit_date", todayStr)
      .eq("is_deleted", false);
    if (clientId) todayTimesheetsQuery = todayTimesheetsQuery.eq("client_id", clientId);
    const { data: todayTimesheets } = await todayTimesheetsQuery;

    const billableHoursToday =
      todayTimesheets?.reduce(
        (sum: number, ts: any) => sum + (parseFloat(ts.billable_hours) || 0),
        0
      ) || 0;

    // Get month's billable hours
    let monthTimesheetsQuery = (supabase.from("timesheets") as any)
      .select("billable_hours")
      .eq("organization_id", orgId)
      .gte("visit_date", startDateStr)
      .lte("visit_date", endDateStr)
      .eq("is_deleted", false);
    if (clientId) monthTimesheetsQuery = monthTimesheetsQuery.eq("client_id", clientId);
    const { data: monthTimesheets } = await monthTimesheetsQuery;

    const billableHoursMonth =
      monthTimesheets?.reduce(
        (sum: number, ts: any) => sum + (parseFloat(ts.billable_hours) || 0),
        0
      ) || 0;

    // Get invoices for the period
    let invoicesQuery = (supabase.from("invoices") as any)
      .select("total_amount, status, due_date, paid_amount, invoice_date")
      .eq("organization_id", orgId)
      .gte("invoice_date", startDateStr)
      .lte("invoice_date", endDateStr)
      .eq("is_deleted", false);
    if (clientId) invoicesQuery = invoicesQuery.eq("client_id", clientId);
    const { data: invoices } = await invoicesQuery;

    let revenueToday = 0;
    let revenueMonth = 0;
    let outstandingAmount = 0;
    let overdueAmount = 0;
    let paidAmount = 0;
    let outstandingCount = 0;
    let overdueCount = 0;
    let paidCount = 0;

    invoices?.forEach((inv: any) => {
      const total = parseFloat(inv.total_amount) || 0;
      const paid = parseFloat(inv.paid_amount) || 0;
      const remaining = total - paid;

      // Add to month total
      revenueMonth += total;

      // Add to today total if invoice date is today
      if (inv.invoice_date === todayStr) {
        revenueToday += total;
      }

      // Track by status
      if (inv.status === "paid") {
        paidAmount += total;
        paidCount++;
      } else if (inv.status === "cancelled" || inv.status === "void") {
        // Don't count cancelled/void invoices
      } else {
        outstandingAmount += remaining;
        outstandingCount++;

        // Check if overdue
        const dueDate = new Date(inv.due_date);
        if (dueDate < new Date(todayStr)) {
          overdueAmount += remaining;
          overdueCount++;
        }
      }
    });

    return NextResponse.json({
      date,
      period,
      summary: {
        revenue_today: revenueToday,
        revenue_this_month: revenueMonth,
        revenue_this_year: 0, // TODO: Calculate year revenue
        outstanding_amount: outstandingAmount,
        outstanding_invoices_count: outstandingCount,
        overdue_amount: overdueAmount,
        overdue_invoices_count: overdueCount,
        paid_amount: paidAmount,
        paid_invoices_count: paidCount,
        billable_hours: billableHoursToday,
        billable_hours_month: billableHoursMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching billing summary:", error);
    return NextResponse.json({ error: "Failed to fetch billing summary" }, { status: 500 });
  }
}
