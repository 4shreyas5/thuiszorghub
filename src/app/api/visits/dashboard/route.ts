/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = userData?.organization_id;

    // Get today's visits with their statuses
    const { data: visits } = await (supabase.from("scheduled_visits") as any)
      .select(`*,
        execution:visit_executions(id, status, actual_duration_minutes, billable_duration_minutes)`)
      .eq("organization_id", orgId)
      .eq("scheduled_date", date)
      .eq("is_deleted", false);

    const totalVisits = visits?.length || 0;
    const completedVisits = visits?.filter((v: any) => v.status === "completed").length || 0;
    const inProgressVisits = visits?.filter((v: any) => v.status === "in_progress").length || 0;
    const pendingVisits = visits?.filter((v: any) => ["scheduled", "confirmed"].includes(v.status)).length || 0;

    // Calculate average duration
    let totalBillableMinutes = 0;
    let completedCount = 0;

    visits?.forEach((v: any) => {
      if (v.status === "completed" && v.execution?.[0]?.billable_duration_minutes) {
        totalBillableMinutes += v.execution[0].billable_duration_minutes;
        completedCount += 1;
      }
    });

    const averageDuration = completedCount > 0 ? Math.round(totalBillableMinutes / completedCount) : 0;

    // Get overdue visits (scheduled for past dates without completion)
    const { data: overdueVisits } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("organization_id", orgId)
      .lt("scheduled_date", date)
      .notIn("status", ["completed", "cancelled", "no_show"])
      .eq("is_deleted", false);

    const overdueCount = overdueVisits?.length || 0;

    return NextResponse.json({
      date,
      summary: {
        total_visits: totalVisits,
        completed_visits: completedVisits,
        in_progress_visits: inProgressVisits,
        pending_visits: pendingVisits,
        overdue_visits: overdueCount,
        average_visit_duration_minutes: averageDuration,
        completion_rate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0,
      },
      visits: visits || []
    });
  } catch (error) {
    console.error("Error fetching visit dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
