/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: assignments, error } = await (supabase.from("employee_client_assignments") as any)
      .select(
        `*,
        employee:employees(id, first_name, last_name, role_id, is_active),
        branch:branches(id, name)`
      )
      .eq("client_id", id)
      .eq("is_deleted", false)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(assignments || []);
  } catch (error) {
    console.error("Error fetching client assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
