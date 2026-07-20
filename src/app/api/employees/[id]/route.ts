/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { updateEmployeeSchema } from "@/core/validation/employee";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

// No permission gate beyond org membership - see employees/route.ts.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    // No is_deleted filter here on purpose: archived employees must stay
    // viewable on their own detail page (they remain in history and stay
    // linked to their past visits/assignments) - only list views default
    // to hiding archived employees.
    const { data: employee, error } = await (context.supabase.from("employees") as any)
      .select(
        `*,
        branch:branches(id, name),
        qualifications:employee_qualifications(*),
        languages:employee_languages(*),
        availability:employee_availability(*),
        unavailability:employee_unavailability(*)`
      )
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (error || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "employee.update");
    if (permError) return permError;

    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message || "Invalid employee data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updatePayload: Record<string, unknown> = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      branch_id: data.branch_id,
      employment_type: data.employment_type,
      start_date: data.start_date,
      end_date: data.end_date === undefined ? undefined : data.end_date || null,
      hourly_rate: data.hourly_rate,
      bio: data.bio,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      emergency_contact_relationship: data.emergency_contact_relationship,
      updated_at: new Date().toISOString(),
    };

    // status is the source of truth going forward - is_active/is_deleted
    // are mirrored from it in the same write so every existing consumer of
    // those two booleans (RLS, AssignmentForm's ?status=active filter,
    // dashboard counts) keeps working unchanged. A bare is_active (no
    // status) is mapped forward for back-compat with older callers.
    if (data.status !== undefined) {
      updatePayload.status = data.status;
      updatePayload.is_active = data.status === "active";
      updatePayload.is_deleted = data.status === "archived";
      updatePayload.deleted_at = data.status === "archived" ? new Date().toISOString() : null;
    } else if (data.is_active !== undefined) {
      updatePayload.is_active = data.is_active;
      updatePayload.status = data.is_active ? "active" : "inactive";
    }

    const { data: employee, error } = await (context.supabase.from("employees") as any)
      .update(updatePayload)
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    // PGRST116 ("no rows returned by .single()") and 22P02 (invalid UUID
    // syntax) both mean "no such employee" to the caller - a real 404, not
    // a server error. Any other error (a genuine constraint/column/DB
    // problem) still falls through as a real 500.
    if (error?.code === "PGRST116" || error?.code === "22P02" || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "UPDATE",
      resourceType: "employees",
      resourceId: id,
      action: "updated",
      changes: { new_values: employee },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
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

    const permError = await requirePermission(context, "employee.delete");
    if (permError) return permError;

    const { data: employee, error } = await (context.supabase.from("employees") as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false,
        status: "archived",
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error?.code === "PGRST116" || error?.code === "22P02" || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "DELETE",
      resourceType: "employees",
      resourceId: id,
      action: "deleted",
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
