/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { completeTaskSchema } from "@/core/validation/visit-execution";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get today's care plan tasks for the visit
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("care_plan_id, scheduled_date")
      .eq("id", id)
      .single();

    if (!visit?.care_plan_id) {
      return NextResponse.json({ tasks: [] });
    }

    const { data: tasks } = await (supabase.from("care_plan_tasks") as any)
      .select(`*`)
      .eq("care_plan_id", visit.care_plan_id)
      .eq("is_deleted", false)
      .gte("start_date", visit.scheduled_date)
      .lte("end_date", visit.scheduled_date)
      .order("time_category", { ascending: true })
      .order("created_at", { ascending: false });

    // Get completions for this visit
    const { data: completions } = await (supabase.from("visit_task_completions") as any)
      .select("care_plan_task_id, status")
      .eq("scheduled_visit_id", id)
      .eq("is_deleted", false);

    const completionMap = new Map(completions?.map((c: any) => [c.care_plan_task_id, c.status]) || []);

    const tasksWithCompletion = (tasks || []).map((task: any) => ({
      ...task,
      completion_status: completionMap.get(task.id) || "pending",
    }));

    return NextResponse.json({ tasks: tasksWithCompletion });
  } catch (error) {
    console.error("Error fetching visit tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = completeTaskSchema.parse(body);

    // Get visit
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("organization_id, care_plan_id")
      .eq("id", id)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Get visit execution
    const { data: execution } = await (supabase.from("visit_executions") as any)
      .select("id")
      .eq("scheduled_visit_id", id)
      .in("status", ["started", "in_progress"])
      .eq("is_deleted", false)
      .single();

    if (!execution) {
      return NextResponse.json({ error: "Visit not in progress" }, { status: 400 });
    }

    // Verify task belongs to care plan
    const { data: task } = await (supabase.from("care_plan_tasks") as any)
      .select("id")
      .eq("id", validatedData.care_plan_task_id)
      .eq("care_plan_id", visit.care_plan_id)
      .eq("is_deleted", false)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found in care plan" }, { status: 404 });
    }

    // Check for duplicate completion
    const { data: existing } = await (supabase.from("visit_task_completions") as any)
      .select("id")
      .eq("scheduled_visit_id", id)
      .eq("care_plan_task_id", validatedData.care_plan_task_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Task already completed for this visit" },
        { status: 409 }
      );
    }

    // Record task completion
    const { data: completion, error: completeError } = await (supabase.from("visit_task_completions") as any)
      .insert({
        visit_execution_id: execution.id,
        scheduled_visit_id: id,
        care_plan_task_id: validatedData.care_plan_task_id,
        completed_at: new Date().toISOString(),
        completed_by_id: user.id,
        status: validatedData.status,
        notes: validatedData.notes || null,
        skipped_reason: validatedData.skipped_reason || null,
      })
      .select()
      .single();

    if (completeError) throw completeError;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: visit.organization_id,
      user_id: user.id,
      event_type: "CREATE",
      resource_type: "visit_task_completions",
      resource_id: completion.id,
      action: "task_completed",
      changes: { task_id: validatedData.care_plan_task_id, status: validatedData.status }
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    console.error("Error recording task completion:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record task completion" }, { status: 500 });
  }
}
