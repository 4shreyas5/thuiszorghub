/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { updateVisitSchema } from "@/core/validation/visit";
import { checkVisitConflicts } from "@/core/scheduling/conflicts";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

// No permission gate beyond org membership - see visits/route.ts.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const { data: visit, error } = await (context.supabase.from("scheduled_visits") as any)
      .select(
        `*,
        client:clients(id, first_name, last_name, email, is_active),
        employee:employees(id, first_name, last_name, email, is_active),
        branch:branches(id, name),
        care_plan:care_plans(id, title, status),
        checklists:visit_checklists(*)`
      )
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (error?.code === "PGRST116" || error?.code === "22P02" || !visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    if (error) throw error;

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error fetching visit:", error);
    return NextResponse.json({ error: "Failed to fetch visit" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "visit.update");
    if (permError) return permError;

    const supabase = context.supabase;
    const body = await request.json();
    const validatedData = updateVisitSchema.parse(body);

    // Get existing visit - scoped to the caller's own org, not the row's.
    const { data: existingVisit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const organizationId = context.organizationId;

    // Validate client if changed
    if (validatedData.client_id && validatedData.client_id !== existingVisit.client_id) {
      const { data: client } = await (supabase.from("clients") as any)
        .select("id, is_active, organization_id")
        .eq("id", validatedData.client_id)
        .eq("is_deleted", false)
        .single();

      if (!client || !client.is_active) {
        return NextResponse.json({ error: "Client not found or inactive" }, { status: 400 });
      }

      if (client.organization_id !== organizationId) {
        return NextResponse.json(
          { error: "Cross-organization visit not allowed" },
          { status: 403 }
        );
      }
    }

    // Validate employee if changed
    if (validatedData.employee_id && validatedData.employee_id !== existingVisit.employee_id) {
      const { data: employee } = await (supabase.from("employees") as any)
        .select("id, is_active, organization_id")
        .eq("id", validatedData.employee_id)
        .eq("is_deleted", false)
        .single();

      if (!employee || !employee.is_active) {
        return NextResponse.json({ error: "Employee not found or inactive" }, { status: 400 });
      }

      if (employee.organization_id !== organizationId) {
        return NextResponse.json(
          { error: "Cross-organization visit not allowed" },
          { status: 403 }
        );
      }
    }

    // Check for scheduling conflicts if date/time changed
    if (
      validatedData.employee_id ||
      validatedData.scheduled_date ||
      validatedData.start_time ||
      validatedData.end_time
    ) {
      const checkEmployeeId = validatedData.employee_id || existingVisit.employee_id;
      const checkDate = validatedData.scheduled_date || existingVisit.scheduled_date;
      const checkStartTime = validatedData.start_time || existingVisit.start_time;
      const checkEndTime = validatedData.end_time || existingVisit.end_time;

      if (checkEmployeeId) {
        // Shared helper (src/core/scheduling/conflicts.ts) - see the same
        // consolidation note in POST /api/visits.
        const conflicts = await checkVisitConflicts(supabase, {
          employeeId: checkEmployeeId,
          clientId: validatedData.client_id || existingVisit.client_id,
          scheduledDate: checkDate,
          startTime: checkStartTime,
          endTime: checkEndTime,
          excludeVisitId: id,
        });

        if (conflicts.some((c) => c.type === "DOUBLE_BOOKING")) {
          return NextResponse.json(
            { error: "Employee has a scheduling conflict at this time" },
            { status: 409 }
          );
        }
      }
    }

    // Update visit
    const { data: visit, error } = await (supabase.from("scheduled_visits") as any)
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "UPDATE",
      resourceType: "scheduled_visits",
      resourceId: id,
      action: "updated",
      changes: { previous_values: existingVisit, new_values: visit },
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: organizationId,
      scheduled_visit_id: id,
      action: "updated",
      action_by_id: context.userId,
      previous_values: existingVisit,
      new_values: visit,
    });

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error updating visit:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update visit" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "visit.update");
    if (permError) return permError;

    const supabase = context.supabase;
    const body = await request.json();

    // Validated against the same schema PUT uses - this previously spread
    // the raw request body directly into the update() call with zero
    // validation, a mass-assignment gap (any column, including
    // organization_id, could be overwritten by whatever the caller sent).
    const validatedData = updateVisitSchema.parse(body);

    // Get existing visit - scoped to the caller's own org, not the row's.
    const { data: existingVisit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Update visit
    const { data: visit, error } = await (supabase.from("scheduled_visits") as any)
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "UPDATE",
      resourceType: "scheduled_visits",
      resourceId: id,
      action: "updated",
      changes: { previous_values: existingVisit, new_values: visit },
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: context.organizationId,
      scheduled_visit_id: id,
      action: "updated",
      action_by_id: context.userId,
      previous_values: existingVisit,
      new_values: visit,
    });

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error updating visit:", error);
    return NextResponse.json({ error: "Failed to update visit" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "visit.delete");
    if (permError) return permError;

    const supabase = context.supabase;

    // Get existing visit - scoped to the caller's own org, not the row's.
    const { data: existingVisit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Soft delete
    const { error } = await (supabase.from("scheduled_visits") as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "DELETE",
      resourceType: "scheduled_visits",
      resourceId: id,
      action: "deleted",
      changes: { previous_values: existingVisit },
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: context.organizationId,
      scheduled_visit_id: id,
      action: "deleted",
      action_by_id: context.userId,
      previous_values: existingVisit,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visit:", error);
    return NextResponse.json({ error: "Failed to delete visit" }, { status: 500 });
  }
}
