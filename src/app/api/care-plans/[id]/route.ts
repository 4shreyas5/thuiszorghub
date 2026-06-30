/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateCarePlanSchema } from "@/core/validation/care-plan";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data, error } = await (supabase.from("care_plans") as any)
      .select("*, clients:client_id(id, first_name, last_name), employees:primary_caregiver_id(id, first_name, last_name)")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching care plan:", error);
    return NextResponse.json({ error: "Failed to fetch care plan" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const body = await request.json();

    const validated = updateCarePlanSchema.parse(body);

    const { data: userData } = await (supabase.auth.getUser() as any);
    const userId = userData?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { data: existing } = await (supabase.from("care_plans") as any)
      .select("organization_id")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    if (existing.organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData = {
      ...validated,
      primary_caregiver_id: validated.primary_caregiver_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from("care_plans") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await (supabase.from("care_plan_history") as any).insert([{
      care_plan_id: id,
      action: "UPDATE",
      action_by_id: userId,
      previous_values: { ...body },
      new_values: updateData,
    }]);

    // Log to audit logs
    const { data: userOrg } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (userOrg) {
      await (supabase.from("audit_logs") as any).insert({
        organization_id: userOrg.organization_id,
        user_id: userId,
        action: "update",
        entity_type: "care_plans",
        entity_id: id,
        changes: updateData,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating care plan:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update care plan" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data: userData } = await (supabase.auth.getUser() as any);
    const userId = userData?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { data: existing } = await (supabase.from("care_plans") as any)
      .select("organization_id")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    if (existing.organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date().toISOString();
    await (supabase.from("care_plans") as any)
      .update({ is_deleted: true, deleted_at: now })
      .eq("id", id);

    await (supabase.from("care_plan_history") as any).insert([{
      care_plan_id: id,
      action: "DELETE",
      action_by_id: userId,
    }]);

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: user.organization_id,
      user_id: userId,
      action: "delete",
      entity_type: "care_plans",
      entity_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting care plan:", error);
    return NextResponse.json({ error: "Failed to delete care plan" }, { status: 500 });
  }
}
