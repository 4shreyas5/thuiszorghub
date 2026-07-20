import { NextResponse } from "next/server";
import { BillingEngine } from "@/core/billing/billing-engine";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function POST() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "billing.manage");
    if (permError) return permError;

    const organizationId = context.organizationId;

    // Get all completed visits without timesheets
    const { data: completedVisits, error: visitsError } = await supabase
      .from("visit_executions")
      .select(
        `
        id,
        scheduled_visit_id,
        status,
        scheduled_visits(
          id
        )
      `
      )
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .eq("is_deleted", false);

    if (visitsError) {
      console.error("Error fetching visits:", visitsError);
      return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
    }

    const billingEngine = new BillingEngine(supabase);
    const createdTimesheets: string[] = [];
    const errors: { visitId: string; error: string }[] = [];

    // Batch-fetch every existing (non-deleted) timesheet's visit_id for this
    // org in one query, instead of one existence check per completed visit -
    // this was previously an N+1 (and also duplicated the same check that
    // createTimesheetFromVisit performs internally).
    const { data: existingTimesheets } = await supabase
      .from("timesheets")
      .select("id, visit_id")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    const existingTimesheetByVisitId = new Map(
      (existingTimesheets || []).map((ts) => [ts.visit_id, ts.id])
    );

    // Process visits concurrently - each targets a distinct visit
    // execution/timesheet row, so they're independent of one another.
    const results = await Promise.all(
      (completedVisits || []).map(async (visit) => {
        try {
          const visitData = visit as Record<string, unknown>;
          const scheduledVisits = (visitData.scheduled_visits as Record<string, unknown>) || {};
          const scheduledVisitId = String(scheduledVisits.id || "");
          const existingId = existingTimesheetByVisitId.get(scheduledVisitId) ?? null;

          if (existingId) {
            return { skipped: true as const };
          }

          const timesheetId = await billingEngine.createTimesheetFromVisit(
            organizationId,
            visit.id,
            null
          );
          return { skipped: false as const, timesheetId };
        } catch (error) {
          return {
            skipped: false as const,
            error: {
              visitId: visit.id,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      })
    );

    for (const result of results) {
      if (result.skipped) continue;
      if ("error" in result && result.error) {
        errors.push(result.error);
      } else if ("timesheetId" in result && result.timesheetId) {
        createdTimesheets.push(result.timesheetId);
      }
    }

    return NextResponse.json({
      message: `Created ${createdTimesheets.length} timesheet(s)`,
      createdTimesheets,
      errors,
      summary: {
        totalVisits: completedVisits?.length || 0,
        createdCount: createdTimesheets.length,
        errorCount: errors.length,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
