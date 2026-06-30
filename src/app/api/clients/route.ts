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
    const status = searchParams.get("status") || ""; // all, active, archived
    const caseStatus = searchParams.get("caseStatus") || "";
    const branch = searchParams.get("branch") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    let query = (supabase.from("clients") as any)
      .select(`*,
        branch:branches(id, name),
        address:client_addresses(id, address_line_1, city, postal_code, is_primary)
      `)
      .eq("is_deleted", false)
      .order(sortBy, { ascending: sortOrder === "asc" });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "archived") {
      query = query.eq("is_active", false);
    }

    if (caseStatus) {
      query = query.eq("case_status", caseStatus);
    }

    if (branch) {
      query = query.eq("branch_id", branch);
    }

    const { data: clients, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await (supabase.from("clients") as any)
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false);

    return NextResponse.json({
      clients: clients || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const {
      first_name,
      last_name,
      date_of_birth,
      email,
      phone,
      branch_id,
      case_status,
      risk_level,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      address_line_1,
      address_line_2,
      postal_code,
      city,
      country,
      insurance_provider,
      policy_number,
    } = body;

    if (!first_name || !last_name || !branch_id || !case_status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: userData } = await (supabase.from("users") as any)
      .select("organization_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for duplicate email if provided
    if (email) {
      const { data: existing } = await (supabase.from("clients") as any)
        .select("id")
        .eq("email", email)
        .eq("organization_id", userData.organization_id)
        .eq("is_deleted", false);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: "A client with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Create client
    const { data: client, error: clientError } = await (supabase.from("clients") as any)
      .insert({
        organization_id: userData.organization_id,
        branch_id,
        first_name,
        last_name,
        date_of_birth,
        email,
        phone,
        case_status,
        risk_level,
        emergency_contact_name,
        emergency_contact_phone,
        notes,
        is_active: true,
      })
      .select()
      .single();

    if (clientError) throw clientError;

    // Create address if provided
    if (address_line_1 || postal_code || city) {
      await (supabase.from("client_addresses") as any).insert({
        client_id: client.id,
        address_type: "primary",
        address_line_1: address_line_1 || "",
        address_line_2,
        postal_code: postal_code || "",
        city: city || "",
        country: country || "Netherlands",
        is_primary: true,
      });
    }

    // Create insurance info if provided
    if (insurance_provider || policy_number) {
      await (supabase.from("client_insurance") as any).insert({
        client_id: client.id,
        insurance_provider,
        policy_number,
      });
    }

    // Log to audit logs
    await (supabase.from("audit_logs") as any).insert({
      organization_id: userData.organization_id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      event_type: "CREATE",
      resource_type: "clients",
      resource_id: client.id,
      action: "created",
      changes: { new_values: client },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
