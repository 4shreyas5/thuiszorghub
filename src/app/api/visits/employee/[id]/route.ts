/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const searchParams = _request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all"; // all, today, upcoming, past

    let query = (context.supabase.from("scheduled_visits") as any)
      .select(
        `*,
        client:clients(id, first_name, last_name, is_active),
        branch:branches(id, name)`
      )
      .eq("employee_id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .order("scheduled_date", { ascending: true });

    const today = new Date().toISOString().split("T")[0];

    if (filter === "today") {
      query = query.eq("scheduled_date", today);
    } else if (filter === "upcoming") {
      query = query.gte("scheduled_date", today);
    } else if (filter === "past") {
      query = query.lt("scheduled_date", today);
    }

    const { data: visits, error } = await query;

    if (error) throw error;

    return NextResponse.json(visits || []);
  } catch (error) {
    console.error("Error fetching employee visits:", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
