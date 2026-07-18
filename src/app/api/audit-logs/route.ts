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
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    // audit_logs' real columns are event_type/resource_type/resource_id
    // (see migration 001) - there is no entity_type/entity_id column on
    // this table (those only exist on the unrelated documents table).
    // Aliased back to entity_type/entity_id in the response so the
    // external contract (query params, response field names) is
    // unchanged for every existing consumer.
    let query = supabase
      .from("audit_logs")
      .select(
        `
        id,
        user_id,
        action,
        entity_type:resource_type,
        entity_id:resource_id,
        changes,
        created_at,
        users(first_name, last_name, email)
        `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id);

    if (action) {
      query = query.eq("action", action);
    }

    if (entityType) {
      query = query.eq("resource_type", entityType);
    }

    if (entityId) {
      query = query.eq("resource_id", entityId);
    }

    const {
      data: logs,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
