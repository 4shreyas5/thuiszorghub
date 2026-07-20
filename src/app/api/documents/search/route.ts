import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/permissions/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    // Search by filename and tags
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .ilike("file_name", `%${query}%`)
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ data: documents || [] });
  } catch (error) {
    console.error("Error searching documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
