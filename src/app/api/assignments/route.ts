/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { createAssignmentSchema } from "@/core/validation/assignment";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
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

    if (!userData || !userData.organization_id) {
      return NextResponse.json(
        { error: "User not found or not assigned to organization" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branch") || "";
    const employeeId = searchParams.get("employeeId") || "";
    const clientId = searchParams.get("clientId") || "";
    const sortBy = searchParams.get("sortBy") || "assigned_from";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // employee_client_assignments has no text field of its own to search,
    // and no branch_id (branch lives on the client) - both filters are
    // resolved to id lists first, then applied via .in() below, rather
    // than risking PostgREST's embedded-resource filter syntax against a
    // query shape this codebase doesn't use elsewhere.
    let matchingClientIds: string[] | null = null;
    if (branchId) {
      const { data: branchClients } = await (supabase.from("clients") as any)
        .select("id")
        .eq("organization_id", userData.organization_id)
        .eq("branch_id", branchId);
      matchingClientIds = (branchClients || []).map((c: any) => c.id);
    }

    let searchEmployeeIds: string[] = [];
    let searchClientIds: string[] = [];
    if (search) {
      const [{ data: employeesFound }, { data: clientsFound }] = await Promise.all([
        (supabase.from("employees") as any)
          .select("id")
          .eq("organization_id", userData.organization_id)
          .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`),
        (supabase.from("clients") as any)
          .select("id")
          .eq("organization_id", userData.organization_id)
          .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`),
      ]);
      searchEmployeeIds = (employeesFound || []).map((e: any) => e.id);
      searchClientIds = (clientsFound || []).map((c: any) => c.id);
    }

    // employee_client_assignments has no branch_id/FK of its own (confirmed
    // against migration 006's schema - it only has employee_id/client_id),
    // so `branch:branches(id, name)` as a bare top-level embed was an
    // invalid PostgREST relationship (PGRST200). clients.branch_id is
    // NOT NULL (migration 004), so branch is reached through the client
    // instead, then hoisted to the top level in JS below to preserve the
    // existing Assignment/AssignmentWithRelations response shape exactly.
    const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";

    const query = (supabase.from("employee_client_assignments") as any)
      .select(
        `*,
        employee:employees(id, first_name, last_name, is_active),
        client:clients(id, first_name, last_name, is_active, branch:branches(id, name))`,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id);

    if (status === "archived") {
      query.eq("is_deleted", true);
    } else {
      query.eq("is_deleted", false);
      if (status === "active") {
        const today = new Date().toISOString().split("T")[0];
        query.lte("assigned_from", today);
        query.or(`assigned_until.is.null,assigned_until.gte.${today}`);
      } else if (status === "inactive") {
        const today = new Date().toISOString().split("T")[0];
        query.gt("assigned_until", today);
      }
    }

    if (employeeId) query.eq("employee_id", employeeId);
    if (clientId) query.eq("client_id", clientId);
    if (matchingClientIds !== null) {
      query.in("client_id", matchingClientIds.length ? matchingClientIds : [NO_MATCH_ID]);
    }
    if (search) {
      if (searchEmployeeIds.length > 0 || searchClientIds.length > 0) {
        query.or(
          `employee_id.in.(${searchEmployeeIds.join(",") || NO_MATCH_ID}),client_id.in.(${searchClientIds.join(",") || NO_MATCH_ID})`
        );
      } else {
        query.eq("id", NO_MATCH_ID);
      }
    }

    const {
      data: assignments,
      count,
      error,
    } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Hoist client.branch to top-level `branch` to match the existing
    // Assignment/AssignmentWithRelations type contract (branch is a sibling
    // of employee/client, not nested under client).
    const assignmentsWithBranch = (assignments || []).map((a: any) => {
      const { branch, ...clientWithoutBranch } = a.client || {};
      return { ...a, client: clientWithoutBranch, branch: branch || null };
    });

    return NextResponse.json({
      assignments: assignmentsWithBranch,
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
      return NextResponse.json({ error: "Employee not found or inactive" }, { status: 400 });
    }

    if (employee.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: "Cross-organization assignment not allowed" },
        { status: 403 }
      );
    }

    // Validate client is active
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

    // Reject only when an existing, non-deleted assignment for the same
    // organization+employee+client has a date range that overlaps the
    // incoming one. employee_client_assignments no longer has a UNIQUE
    // (employee_id, client_id) constraint (migration 022 removed it) - a
    // caregiver can be legitimately reassigned to the same client across
    // separate, non-overlapping periods, and history must be preserved.
    // Two open/half-open ranges [a.from, a.until] and [b.from, b.until]
    // (NULL until = still ongoing) overlap iff:
    //   a.from <= (b.until ?? infinity) AND (a.until ?? infinity) >= b.from
    const newFrom = validatedData.assigned_from;
    const newUntil = validatedData.assigned_until || "9999-12-31";

    const { data: existingAssignment } = await (supabase.from("employee_client_assignments") as any)
      .select("id")
      .eq("organization_id", userData.organization_id)
      .eq("employee_id", validatedData.employee_id)
      .eq("client_id", validatedData.client_id)
      .eq("is_deleted", false)
      .lte("assigned_from", newUntil)
      .or(`assigned_until.is.null,assigned_until.gte.${newFrom}`)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json({ error: "This assignment already exists" }, { status: 409 });
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
          metadata: { client_id: validatedData.client_id, employee_id: validatedData.employee_id },
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
