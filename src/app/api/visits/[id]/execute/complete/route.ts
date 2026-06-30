/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { completeVisitSchema } from "@/core/validation/visit-execution";

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
    const validatedData = completeVisitSchema.parse(body);

    // Get visit with all related data
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select(`*,
        client:clients(id, first_name, last_name),
        employee:employees(id, first_name, last_name),
        care_plan:care_plans(id)`)
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Get visit execution
    const { data: execution } = await (supabase.from("visit_executions") as any)
      .select("id, status")
      .eq("scheduled_visit_id", id)
      .eq("is_deleted", false)
      .single();

    if (!execution || !["started", "in_progress"].includes(execution.status)) {
      return NextResponse.json({ error: "Visit not in progress" }, { status: 400 });
    }

    // Check if already completed
    if (execution.status === "completed") {
      return NextResponse.json({ error: "Visit already completed" }, { status: 409 });
    }

    // Validation: Check for required completion notes
    if (!validatedData.notes || validatedData.notes.trim().length === 0) {
      return NextResponse.json({ error: "Completion notes are required" }, { status: 400 });
    }

    // Calculate actual duration
    const startTime = new Date(`2000-01-01T${visit.start_time}`);
    const endTime = new Date(`2000-01-01T${validatedData.actual_end_time}`);
    const actualDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Complete visit execution
    const { data: completedExecution, error: execError } = await (supabase.from("visit_executions") as any)
      .update({
        status: "completed",
        actual_end_time: validatedData.actual_end_time,
        actual_duration_minutes: actualDurationMinutes,
        billable_duration_minutes: actualDurationMinutes,
        completed_at: new Date().toISOString(),
        completed_by_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", execution.id)
      .select()
      .single();

    if (execError) throw execError;

    // Update visit status to completed
    await (supabase.from("scheduled_visits") as any)
      .update({
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    // Create/update timesheet for billing
    if (visit.employee_id) {
      const billableHours = actualDurationMinutes / 60;

      await (supabase.from("timesheets") as any)
        .insert({
          organization_id: visit.organization_id,
          visit_id: id,
          employee_id: visit.employee_id,
          client_id: visit.client_id,
          visit_date: visit.scheduled_date,
          start_time: visit.start_time,
          end_time: validatedData.actual_end_time,
          total_hours: billableHours,
          billable_hours: billableHours,
          created_by: user.id,
        });
    }

    // Visit completion logged to care plan history via audit logs

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: visit.organization_id,
      user_id: user.id,
      event_type: "UPDATE",
      resource_type: "scheduled_visits",
      resource_id: id,
      action: "visit_completed",
      changes: {
        status: "completed",
        actual_duration_minutes: actualDurationMinutes,
        billable_duration_minutes: actualDurationMinutes,
      }
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: visit.organization_id,
      scheduled_visit_id: id,
      action: "completed",
      action_by_id: user.id,
      notes: validatedData.notes,
      new_values: {
        status: "completed",
        actual_duration_minutes: actualDurationMinutes,
      }
    });

    return NextResponse.json({
      visit: completedExecution,
      actual_duration_minutes: actualDurationMinutes,
      billable_duration_minutes: actualDurationMinutes,
    });
  } catch (error) {
    console.error("Error completing visit:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to complete visit" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get visit execution details
    const { data: execution } = await (supabase.from("visit_executions") as any)
      .select("*")
      .eq("scheduled_visit_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!execution) {
      return NextResponse.json({ status: "no_execution" });
    }

    // Get task completions
    const { data: tasks } = await (supabase.from("visit_task_completions") as any)
      .select("*")
      .eq("visit_execution_id", execution.id);

    // Get medications
    const { data: medications } = await (supabase.from("visit_medication_records") as any)
      .select("*")
      .eq("visit_execution_id", execution.id);

    // Get notes
    const { data: notes } = await (supabase.from("visit_notes") as any)
      .select("*")
      .eq("visit_execution_id", execution.id);

    // Determine if visit can be completed
    const hasNotes = (notes?.length || 0) > 0;
    const hasCompletedTasks = (tasks?.filter((t: any) => t.status === "completed").length || 0) > 0;
    const allMedicationsRecorded = (medications?.length || 0) > 0 || (medications?.length || 0) === 0;

    return NextResponse.json({
      execution,
      tasks: tasks || [],
      medications: medications || [],
      notes: notes || [],
      completion_readiness: {
        has_notes: hasNotes,
        has_completed_tasks: hasCompletedTasks,
        medications_recorded: allMedicationsRecorded,
        can_complete: hasNotes,
      }
    });
  } catch (error) {
    console.error("Error fetching visit completion status:", error);
    return NextResponse.json({ error: "Failed to fetch completion status" }, { status: 500 });
  }
}
