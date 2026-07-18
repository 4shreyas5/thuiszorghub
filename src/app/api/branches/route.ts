import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("[branches GET] Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const {
      data: branches,
      error,
      count,
    } = await supabase
      .from("branches")
      .select("*, manager:manager_user_id(id, first_name, last_name, email)", { count: "exact" })
      .eq("organization_id", userData.organization_id)
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1)
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      data: branches,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("[branches POST] Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      code,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      managerUserId,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }

    const { data: branch, error } = await supabase
      .from("branches")
      .insert({
        organization_id: userData.organization_id,
        name,
        code: code || null,
        email: email || null,
        phone: phone || null,
        manager_user_id: managerUserId || null,
        address_line_1: addressLine1 || "TBD",
        address_line_2: addressLine2 || null,
        city: city || "TBD",
        postal_code: postalCode || "TBD",
        country: country || "NL",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: branch }, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
