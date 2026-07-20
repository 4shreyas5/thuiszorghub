/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { updateGoalSchema } from "@/core/validation/care-plan";
import { z } from "zod";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const permError = await requirePermission(context, "care_plan.update");
    if (permError) return permError;

    const { goalId } = await params;
    const body = await request.json();

    const validated = updateGoalSchema.parse(body);

    const { data: existing } = await (context.supabase.from("care_plan_goals") as any)
      .select("*")
      .eq("id", goalId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // care_plan_goals has no organization_id of its own - verify the
    // parent care plan belongs to the caller's org before allowing the write.
    const { data: carePlan } = await (context.supabase.from("care_plans") as any)
      .select("id")
      .eq("id", existing.care_plan_id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const updateData = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (context.supabase.from("care_plan_goals") as any)
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
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const permError = await requirePermission(context, "care_plan.delete");
    if (permError) return permError;

    const { goalId } = await params;

    const { data: existing } = await (context.supabase.from("care_plan_goals") as any)
      .select("id, care_plan_id")
      .eq("id", goalId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // care_plan_goals has no organization_id of its own - verify the
    // parent care plan belongs to the caller's org before allowing the write.
    const { data: carePlan } = await (context.supabase.from("care_plans") as any)
      .select("id")
      .eq("id", existing.care_plan_id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    await (context.supabase.from("care_plan_goals") as any)
      .update({ is_deleted: true, deleted_at: now, status: "archived" })
      .eq("id", goalId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
