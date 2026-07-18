/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateCarePlanSchema } from "@/core/validation/care-plan";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // No is_deleted filter here on purpose: archived care plans must stay
    // viewable on their own detail page - only the list view defaults to
    // hiding archived plans.
    const { data: rows, error } = await (supabase.from("care_plans") as any)
      .select(
        "*, client:client_id(id, first_name, last_name), primary_caregiver:primary_caregiver_id(id, first_name, last_name)"
      )
      .eq("id", id);

    if (error) throw error;

    const data = rows?.[0];
    if (!data) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching care plan:", error);
    return NextResponse.json({ error: "Failed to fetch care plan" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Care plan not found" }, { status: 404 });
    }

    if (existing.organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      ...validated,
      primary_caregiver_id: validated.primary_caregiver_id || null,
      updated_at: new Date().toISOString(),
    };

    // Mirror status into is_deleted/deleted_at so PUT can both archive and
    // reactivate a plan (previously only DELETE could archive, and nothing
    // could undo it - is_deleted was never cleared by any write path).
    if (validated.status === "archived") {
      updateData.is_deleted = true;
      updateData.deleted_at = new Date().toISOString();
    } else if (validated.status) {
      updateData.is_deleted = false;
      updateData.deleted_at = null;
    }

    const { data, error } = await (supabase.from("care_plans") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await (supabase.from("care_plan_history") as any).insert([
      {
        care_plan_id: id,
        action: "UPDATE",
        action_by_id: userId,
        previous_values: { ...body },
        new_values: updateData,
      },
    ]);

    // Log to audit logs (real columns: event_type/resource_type/resource_id)
    await (supabase.from("audit_logs") as any).insert({
      organization_id: user.organization_id,
      user_id: userId,
      event_type: "UPDATE",
      resource_type: "care_plans",
      resource_id: id,
      action: "updated",
      changes: { updates: updateData },
    });

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
      .update({ is_deleted: true, deleted_at: now, status: "archived" })
      .eq("id", id);

    await (supabase.from("care_plan_history") as any).insert([
      {
        care_plan_id: id,
        action: "DELETE",
        action_by_id: userId,
      },
    ]);

    // Log to audit logs (real columns: event_type/resource_type/resource_id)
    await (supabase.from("audit_logs") as any).insert({
      organization_id: user.organization_id,
      user_id: userId,
      event_type: "DELETE",
      resource_type: "care_plans",
      resource_id: id,
      action: "archived",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting care plan:", error);
    return NextResponse.json({ error: "Failed to delete care plan" }, { status: 500 });
  }
}
