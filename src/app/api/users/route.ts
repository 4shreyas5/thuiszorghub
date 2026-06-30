import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get users with their roles
    const { data: users, error: usersError, count } = await supabase
      .from("users")
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        is_active,
        created_at,
        user_roles(roles(id, name, description))
        `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id)
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
