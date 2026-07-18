import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

interface ClientMetricValue extends Record<string, unknown> {
  clientName?: string;
  name?: string;
  email?: string;
  phone?: string;
  riskLevel?: string;
  insuranceProvider?: string;
  isActive?: boolean;
  totalVisits?: number;
  completedVisits?: number;
  missedVisits?: number;
  upcomingVisits?: number;
  totalInvoiced?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  activePlans?: number;
  totalGoals?: number;
  completedGoals?: number;
  openGoals?: number;
  totalPlans?: number;
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
    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      riskLevel: searchParams.get("riskLevel") || undefined,
    };

    const now = new Date();
    const startDate =
      filters.startDate ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endDate = filters.endDate || now.toISOString().split("T")[0];

    // Get clients. insurance_provider lives on the separate 1:1
    // client_insurance table, not directly on clients (migration
    // 004_create_client_management.sql:103-115) - there is no
    // "municipality" column anywhere in the client schema, so that filter/
    // field is dropped rather than fabricated.
    let clientQuery = supabase
      .from("clients")
      .select(
        "id, first_name, last_name, email, phone, risk_level, is_active, insurance:client_insurance(insurance_provider)"
      )
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    if (filters.clientId) clientQuery = clientQuery.eq("id", filters.clientId);
    if (filters.branchId) clientQuery = clientQuery.eq("branch_id", filters.branchId);
    if (filters.riskLevel) clientQuery = clientQuery.eq("risk_level", filters.riskLevel);

    const { data: clients } = await clientQuery;

    // Get visits for clients - visit_executions has no client_id/executed_date
    // column of its own; join scheduled_visits and filter client-side (same
    // fix as the operational and employees reports).
    const { data: rawVisits } = await supabase
      .from("visit_executions")
      .select("id, status, completed_at, scheduled_visits(client_id)")
      .eq("organization_id", organizationId)
      .gte("completed_at", `${startDate}T00:00:00Z`)
      .lte("completed_at", `${endDate}T23:59:59Z`);

    const visits = (rawVisits || []).map((v) => ({
      ...v,
      client_id: (v.scheduled_visits as unknown as { client_id?: string } | null)?.client_id,
    }));

    // Get invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, client_id, total_amount, paid_amount, remaining_balance, status, invoice_date")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate);

    // Get care plans
    const { data: carePlans } = await supabase
      .from("care_plans")
      .select("id, client_id, status, created_at")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    // Get care plan goals - care_plan_goals has no organization_id column of
    // its own (only care_plans does), so scope through the already
    // org-filtered care plan ids instead (migration
    // 005_create_care_plans.sql:28-41).
    const carePlanIds = (carePlans || []).map((p) => p.id);
    const { data: goals } = carePlanIds.length
      ? await supabase
          .from("care_plan_goals")
          .select("id, care_plan_id, status, created_at")
          .eq("is_deleted", false)
          .in("care_plan_id", carePlanIds)
      : { data: [] };

    // Calculate per-client metrics
    const clientMetrics: Record<string, ClientMetricValue> = {};
    const riskDistribution: Record<string, number> = {};

    clients?.forEach((client) => {
      const clientVisits = visits?.filter((v) => v.client_id === client.id) || [];
      const clientInvoices = invoices?.filter((i) => i.client_id === client.id) || [];
      const clientPlans = carePlans?.filter((p) => p.client_id === client.id) || [];
      const clientGoals =
        goals?.filter((g) => clientPlans.map((p) => p.id).includes(g.care_plan_id)) || [];

      const completedVisits = clientVisits.filter((v) => v.status === "completed").length;
      const missedVisits = clientVisits.filter((v) => v.status === "no_show").length;
      const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.total_amount, 0);
      const totalPaid = clientInvoices.reduce((sum, i) => sum + i.paid_amount, 0);
      const outstanding = clientInvoices.reduce((sum, i) => sum + i.remaining_balance, 0);

      const completedGoals = clientGoals.filter((g) => g.status === "completed").length;
      const openGoals = clientGoals.filter((g) => g.status === "active").length;

      const avgMonthlyCost = clientInvoices.length > 0 ? totalInvoiced / clientInvoices.length : 0;

      const insurance = Array.isArray(client.insurance) ? client.insurance[0] : client.insurance;

      clientMetrics[client.id] = {
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        phone: client.phone,
        riskLevel: client.risk_level,
        insuranceProvider: insurance?.insurance_provider,
        completedVisits,
        upcomingVisits: clientVisits.filter((v) => v.status === "scheduled").length,
        missedVisits,
        activePlans: clientPlans.filter((p) => p.status === "active").length,
        totalPlans: clientPlans.length,
        completedGoals,
        openGoals,
        totalInvoiced,
        totalPaid,
        outstanding,
        avgMonthlyCost: Math.round(avgMonthlyCost * 100) / 100,
        isActive: client.is_active,
      };

      // Risk distribution
      if (client.risk_level) {
        riskDistribution[client.risk_level] = (riskDistribution[client.risk_level] || 0) + 1;
      }
    });

    // Aggregate metrics
    const totalCompleted = visits?.filter((v) => v.status === "completed").length || 0;
    const totalMissed = visits?.filter((v) => v.status === "no_show").length || 0;

    const totalInvoiced = invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0;
    const totalPaid = invoices?.reduce((sum, i) => sum + i.paid_amount, 0) || 0;
    const totalOutstanding = invoices?.reduce((sum, i) => sum + i.remaining_balance, 0) || 0;

    // Log the report
    await supabase.from("report_audit_logs").insert({
      organization_id: organizationId,
      user_id: user.id,
      report_type: "clients",
      action: "generated",
      filters,
      row_count: clients?.length || 0,
    });

    return NextResponse.json({
      data: {
        clientMetrics,
        summary: {
          activeClients: clients?.filter((c) => c.is_active).length || 0,
          totalClients: clients?.length || 0,
          completedVisits: totalCompleted,
          missedVisits: totalMissed,
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          activePlans: carePlans?.filter((p) => p.status === "active").length || 0,
          riskDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching client report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
