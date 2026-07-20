/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/core/permissions/server";

// No permission gate - read-only, feeds the client detail page's
// assignment history panel.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    // Same fix as GET /api/assignments: employee_client_assignments has no
    // branch_id/FK, so branch is reached through the client and hoisted to
    // the top level below.
    const { data: assignments, error } = await (
      context.supabase.from("employee_client_assignments") as any
    )
      .select(
        `*,
        employee:employees(id, first_name, last_name, is_active),
        client:clients(branch:branches(id, name))`
      )
      .eq("client_id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const assignmentsWithBranch = (assignments || []).map((a: any) => ({
      ...a,
      client: undefined,
      branch: a.client?.branch || null,
    }));

    return NextResponse.json(assignmentsWithBranch);
  } catch (error) {
    console.error("Error fetching client assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
