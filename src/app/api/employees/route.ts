/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createEmployeeSchema } from "@/core/validation/employee";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

const VALID_STATUSES = ["active", "inactive", "on_leave", "archived"];

// Deliberately no permission gate on GET beyond org membership: employee
// names/ids feed pickers on Assignments/Care Plans/Visits/Scheduling/
// Reports used by most roles for everyday work - only the mutation
// endpoints below are gated.
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
    const branch = searchParams.get("branch") || "";
    // active | inactive | on_leave | archived | all | "" (default: everything but archived)
    const status = searchParams.get("status") || "";
    const employmentType = searchParams.get("employment_type") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Shared filter application, reused for the single query below. This
    // used to back two separate round trips (a data query and a second,
    // identically-filtered count-only query) - now count comes from the
    // same query via { count: "exact" }, halving the round trips with no
    // change to which rows are counted.
    const applyFilters = (q: any) => {
      q = q.eq("organization_id", context.organizationId);

      if (search) {
        q = q.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }
      if (branch) {
        q = q.eq("branch_id", branch);
      }
      if (employmentType) {
        q = q.eq("employment_type", employmentType);
      }
      if (VALID_STATUSES.includes(status)) {
        q = q.eq("status", status);
      } else if (status !== "all") {
        // Default view excludes archived employees, matching prior behavior.
        q = q.neq("status", "archived");
      }
      return q;
    };

    const query = applyFilters(
      (supabase.from("employees") as any).select("*, branch:branches(id, name)", {
        count: "exact",
      })
    ).order(sortBy, { ascending: sortOrder === "asc" });

    const { data: employees, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      employees: employees || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const permError = await requirePermission(context, "employee.create");
    if (permError) return permError;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
    }
    const parsed = createEmployeeSchema.safeParse(body);

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

    const { data: employee, error } = await (context.supabase.from("employees") as any)
      .insert({
        organization_id: context.organizationId,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        branch_id: data.branch_id,
        employment_type: data.employment_type,
        start_date: data.start_date,
        end_date: data.end_date || null,
        hourly_rate: data.hourly_rate ?? null,
        bio: data.bio || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        status: "active",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "employees",
      resourceId: employee.id,
      action: "created",
      changes: { new_values: employee },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
