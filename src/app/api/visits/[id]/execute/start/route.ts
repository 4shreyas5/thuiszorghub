/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { startVisitSchema } from "@/core/validation/visit-execution";

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
    const validatedData = startVisitSchema.parse(body);

    // Get visit
    const { data: visit, error: visitError } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (visitError || !visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check if visit can be started
    if (!["scheduled", "confirmed"].includes(visit.status)) {
      return NextResponse.json(
        { error: "Visit cannot be started from current status" },
        { status: 400 }
      );
    }

    // Check for duplicate execution
    const { data: existingExecution } = await (supabase.from("visit_executions") as any)
      .select("id")
      .eq("scheduled_visit_id", id)
      .in("status", ["started", "in_progress"])
      .eq("is_deleted", false)
      .single();

    if (existingExecution) {
      return NextResponse.json(
        { error: "Visit is already in progress" },
        { status: 409 }
      );
    }

    // Create visit execution
    const { data: execution, error: execError } = await (supabase.from("visit_executions") as any)
      .insert({
        scheduled_visit_id: id,
        organization_id: visit.organization_id,
        started_at: new Date().toISOString(),
        actual_start_time: validatedData.actual_start_time,
        status: "started",
      })
      .select()
      .single();

    if (execError) throw execError;

    // Update visit status
    await (supabase.from("scheduled_visits") as any)
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", id);

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: visit.organization_id,
      user_id: user.id,
      event_type: "UPDATE",
      resource_type: "scheduled_visits",
      resource_id: id,
      action: "visit_started",
      changes: { status: "in_progress" }
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: visit.organization_id,
      scheduled_visit_id: id,
      action: "started",
      action_by_id: user.id,
      new_values: { status: "in_progress", actual_start_time: validatedData.actual_start_time }
    });

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    console.error("Error starting visit:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to start visit" }, { status: 500 });
  }
}
