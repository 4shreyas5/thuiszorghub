/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const branch = searchParams.get("branch") || "";
    const status = searchParams.get("status") || ""; // active, archived, all
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    let query = (supabase.from("employees") as any)
      .select("*")
      .eq("is_deleted", false)
      .order(sortBy, { ascending: sortOrder === "asc" });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    if (branch) {
      query = query.eq("branch_id", branch);
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "archived") {
      query = query.eq("is_active", false);
    }

    const { data: employees, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await (supabase.from("employees") as any)
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false);

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
    const { data: { user } } = await supabase.auth.getUser();

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

    const {
      firstName,
      lastName,
      email,
      phone,
      branchId,
      employmentType,
      startDate,
      hourlyRate,
    } = body;

    if (!firstName || !lastName || !email || !branchId || !employmentType || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: employee, error } = await (supabase.from("employees") as any)
      .insert({
        organization_id: userData.organization_id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        branch_id: branchId,
        employment_type: employmentType,
        start_date: startDate,
        hourly_rate: hourlyRate,
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
