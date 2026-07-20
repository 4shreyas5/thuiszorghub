/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createReviewSchema } from "@/core/validation/care-plan";
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

    const { data, error } = await (context.supabase.from("care_plan_reviews") as any)
      .select("*")
      .eq("care_plan_id", id)
      .eq("is_deleted", false)
      .order("scheduled_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
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

    const validated = createReviewSchema.parse({ ...body, care_plan_id: id });

    const { data: carePlan } = await (context.supabase.from("care_plans") as any)
      .select("id, is_deleted, start_date")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (!carePlan) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    const scheduledDate = new Date(validated.scheduled_date);
    const startDate = new Date(carePlan.start_date);

    if (scheduledDate < startDate) {
      return NextResponse.json(
        { error: "Review cannot be scheduled before care plan start date" },
        { status: 400 }
      );
    }

    const { data, error } = await (context.supabase.from("care_plan_reviews") as any)
      .insert([{ ...validated, status: "scheduled" }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
