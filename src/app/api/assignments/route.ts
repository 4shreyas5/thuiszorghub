/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { createAssignmentSchema } from "@/core/validation/assignment";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "assigned_from";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    const query = (supabase.from("employee_client_assignments") as any)
      .select(
        `*,
        employee:employees(id, first_name, last_name, role_id, is_active),
        client:clients(id, first_name, last_name, is_active),
        branch:branches(id, name)`,
        { count: "exact" }
      )
      .eq("is_deleted", false);

    if (status === "active") {
      const today = new Date().toISOString().split("T")[0];
      query.lte("assigned_from", today);
      query.or(`assigned_until.is.null,assigned_until.gte.${today}`);
    } else if (status === "inactive") {
      const today = new Date().toISOString().split("T")[0];
      query.gt("assigned_until", today);
    }

    const { data: assignments, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      assignments: assignments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const validatedData = createAssignmentSchema.parse(body);

    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate employee is active
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

    // Validate client is active
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

    // Check for duplicate active assignment
    const { data: existingAssignment } = await (supabase.from("employee_client_assignments") as any)
      .select("id")
      .eq("employee_id", validatedData.employee_id)
      .eq("client_id", validatedData.client_id)
      .eq("is_deleted", false)
      .single();

    if (existingAssignment) {
      return NextResponse.json(
        { error: "This assignment already exists" },
        { status: 409 }
      );
    }

    const { data: assignment, error } = await (supabase.from("employee_client_assignments") as any)
      .insert({
        organization_id: userData.organization_id,
        ...validatedData,
      })
      .select()
      .single();

    if (error) throw error;

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      event_type: "CREATE",
      resource_type: "assignments",
      resource_id: assignment.id,
      action: "created",
      changes: { assignment: validatedData },
    });

    // Auto-generate notification for assignment creation
    try {
      const { data: employee } = await (supabase.from("users") as any)
        .select("id")
        .eq("employee_id", validatedData.employee_id)
        .single();

      if (employee?.id) {
        const { data: clientData } = await (supabase.from("clients") as any)
          .select("name")
          .eq("id", validatedData.client_id)
          .single();

        await (supabase.from("notifications") as any).insert({
          organization_id: userData.organization_id,
          user_id: employee.id,
          notification_type: "assignment_created",
          title: "New Assignment",
          message: `You have been assigned to ${clientData?.name || "a client"}.`,
          action_url: `/admin/assignments`,
          entity_type: "assignments",
          entity_id: assignment.id,
          metadata: { client_id: validatedData.client_id, employee_id: validatedData.employee_id }
        });
      }
    } catch (notificationError) {
      console.error("Error creating assignment notification:", notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
