import { createServerClient } from "@/core/database/server";
import { NextResponse } from "next/server";
import { BillingEngine } from "@/core/billing/billing-engine";

export async function POST() {
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

    // Create timesheets for each completed visit
    for (const visit of completedVisits || []) {
      try {
        // Check if timesheet already exists
        const visitData = visit as Record<string, unknown>;
        const scheduledVisits = (visitData.scheduled_visits as Record<string, unknown>) || {};
        const { data: existingTimesheet } = await supabase
          .from("timesheets")
          .select("id")
          .eq("visit_id", String(scheduledVisits.id || ""))
          .eq("is_deleted", false)
          .maybeSingle();

        if (!existingTimesheet) {
          const timesheetId = await billingEngine.createTimesheetFromVisit(
            organizationId,
            visit.id
          );
          if (timesheetId) {
            createdTimesheets.push(timesheetId);
          }
        }
      } catch (error) {
        errors.push({
          visitId: visit.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
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
