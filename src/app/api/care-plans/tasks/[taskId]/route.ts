/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateTaskSchema } from "@/core/validation/care-plan";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const supabase = await createServerClient();
    const body = await request.json();

    const validated = updateTaskSchema.parse(body);

    const { data: existing } = await (supabase.from("care_plan_tasks") as any)
      .select("*")
      .eq("id", taskId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (validated.assigned_to_employee_id) {
      const { data: employee } = await (supabase.from("employees") as any)
        .select("id, is_active")
        .eq("id", validated.assigned_to_employee_id)
        .single();

      if (!employee || !employee.is_active) {
        return NextResponse.json({ error: "Employee not found or inactive" }, { status: 400 });
      }
    }

    const updateData = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from("care_plan_tasks") as any)
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const supabase = await createServerClient();

    const { data: existing } = await (supabase.from("care_plan_tasks") as any)
      .select("id")
      .eq("id", taskId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    await (supabase.from("care_plan_tasks") as any)
      .update({ is_deleted: true, deleted_at: now })
      .eq("id", taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
