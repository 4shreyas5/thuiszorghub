/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateAssignmentSchema } from "@/core/validation/assignment";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: assignment, error } = await (supabase.from("employee_client_assignments") as any)
      .select(
        `*,
        employee:employees(id, first_name, last_name, role_id, is_active),
        client:clients(id, first_name, last_name, is_active),
        branch:branches(id, name)`
      )
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json();

    const validatedData = updateAssignmentSchema.parse(body);

    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate new employee if provided
    if (validatedData.employee_id) {
      const { data: employee } = await (supabase.from("employees") as any)
        .select("id, is_active, organization_id")
        .eq("id", validatedData.employee_id)
        .eq("is_deleted", false)
        .single();

      if (!employee || !employee.is_active) {
        return NextResponse.json(
          { error: "Employee not found or inactive" },
          { status: 400 }
        );
      }

      if (employee.organization_id !== userData.organization_id) {
        return NextResponse.json({ error: "Cross-organization assignment not allowed" }, { status: 403 });
      }
    }

    // Validate new client if provided
    if (validatedData.client_id) {
      const { data: client } = await (supabase.from("clients") as any)
        .select("id, is_active, organization_id")
        .eq("id", validatedData.client_id)
        .eq("is_deleted", false)
        .single();

      if (!client || !client.is_active) {
        return NextResponse.json(
          { error: "Client not found or inactive" },
          { status: 400 }
        );
      }

      if (client.organization_id !== userData.organization_id) {
        return NextResponse.json({ error: "Cross-organization assignment not allowed" }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (validatedData.employee_id !== undefined) updateData.employee_id = validatedData.employee_id;
    if (validatedData.client_id !== undefined) updateData.client_id = validatedData.client_id;
    if (validatedData.assigned_from !== undefined) updateData.assigned_from = validatedData.assigned_from;
    if (validatedData.assigned_until !== undefined) updateData.assigned_until = validatedData.assigned_until;
    if (validatedData.is_primary !== undefined) updateData.is_primary = validatedData.is_primary;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const { data: assignment, error } = await (supabase.from("employee_client_assignments") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      event_type: "UPDATE",
      resource_type: "assignments",
      resource_id: id,
      action: "updated",
      changes: { updates: updateData },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete assignment
    const { data: assignment, error } = await (supabase.from("employee_client_assignments") as any)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      event_type: "DELETE",
      resource_type: "assignments",
      resource_id: id,
      action: "archived",
      changes: { deleted_at: new Date().toISOString() },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error archiving assignment:", error);
    return NextResponse.json({ error: "Failed to archive assignment" }, { status: 500 });
  }
}
