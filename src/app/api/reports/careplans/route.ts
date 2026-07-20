import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

interface CarePlanMetricValue {
  clientId: string;
  status: string;
  startDate?: string;
  endDate?: string;
  daysActive: number;
  totalGoals: number;
  completedGoals: number;
  outstandingGoals: number;
  goalCompletionPercent: number;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  outstandingTasks: number;
  taskCompletionPercent: number;
  totalReviews: number;
  completedReviews: number;
  dueReviews: number;
  overdueReviews: number;
  reviewCompliancePercent: number;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "report.view");
    if (permError) return permError;

    const organizationId = context.organizationId;

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

    // care_plan_goals/care_plan_tasks/care_plan_reviews have no
    // organization_id column of their own (only care_plans does) - scope
    // through the already org-filtered care plan ids instead (migration
    // 005_create_care_plans.sql:28-78).
    const carePlanIds = (carePlans || []).map((p) => p.id);

    // goals, tasks and reviews are all filtered only by carePlanIds and are
    // independent of each other - run them concurrently once carePlanIds is
    // known. (taskCompletions depends on taskIds from tasks, so it must stay
    // sequential after this group resolves.)
    const [{ data: goals }, { data: tasks }, { data: reviews }] = await Promise.all([
      // Get goals
      carePlanIds.length
        ? supabase
            .from("care_plan_goals")
            .select("id, care_plan_id, status, created_at")
            .eq("is_deleted", false)
            .in("care_plan_id", carePlanIds)
        : Promise.resolve({
            data: [] as { id: string; care_plan_id: string; status: string; created_at: string }[],
          }),
      // Get tasks - care_plan_tasks has no status column; a task's
      // "completion" is per-visit-occurrence, tracked in
      // visit_task_completions (migration 009_create_visit_execution.sql:24-36),
      // not a single status on the task definition itself.
      carePlanIds.length
        ? supabase
            .from("care_plan_tasks")
            .select("id, care_plan_id, created_at")
            .eq("is_deleted", false)
            .in("care_plan_id", carePlanIds)
        : Promise.resolve({
            data: [] as { id: string; care_plan_id: string; created_at: string }[],
          }),
      // Get reviews - real columns are scheduled_date/completed_date/status,
      // not review_date/is_due/is_overdue (migration
      // 005_create_care_plans.sql:65-78).
      carePlanIds.length
        ? supabase
            .from("care_plan_reviews")
            .select("id, care_plan_id, status, scheduled_date, completed_date")
            .eq("is_deleted", false)
            .in("care_plan_id", carePlanIds)
        : Promise.resolve({
            data: [] as {
              id: string;
              care_plan_id: string;
              status: string;
              scheduled_date: string;
              completed_date: string | null;
            }[],
          }),
    ]);

    const taskIds = (tasks || []).map((t) => t.id);
    const { data: taskCompletions } = taskIds.length
      ? await supabase
          .from("visit_task_completions")
          .select("care_plan_task_id, status")
          .in("care_plan_task_id", taskIds)
      : { data: [] };

    const today = new Date().toISOString().split("T")[0];

    // Calculate per-plan metrics
    const carePlanMetrics: Record<string, CarePlanMetricValue> = {};

    carePlans?.forEach((plan) => {
      const planGoals = goals?.filter((g) => g.care_plan_id === plan.id) || [];
      const planTasks = tasks?.filter((t) => t.care_plan_id === plan.id) || [];
      const planReviews = reviews?.filter((r) => r.care_plan_id === plan.id) || [];

      const completedGoals = planGoals.filter((g) => g.status === "completed").length;
      const outstandingGoals = planGoals.filter((g) => g.status !== "completed").length;

      const planTaskIds = planTasks.map((t) => t.id);
      const planTaskCompletions = (taskCompletions || []).filter((c) =>
        planTaskIds.includes(c.care_plan_task_id)
      );
      const completedTaskIds = new Set(
        planTaskCompletions.filter((c) => c.status === "completed").map((c) => c.care_plan_task_id)
      );
      const skippedTaskIds = new Set(
        planTaskCompletions
          .filter((c) => c.status === "skipped" && !completedTaskIds.has(c.care_plan_task_id))
          .map((c) => c.care_plan_task_id)
      );
      const completedTasks = completedTaskIds.size;
      const skippedTasks = skippedTaskIds.size;
      const outstandingTasks = planTasks.length - completedTasks - skippedTasks;

      const completedReviews = planReviews.filter((r) => r.status === "completed").length;
      const dueReviews = planReviews.filter(
        (r) => r.status === "scheduled" && r.scheduled_date >= today
      ).length;
      const overdueReviews = planReviews.filter(
        (r) => r.status === "scheduled" && r.scheduled_date < today
      ).length;

      const goalCompletionPercent =
        planGoals.length > 0 ? (completedGoals / planGoals.length) * 100 : 0;

      const taskCompletionPercent =
        planTasks.length > 0 ? (completedTasks / planTasks.length) * 100 : 0;

      carePlanMetrics[plan.id] = {
        clientId: plan.client_id,
        status: plan.status,
        startDate: plan.start_date,
        endDate: plan.end_date,
        daysActive: plan.start_date
          ? Math.floor(
              (new Date().getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24)
            )
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
        reviewCompliancePercent:
          planReviews.length > 0 ? (completedReviews / planReviews.length) * 100 : 0,
      };
    });

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    carePlans?.forEach((plan) => {
      statusDistribution[plan.status] = (statusDistribution[plan.status] || 0) + 1;
    });

    // Aggregate metrics
    const activePlans = carePlans?.filter((p) => p.status === "active").length || 0;
    const completedPlans = carePlans?.filter((p) => p.status === "completed").length || 0;
    const draftPlans = carePlans?.filter((p) => p.status === "draft").length || 0;

    const totalGoals = goals?.length || 0;
    const completedGoals = goals?.filter((g) => g.status === "completed").length || 0;

    const totalTasks = tasks?.length || 0;
    const completedTaskIdsAll = new Set(
      (taskCompletions || [])
        .filter((c) => c.status === "completed")
        .map((c) => c.care_plan_task_id)
    );
    const skippedTaskIdsAll = new Set(
      (taskCompletions || [])
        .filter((c) => c.status === "skipped" && !completedTaskIdsAll.has(c.care_plan_task_id))
        .map((c) => c.care_plan_task_id)
    );
    const completedTasks = completedTaskIdsAll.size;

    const totalReviews = reviews?.length || 0;
    const completedReviews = reviews?.filter((r) => r.status === "completed").length || 0;
    const overdueReviews =
      reviews?.filter((r) => r.status === "scheduled" && r.scheduled_date < today).length || 0;

    // Log the report
    await supabase.from("report_audit_logs").insert({
      organization_id: organizationId,
      user_id: context.userId,
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
          skippedTasks: skippedTaskIdsAll.size,
          totalReviews,
          completedReviews,
          overdueReviews,
          reviewCompliancePercent: totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching care plan report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
