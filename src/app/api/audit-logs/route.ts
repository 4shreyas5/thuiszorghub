import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "audit.view");
    if (permError) return permError;

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
      .eq("organization_id", context.organizationId);

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
