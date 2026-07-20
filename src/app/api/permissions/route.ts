import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/permissions/server";

// No permission gate beyond auth - permissions is a global read-only
// catalog (RLS: permissions_public_read, migration 001), and the roles/
// permission-matrix UI needs every authenticated user who can reach it to
// be able to list the available codes.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const searchParams = request.nextUrl.searchParams;
    const moduleFilter = searchParams.get("module");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase.from("permissions").select("*", { count: "exact" });

    if (moduleFilter) {
      query = query.eq("module", moduleFilter);
    }

    const {
      data: permissions,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order("module", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      data: permissions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
