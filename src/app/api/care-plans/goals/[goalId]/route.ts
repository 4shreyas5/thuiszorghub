/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateGoalSchema } from "@/core/validation/care-plan";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const supabase = await createServerClient();
    const body = await request.json();

    const validated = updateGoalSchema.parse(body);

    const { data: existing } = await (supabase.from("care_plan_goals") as any)
      .select("*")
      .eq("id", goalId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const updateData = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from("care_plan_goals") as any)
      .update(updateData)
      .eq("id", goalId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating goal:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const supabase = await createServerClient();

    const { data: existing } = await (supabase.from("care_plan_goals") as any)
      .select("id")
      .eq("id", goalId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    await (supabase.from("care_plan_goals") as any)
      .update({ is_deleted: true, deleted_at: now, status: "archived" })
      .eq("id", goalId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
