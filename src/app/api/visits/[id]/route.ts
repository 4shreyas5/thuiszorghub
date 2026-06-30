/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateVisitSchema } from "@/core/validation/visit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data: visit, error } = await (supabase.from("scheduled_visits") as any)
      .select(
        `*,
        client:clients(id, first_name, last_name, email, is_active),
        employee:employees(id, first_name, last_name, email, is_active),
        branch:branches(id, name),
        care_plan:care_plans(id, title, status),
        checklists:visit_checklists(*)`
      )
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) throw error;
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error fetching visit:", error);
    return NextResponse.json({ error: "Failed to fetch visit" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateVisitSchema.parse(body);

    // Get existing visit
    const { data: existingVisit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const organizationId = existingVisit.organization_id;

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
        return NextResponse.json({ error: "Cross-organization visit not allowed" }, { status: 403 });
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
        return NextResponse.json({ error: "Cross-organization visit not allowed" }, { status: 403 });
      }
    }

    // Check for scheduling conflicts if date/time changed
    if (validatedData.employee_id || validatedData.scheduled_date || validatedData.start_time || validatedData.end_time) {
      const checkEmployeeId = validatedData.employee_id || existingVisit.employee_id;
      const checkDate = validatedData.scheduled_date || existingVisit.scheduled_date;
      const checkStartTime = validatedData.start_time || existingVisit.start_time;
      const checkEndTime = validatedData.end_time || existingVisit.end_time;

      if (checkEmployeeId) {
        const { data: conflicts } = await (supabase.from("scheduled_visits") as any)
          .select("*")
          .eq("organization_id", organizationId)
          .eq("employee_id", checkEmployeeId)
          .eq("scheduled_date", checkDate)
          .neq("id", id)
          .eq("is_deleted", false);

        const hasConflict = conflicts?.some((visit: any) => {
          const visitStart = new Date(`2000-01-01T${visit.start_time}`);
          const visitEnd = new Date(`2000-01-01T${visit.end_time}`);
          const newStart = new Date(`2000-01-01T${checkStartTime}`);
          const newEnd = new Date(`2000-01-01T${checkEndTime}`);

          return !(newEnd <= visitStart || newStart >= visitEnd);
        });

        if (hasConflict) {
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
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: organizationId,
      user_id: user.id,
      event_type: "UPDATE",
      resource_type: "scheduled_visits",
      resource_id: id,
      action: "updated",
      changes: { previous_values: existingVisit, new_values: visit }
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: organizationId,
      scheduled_visit_id: id,
      action: "updated",
      action_by_id: user.id,
      previous_values: existingVisit,
      new_values: visit
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get existing visit
    const { data: existingVisit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Update visit
    const { data: visit, error } = await (supabase.from("scheduled_visits") as any)
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: existingVisit.organization_id,
      user_id: user.id,
      event_type: "UPDATE",
      resource_type: "scheduled_visits",
      resource_id: id,
      action: "updated",
      changes: { previous_values: existingVisit, new_values: visit }
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: existingVisit.organization_id,
      scheduled_visit_id: id,
      action: "updated",
      action_by_id: user.id,
      previous_values: existingVisit,
      new_values: visit
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
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing visit
    const { data: existingVisit } = await (supabase.from("scheduled_visits") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Soft delete
    const { error } = await (supabase.from("scheduled_visits") as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: existingVisit.organization_id,
      user_id: user.id,
      event_type: "DELETE",
      resource_type: "scheduled_visits",
      resource_id: id,
      action: "deleted",
      changes: { previous_values: existingVisit }
    });

    // Log to visit history
    await (supabase.from("visit_history") as any).insert({
      organization_id: existingVisit.organization_id,
      scheduled_visit_id: id,
      action: "deleted",
      action_by_id: user.id,
      previous_values: existingVisit
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visit:", error);
    return NextResponse.json({ error: "Failed to delete visit" }, { status: 500 });
  }
}
