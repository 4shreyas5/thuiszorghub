import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

interface FinancialFilters {
  startDate?: string | undefined;
  endDate?: string | undefined;
  branchId?: string | undefined;
  clientId?: string | undefined;
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

    // Parse filters
    const searchParams = request.nextUrl.searchParams;
    const filters: FinancialFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
    };

    // Get date range
    const now = new Date();
    const startDate =
      filters.startDate ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endDate = filters.endDate || now.toISOString().split("T")[0];

    // Get invoices
    let invoiceQuery = supabase
      .from("invoices")
      .select(
        `
        id,
        total_amount,
        paid_amount,
        remaining_balance,
        status,
        invoice_date,
        due_date,
        client_id,
        branch_id
      `
      )
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    if (filters.branchId) invoiceQuery = invoiceQuery.eq("branch_id", filters.branchId);
    if (filters.clientId) invoiceQuery = invoiceQuery.eq("client_id", filters.clientId);

    const { data: invoices, error: invoiceError } = await invoiceQuery;

    if (invoiceError) throw invoiceError;

    // Calculate metrics
    const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
    const totalPaid = invoices?.reduce((sum, inv) => sum + inv.paid_amount, 0) || 0;
    const totalOutstanding = invoices?.reduce((sum, inv) => sum + inv.remaining_balance, 0) || 0;

    // Overdue invoices
    const today = new Date().toISOString().split("T")[0];
    const overdue = invoices?.filter((inv) => inv.status !== "paid" && inv.due_date < today) || [];
    const overdueAmount = overdue.reduce((sum, inv) => sum + inv.remaining_balance, 0);

    // Invoice aging
    const invoiceAging: Record<string, number> = {
      current: 0,
      "30_60": 0,
      "60_90": 0,
      "90_plus": 0,
    };

    const todayDate = new Date();
    invoices?.forEach((inv) => {
      if (inv.status === "paid") return;
      const dueDate = new Date(inv.due_date);
      const daysDifference = Math.floor(
        (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference <= 0) invoiceAging.current += inv.remaining_balance;
      else if (daysDifference <= 30) invoiceAging["30_60"] += inv.remaining_balance;
      else if (daysDifference <= 60) invoiceAging["60_90"] += inv.remaining_balance;
      else invoiceAging["90_plus"] += inv.remaining_balance;
    });

    // Get payments - the real table is "payments" (see
    // src/app/api/billing/payments/route.ts), not "invoice_payments".
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_date, payment_method")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("payment_date", startDate)
      .lte("payment_date", endDate);

    const paymentsByMethod: Record<string, number> = {};
    payments?.forEach((p) => {
      paymentsByMethod[p.payment_method] = (paymentsByMethod[p.payment_method] || 0) + p.amount;
    });

    // By branch
    const revenueByBranch: Record<string, number> = {};
    invoices?.forEach((inv) => {
      revenueByBranch[inv.branch_id || "unknown"] =
        (revenueByBranch[inv.branch_id || "unknown"] || 0) + inv.total_amount;
    });

    // Top clients by revenue
    const clientRevenue: Record<string, number> = {};
    invoices?.forEach((inv) => {
      clientRevenue[inv.client_id] = (clientRevenue[inv.client_id] || 0) + inv.total_amount;
    });

    const topClients = Object.entries(clientRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Trend data - by day
    const revenueTrend: Record<string, number> = {};
    invoices?.forEach((inv) => {
      const date = inv.invoice_date;
      revenueTrend[date] = (revenueTrend[date] || 0) + inv.total_amount;
    });

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    invoices?.forEach((inv) => {
      statusDistribution[inv.status] = (statusDistribution[inv.status] || 0) + 1;
    });

    const avgInvoiceValue = invoices && invoices.length > 0 ? totalRevenue / invoices.length : 0;

    // Log the report
    await supabase.from("report_audit_logs").insert({
      organization_id: organizationId,
      user_id: user.id,
      report_type: "financial",
      action: "generated",
      filters,
      row_count: invoices?.length || 0,
    });

    return NextResponse.json({
      data: {
        totalRevenue,
        totalPaid,
        totalOutstanding,
        overdueAmount,
        invoiceCount: invoices?.length || 0,
        avgInvoiceValue: Math.round(avgInvoiceValue * 100) / 100,
        invoiceAging,
        paymentsByMethod,
        revenueByBranch,
        topClients,
        revenueTrend,
        statusDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching financial report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
