/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createVisitSchema } from "@/core/validation/visit";
import { checkVisitConflicts } from "@/core/scheduling/conflicts";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

// No permission gate beyond org membership - visit listings feed the
// scheduling calendar and multiple dashboards used by most roles.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const employeeId = searchParams.get("employeeId") || "";
    const clientId = searchParams.get("clientId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "scheduled_date";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    // Opt-in narrow projection for callers that only need to count/bucket
    // visits (e.g. the dashboard chart) rather than render them - avoids
    // pulling the client/employee/branch/care_plan joins and every column
    // on scheduled_visits when only a couple of fields are read. Every
    // other caller is unaffected (still gets the full joined shape).
    const fields = searchParams.get("fields") || "";

    const offset = (page - 1) * limit;

    let query = (supabase.from("scheduled_visits") as any)
      .select(
        fields === "minimal"
          ? "scheduled_date, status"
          : `*,
        client:clients(id, first_name, last_name, is_active),
        employee:employees(id, first_name, last_name, is_active),
        branch:branches(id, name),
        care_plan:care_plans(id, title)`,
        { count: "exact" }
      )
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false);

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (dateFrom) {
      query = query.gte("scheduled_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("scheduled_date", dateTo);
    }

    const {
      data: visits,
      error,
      count,
    } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      visits: visits || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "visit.create");
    if (permError) return permError;

    const body = await request.json();
    const validatedData = createVisitSchema.parse(body);

    // Validate client is active
    const { data: client } = await (supabase.from("clients") as any)
      .select("id, is_active, organization_id")
      .eq("id", validatedData.client_id)
      .eq("is_deleted", false)
      .single();

    if (!client || !client.is_active) {
      return NextResponse.json({ error: "Client not found or inactive" }, { status: 400 });
    }

    if (client.organization_id !== context.organizationId) {
      return NextResponse.json({ error: "Cross-organization visit not allowed" }, { status: 403 });
    }

    // Validate employee if provided
    if (validatedData.employee_id) {
      const { data: employee } = await (supabase.from("employees") as any)
        .select("id, is_active, organization_id")
        .eq("id", validatedData.employee_id)
        .eq("is_deleted", false)
        .single();

      if (!employee || !employee.is_active) {
        return NextResponse.json({ error: "Employee not found or inactive" }, { status: 400 });
      }

      if (employee.organization_id !== context.organizationId) {
        return NextResponse.json(
          { error: "Cross-organization visit not allowed" },
          { status: 403 }
        );
      }

      // Check for scheduling conflicts - shared helper (src/core/scheduling/conflicts.ts)
      // also used by /api/visits/conflicts and PUT/assign, so there's one
      // implementation instead of three. Only DOUBLE_BOOKING hard-blocks
      // creation here, preserving existing accept/reject behavior exactly -
      // the richer conflict types (unavailability, working hours, inactive
      // client) are surfaced to the form as non-blocking warnings via the
      // dedicated /api/visits/conflicts endpoint instead.
      const conflicts = await checkVisitConflicts(supabase, {
        employeeId: validatedData.employee_id,
        clientId: validatedData.client_id,
        scheduledDate: validatedData.scheduled_date,
        startTime: validatedData.start_time,
        endTime: validatedData.end_time,
      });

      if (conflicts.some((c) => c.type === "DOUBLE_BOOKING")) {
        return NextResponse.json(
          { error: "Employee has a scheduling conflict at this time" },
          { status: 409 }
        );
      }
    }

    // Calculate duration
    const start = new Date(`2000-01-01T${validatedData.start_time}`);
    const end = new Date(`2000-01-01T${validatedData.end_time}`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Create visit
    const { data: visit, error } = await (supabase.from("scheduled_visits") as any)
      .insert({
        organization_id: context.organizationId,
        client_id: validatedData.client_id,
        employee_id: validatedData.employee_id || null,
        branch_id: validatedData.branch_id,
        care_plan_id: validatedData.care_plan_id || null,
        title: validatedData.title,
        visit_type: validatedData.visit_type,
        description: validatedData.description || null,
        scheduled_date: validatedData.scheduled_date,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        estimated_duration_minutes:
          validatedData.estimated_duration_minutes || Math.round(durationMinutes),
        priority: validatedData.priority || "normal",
        status: "scheduled",
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "scheduled_visits",
      resourceId: visit.id,
      action: "created",
      changes: { new_values: validatedData },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    console.error("Error creating visit:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create visit" }, { status: 500 });
  }
}
