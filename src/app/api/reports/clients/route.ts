import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

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

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      riskLevel: searchParams.get("riskLevel") || undefined,
    };

    const now = new Date();
    const startDate = filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = filters.endDate || now.toISOString().split('T')[0];

    // Get clients
    let clientQuery = supabase
      .from("clients")
      .select("id, first_name, last_name, email, phone, risk_level, insurance_provider, municipality, is_active")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    if (filters.clientId) clientQuery = clientQuery.eq("id", filters.clientId);
    if (filters.branchId) clientQuery = clientQuery.eq("branch_id", filters.branchId);
    if (filters.riskLevel) clientQuery = clientQuery.eq("risk_level", filters.riskLevel);

    const { data: clients } = await clientQuery;

    // Get visits for clients
    const { data: visits } = await supabase
      .from("visit_executions")
      .select("id, client_id, status, executed_date")
      .eq("organization_id", organizationId)
      .gte("executed_date", startDate)
      .lte("executed_date", endDate);

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

    // Get care plan goals
    const { data: goals } = await supabase
      .from("care_plan_goals")
      .select("id, care_plan_id, status, created_at")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    // Calculate per-client metrics
    const clientMetrics: Record<string, any> = {};
    const riskDistribution: Record<string, number> = {};

    clients?.forEach(client => {
      const clientVisits = visits?.filter(v => v.client_id === client.id) || [];
      const clientInvoices = invoices?.filter(i => i.client_id === client.id) || [];
      const clientPlans = carePlans?.filter(p => p.client_id === client.id) || [];
      const clientGoals = goals?.filter(g => clientPlans.map(p => p.id).includes(g.care_plan_id)) || [];

      const completedVisits = clientVisits.filter(v => v.status === "completed").length;
      const missedVisits = clientVisits.filter(v => v.status === "no_show").length;
      const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.total_amount, 0);
      const totalPaid = clientInvoices.reduce((sum, i) => sum + i.paid_amount, 0);
      const outstanding = clientInvoices.reduce((sum, i) => sum + i.remaining_balance, 0);

      const completedGoals = clientGoals.filter(g => g.status === "completed").length;
      const openGoals = clientGoals.filter(g => g.status === "active").length;

      const avgMonthlyCost = clientInvoices.length > 0
        ? totalInvoiced / clientInvoices.length
        : 0;

      clientMetrics[client.id] = {
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        phone: client.phone,
        riskLevel: client.risk_level,
        insuranceProvider: client.insurance_provider,
        municipality: client.municipality,
        completedVisits,
        upcomingVisits: clientVisits.filter(v => v.status === "scheduled").length,
        missedVisits,
        activePlans: clientPlans.filter(p => p.status === "active").length,
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
    const totalCompleted = visits?.filter(v => v.status === "completed").length || 0;
    const totalMissed = visits?.filter(v => v.status === "no_show").length || 0;

    const totalInvoiced = invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0;
    const totalPaid = invoices?.reduce((sum, i) => sum + i.paid_amount, 0) || 0;
    const totalOutstanding = invoices?.reduce((sum, i) => sum + i.remaining_balance, 0) || 0;

    // Log the report
    await supabase
      .from("report_audit_logs")
      .insert({
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
          activeClients: clients?.filter(c => c.is_active).length || 0,
          totalClients: clients?.length || 0,
          completedVisits: totalCompleted,
          missedVisits: totalMissed,
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          activePlans: carePlans?.filter(p => p.status === "active").length || 0,
          riskDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching client report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
