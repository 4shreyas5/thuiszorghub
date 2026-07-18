/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateEmployeeSchema } from "@/core/validation/employee";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // No is_deleted filter here on purpose: archived employees must stay
    // viewable on their own detail page (they remain in history and stay
    // linked to their past visits/assignments) - only list views default
    // to hiding archived employees.
    const { data: employee, error } = await (supabase.from("employees") as any)
      .select(
        `*,
        branch:branches(id, name),
        qualifications:employee_qualifications(*),
        languages:employee_languages(*),
        availability:employee_availability(*),
        unavailability:employee_unavailability(*)`
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!employee) {
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
    const supabase = await createServerClient();
    const { id } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

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

    const { data: employee, error } = await (supabase.from("employees") as any)
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Log to audit logs
    if (userData) {
      await (supabase.from("audit_logs") as any).insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        action: "update",
        entity_type: "employees",
        entity_id: id,
        changes: { employee },
      });
    }

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
    const supabase = await createServerClient();
    const { id } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: employee, error } = await (supabase.from("employees") as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false,
        status: "archived",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Log to audit logs
    if (userData) {
      await (supabase.from("audit_logs") as any).insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        action: "delete",
        entity_type: "employees",
        entity_id: id,
      });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
