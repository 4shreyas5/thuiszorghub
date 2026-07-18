/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { createEmployeeSchema } from "@/core/validation/employee";

const VALID_STATUSES = ["active", "inactive", "on_leave", "archived"];

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
    const search = searchParams.get("search") || "";
    const branch = searchParams.get("branch") || "";
    // active | inactive | on_leave | archived | all | "" (default: everything but archived)
    const status = searchParams.get("status") || "";
    const employmentType = searchParams.get("employment_type") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Shared filter application so the data query and the count query can
    // never drift apart (previously the count query ignored search/branch/
    // status entirely, so pagination.total didn't match the filtered
    // results - a genuine bug, fixed here by applying filters once).
    const applyFilters = (q: any) => {
      q = q.eq("organization_id", userData.organization_id);

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
      (supabase.from("employees") as any).select("*, branch:branches(id, name)")
    ).order(sortBy, { ascending: sortOrder === "asc" });

    const { data: employees, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await applyFilters(
      (supabase.from("employees") as any).select("*", { count: "exact", head: true })
    );

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

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
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

    const { data: employee, error } = await (supabase.from("employees") as any)
      .insert({
        organization_id: userData.organization_id,
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

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: user.id,
      action: "create",
      entity_type: "employees",
      entity_id: employee.id,
      changes: { employee },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
