/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { updateAssignmentSchema } from "@/core/validation/assignment";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Same fix as GET /api/assignments: employee_client_assignments has no
    // branch_id/FK, so branch is reached through the client (which has a
    // NOT NULL branch_id) and hoisted to the top level below.
    //
    // Deliberately NOT using .single() here: it throws on zero rows
    // (PGRST116) exactly the same way it throws on a genuine query/RLS
    // error, so a real 500-class failure and a legitimate "no such id"
    // were being collapsed into the same fake 404. Fetching as a list and
    // branching on rows.length keeps those two cases distinguishable.
    const { data: rows, error } = await (supabase.from("employee_client_assignments") as any)
      .select(
        `*,
        employee:employees(id, first_name, last_name, is_active),
        client:clients(id, first_name, last_name, is_active, branch:branches(id, name))`
      )
      .eq("id", id)
      .eq("is_deleted", false);

    if (error) {
      // A real query/RLS/embed failure, not "doesn't exist" - surface it
      // as a server error instead of silently reporting 404.
      console.error("GET /api/assignments/[id] query error", { id, error });
      return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
    }

    const assignment = rows?.[0];

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const { branch, ...clientWithoutBranch } = assignment.client || {};
    return NextResponse.json({
      ...assignment,
      client: clientWithoutBranch,
      branch: branch || null,
    });
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
        return NextResponse.json({ error: "Employee not found or inactive" }, { status: 400 });
      }

      if (employee.organization_id !== userData.organization_id) {
        return NextResponse.json(
          { error: "Cross-organization assignment not allowed" },
          { status: 403 }
        );
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
        return NextResponse.json({ error: "Client not found or inactive" }, { status: 400 });
      }

      if (client.organization_id !== userData.organization_id) {
        return NextResponse.json(
          { error: "Cross-organization assignment not allowed" },
          { status: 403 }
        );
      }
    }

    // Re-run the same overlap check POST does, whenever a field that
    // affects the range being checked changes - previously PUT could move
    // an assignment's dates/employee/client into a range that overlapped
    // an existing assignment for the same pair, bypassing the protection
    // POST provides entirely.
    if (
      validatedData.employee_id !== undefined ||
      validatedData.client_id !== undefined ||
      validatedData.assigned_from !== undefined ||
      validatedData.assigned_until !== undefined
    ) {
      const { data: current } = await (supabase.from("employee_client_assignments") as any)
        .select("employee_id, client_id, assigned_from, assigned_until")
        .eq("id", id)
        .single();

      if (current) {
        const finalEmployeeId = validatedData.employee_id ?? current.employee_id;
        const finalClientId = validatedData.client_id ?? current.client_id;
        const finalFrom = validatedData.assigned_from ?? current.assigned_from;
        const finalUntil = (validatedData.assigned_until ?? current.assigned_until) || "9999-12-31";

        const { data: existingAssignment } = await (
          supabase.from("employee_client_assignments") as any
        )
          .select("id")
          .eq("organization_id", userData.organization_id)
          .eq("employee_id", finalEmployeeId)
          .eq("client_id", finalClientId)
          .eq("is_deleted", false)
          .neq("id", id)
          .lte("assigned_from", finalUntil)
          .or(`assigned_until.is.null,assigned_until.gte.${finalFrom}`)
          .maybeSingle();

        if (existingAssignment) {
          return NextResponse.json({ error: "This assignment already exists" }, { status: 409 });
        }
      }
    }

    const updateData: any = {};
    if (validatedData.employee_id !== undefined) updateData.employee_id = validatedData.employee_id;
    if (validatedData.client_id !== undefined) updateData.client_id = validatedData.client_id;
    if (validatedData.assigned_from !== undefined)
      updateData.assigned_from = validatedData.assigned_from;
    if (validatedData.assigned_until !== undefined)
      updateData.assigned_until = validatedData.assigned_until;
    if (validatedData.is_primary !== undefined) updateData.is_primary = validatedData.is_primary;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.is_deleted !== undefined) {
      updateData.is_deleted = validatedData.is_deleted;
      updateData.deleted_at = validatedData.is_deleted ? new Date().toISOString() : null;
    }

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
