/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { recordMedicationSchema } from "@/core/validation/visit-execution";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

// No permission gate beyond org membership - read-only medication log.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    // Verify the visit belongs to the caller's own org before returning
    // anything tied to it.
    const { data: visit } = await (context.supabase.from("scheduled_visits") as any)
      .select("id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const { data: medications } = await (context.supabase.from("visit_medication_records") as any)
      .select("*")
      .eq("scheduled_visit_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    return NextResponse.json({ medications: medications || [] });
  } catch (error) {
    console.error("Error fetching medications:", error);
    return NextResponse.json({ error: "Failed to fetch medications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "visit.complete");
    if (permError) return permError;

    const supabase = context.supabase;
    const body = await request.json();
    const validatedData = recordMedicationSchema.parse(body);

    // Get visit - scoped to the caller's own org.
    const { data: visit } = await (supabase.from("scheduled_visits") as any)
      .select("organization_id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Get visit execution
    const { data: execution } = await (supabase.from("visit_executions") as any)
      .select("id")
      .eq("scheduled_visit_id", id)
      .eq("organization_id", context.organizationId)
      .in("status", ["started", "in_progress"])
      .eq("is_deleted", false)
      .single();

    if (!execution) {
      return NextResponse.json({ error: "Visit not in progress" }, { status: 400 });
    }

    // Record medication
    const { data: medication, error: medError } = await (
      supabase.from("visit_medication_records") as any
    )
      .insert({
        visit_execution_id: execution.id,
        scheduled_visit_id: id,
        medication_name: validatedData.medication_name,
        prescribed_dosage: validatedData.prescribed_dosage || null,
        administered_dosage: validatedData.administered_dosage || null,
        status: validatedData.status,
        administered_at: validatedData.status === "given" ? new Date().toISOString() : null,
        administered_by_id: validatedData.status === "given" ? context.userId : null,
        not_given_reason: validatedData.not_given_reason || null,
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (medError) throw medError;

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "visit_medication_records",
      resourceId: medication.id,
      action: "medication_recorded",
      changes: { medication: validatedData.medication_name, status: validatedData.status },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error("Error recording medication:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record medication" }, { status: 500 });
  }
}
