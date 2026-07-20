/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createGoalSchema } from "@/core/validation/care-plan";
import { z } from "zod";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export const dynamic = "force-dynamic";

// No permission gate beyond org membership - see care-plans/route.ts.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const { data: carePlan } = await (context.supabase.from("care_plans") as any)
      .select("id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    const { data, error } = await (context.supabase.from("care_plan_goals") as any)
      .select("*")
      .eq("care_plan_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const permError = await requirePermission(context, "care_plan.create");
    if (permError) return permError;

    const { id } = await params;
    const body = await request.json();

    const validated = createGoalSchema.parse({ ...body, care_plan_id: id });

    const { data: carePlan } = await (context.supabase.from("care_plans") as any)
      .select("id, is_deleted")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    const { data, error } = await (context.supabase.from("care_plan_goals") as any)
      .insert([{ ...validated, status: "active" }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
