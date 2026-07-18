/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { checkVisitConflicts } from "@/core/scheduling/conflicts";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const conflicts = await checkVisitConflicts(supabase, {
      employeeId: body.employeeId,
      clientId: body.clientId,
      scheduledDate: body.scheduledDate,
      startTime: body.startTime,
      endTime: body.endTime,
      excludeVisitId: body.excludeVisitId,
    });

    return NextResponse.json({ conflicts, hasConflicts: conflicts.length > 0 });
  } catch (error) {
    console.error("Error checking conflicts:", error);
    return NextResponse.json({ error: "Failed to check conflicts" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const resolved = searchParams.get("resolved") === "true";

    const offset = (page - 1) * limit;

    let query = (supabase.from("visit_conflicts") as any).select(
      `*,
        visit:scheduled_visits(id, title, scheduled_date),
        employee:employees(id, first_name, last_name),
        conflictingVisit:visit_conflicts_conflicting_visit_id_fkey(id, title, scheduled_date)`
    );

    if (resolved === true || resolved === false) {
      query = query.eq("is_resolved", resolved);
    }

    const { data: conflicts, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count } = await (supabase.from("visit_conflicts") as any).select("*", {
      count: "exact",
      head: true,
    });

    return NextResponse.json({
      conflicts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conflicts:", error);
    return NextResponse.json({ error: "Failed to fetch conflicts" }, { status: 500 });
  }
}
