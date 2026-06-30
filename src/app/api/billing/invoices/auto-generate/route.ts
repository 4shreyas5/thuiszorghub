import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { BillingEngine } from "@/core/billing/billing-engine";
import { getBillingPeriod } from "@/utils/date-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organizationId = userData.organization_id;
    const body = await request.json();

    // Get period (default to current month)
    let periodStart = body.periodStart ? new Date(body.periodStart) : new Date();
    let periodEnd = body.periodEnd ? new Date(body.periodEnd) : new Date();

    // If no dates provided, use current billing period
    if (!body.periodStart && !body.periodEnd) {
      const period = getBillingPeriod();
      periodStart = period.start;
      periodEnd = period.end;
    }

    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    const billingEngine = new BillingEngine(supabase);

    // Get all completed visits in the period
    const { data: completedVisits, error: visitsError } = await supabase
      .from("visit_executions")
      .select(
        `
        id,
        scheduled_visit_id,
        completed_at,
        scheduled_visits(
          client_id,
          branch_id
        )
      `
      )
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("completed_at", `${periodStartStr}T00:00:00Z`)
      .lte("completed_at", `${periodEndStr}T23:59:59Z`)
      .eq("is_deleted", false);

    if (visitsError) {
      console.error("Error fetching visits:", visitsError);
      return NextResponse.json(
        { error: "Failed to fetch visits" },
        { status: 500 }
      );
    }

    // Group visits by client and branch
    const groupedVisits: Record<
      string,
      { clientId: string; branchId: string; visits: any[] }
    > = {};

    (completedVisits || []).forEach((visit) => {
      const scheduled = (visit as any).scheduled_visits;
      const key = `${scheduled.client_id}-${scheduled.branch_id}`;

      if (!groupedVisits[key]) {
        groupedVisits[key] = {
          clientId: scheduled.client_id,
          branchId: scheduled.branch_id,
          visits: [],
        };
      }

      groupedVisits[key].visits.push(visit);
    });

    const generatedInvoices: string[] = [];
    const errors: { clientId: string; error: string }[] = [];

    // Generate invoices for each client-branch combination
    for (const [_key, group] of Object.entries(groupedVisits)) {
      try {
        const invoiceId = await billingEngine.generateInvoiceDraft(
          organizationId,
          group.clientId,
          periodStart,
          periodEnd,
          group.branchId
        );

        if (invoiceId) {
          generatedInvoices.push(invoiceId);
        }
      } catch (error) {
        errors.push({
          clientId: group.clientId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Generated ${generatedInvoices.length} invoice(s)`,
      generatedInvoices,
      errors,
      period: {
        start: periodStartStr,
        end: periodEndStr,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
