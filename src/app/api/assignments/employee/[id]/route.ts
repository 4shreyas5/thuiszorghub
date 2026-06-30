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
        client:clients(id, first_name, last_name, is_active)`
      )
      .eq("employee_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(assignments || []);
  } catch (error) {
    console.error("Error fetching employee assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
