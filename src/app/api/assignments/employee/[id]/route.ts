/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/permissions/server";

// No permission gate - read-only, feeds the employee detail page's
// assignment history panel.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const { data: assignments, error } = await (
      context.supabase.from("employee_client_assignments") as any
    )
      .select(
        `*,
        client:clients(id, first_name, last_name, is_active)`
      )
      .eq("employee_id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(assignments || []);
  } catch (error) {
    console.error("Error fetching employee assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
