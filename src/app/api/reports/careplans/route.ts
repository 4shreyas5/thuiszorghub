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
      status: searchParams.get("status") || undefined,
    };


    // Get care plans
    let planQuery = supabase
      .from("care_plans")
      .select("id, client_id, status, created_at, updated_at, start_date, end_date")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    if (filters.status) planQuery = planQuery.eq("status", filters.status);
    if (filters.clientId) planQuery = planQuery.eq("client_id", filters.clientId);

    const { data: carePlans } = await planQuery;

    // Get goals
    const { data: goals } = await supabase
      .from("care_plan_goals")
      .select("id, care_plan_id, status, created_at")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    // Get tasks
    const { data: tasks } = await supabase
      .from("care_plan_tasks")
      .select("id, care_plan_id, status, created_at")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    // Get reviews
    const { data: reviews } = await supabase
      .from("care_plan_reviews")
      .select("id, care_plan_id, status, review_date, is_due, is_overdue")
      .eq("organization_id", organizationId)
      .eq("is_deleted", false);

    // Calculate per-plan metrics
    const carePlanMetrics: Record<string, any> = {};

    carePlans?.forEach(plan => {
      const planGoals = goals?.filter(g => g.care_plan_id === plan.id) || [];
      const planTasks = tasks?.filter(t => t.care_plan_id === plan.id) || [];
      const planReviews = reviews?.filter(r => r.care_plan_id === plan.id) || [];

      const completedGoals = planGoals.filter(g => g.status === "completed").length;
      const outstandingGoals = planGoals.filter(g => g.status !== "completed").length;

      const completedTasks = planTasks.filter(t => t.status === "completed").length;
      const skippedTasks = planTasks.filter(t => t.status === "skipped").length;
      const outstandingTasks = planTasks.filter(t => t.status !== "completed" && t.status !== "skipped").length;

      const completedReviews = planReviews.filter(r => r.status === "completed").length;
      const dueReviews = planReviews.filter(r => r.is_due).length;
      const overdueReviews = planReviews.filter(r => r.is_overdue).length;

      const goalCompletionPercent = planGoals.length > 0
        ? (completedGoals / planGoals.length) * 100
        : 0;

      const taskCompletionPercent = planTasks.length > 0
        ? (completedTasks / planTasks.length) * 100
        : 0;

      carePlanMetrics[plan.id] = {
        clientId: plan.client_id,
        status: plan.status,
        startDate: plan.start_date,
        endDate: plan.end_date,
        daysActive: plan.start_date
          ? Math.floor((new Date().getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        totalGoals: planGoals.length,
        completedGoals,
        outstandingGoals,
        goalCompletionPercent: Math.round(goalCompletionPercent * 100) / 100,
        totalTasks: planTasks.length,
        completedTasks,
        skippedTasks,
        outstandingTasks,
        taskCompletionPercent: Math.round(taskCompletionPercent * 100) / 100,
        totalReviews: planReviews.length,
        completedReviews,
        dueReviews,
        overdueReviews,
        reviewCompliancePercent: planReviews.length > 0
          ? (completedReviews / planReviews.length) * 100
          : 0,
      };
    });

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    carePlans?.forEach(plan => {
      statusDistribution[plan.status] = (statusDistribution[plan.status] || 0) + 1;
    });

    // Aggregate metrics
    const activePlans = carePlans?.filter(p => p.status === "active").length || 0;
    const completedPlans = carePlans?.filter(p => p.status === "completed").length || 0;
    const draftPlans = carePlans?.filter(p => p.status === "draft").length || 0;

    const totalGoals = goals?.length || 0;
    const completedGoals = goals?.filter(g => g.status === "completed").length || 0;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;

    const totalReviews = reviews?.length || 0;
    const completedReviews = reviews?.filter(r => r.status === "completed").length || 0;
    const overdueReviews = reviews?.filter(r => r.is_overdue).length || 0;

    // Log the report
    await supabase
      .from("report_audit_logs")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        report_type: "careplans",
        action: "generated",
        filters,
        row_count: carePlans?.length || 0,
      });

    return NextResponse.json({
      data: {
        carePlanMetrics,
        summary: {
          totalPlans: carePlans?.length || 0,
          activePlans,
          completedPlans,
          draftPlans,
          statusDistribution,
          totalGoals,
          completedGoals,
          outstandingGoals: totalGoals - completedGoals,
          totalTasks,
          completedTasks,
          skippedTasks: tasks?.filter(t => t.status === "skipped").length || 0,
          totalReviews,
          completedReviews,
          overdueReviews,
          reviewCompliancePercent: totalReviews > 0
            ? (completedReviews / totalReviews) * 100
            : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching care plan report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
