/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { completeReviewSchema } from "@/core/validation/care-plan";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const supabase = await createServerClient();
    const body = await request.json();

    const validated = completeReviewSchema.parse(body);

    const { data: existing } = await (supabase.from("care_plan_reviews") as any)
      .select("*")
      .eq("id", reviewId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const { data: userData } = await (supabase.auth.getUser() as any);
    const userId = userData?.user?.id;

    const updateData = {
      ...validated,
      completed_date: validated.status === "completed" ? new Date().toISOString().split("T")[0] : null,
      reviewer_id: validated.status === "completed" ? userId : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from("care_plan_reviews") as any)
      .update(updateData)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating review:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const supabase = await createServerClient();

    const { data: existing } = await (supabase.from("care_plan_reviews") as any)
      .select("id")
      .eq("id", reviewId)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    await (supabase.from("care_plan_reviews") as any)
      .update({ is_deleted: true, deleted_at: now, status: "cancelled" })
      .eq("id", reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
