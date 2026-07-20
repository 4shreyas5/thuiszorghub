import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

// GET has no permission gate beyond org membership - see branches/route.ts.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const { data: branch, error } = await context.supabase
      .from("branches")
      .select("*, manager:manager_user_id(id, first_name, last_name, email)")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (error || !branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({ data: branch });
  } catch (error) {
    console.error("Error fetching branch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "branch.update");
    if (permError) return permError;

    const body = await request.json();
    const {
      name,
      code,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      managerUserId,
      isActive,
    } = body;

    const { data: branch, error } = await context.supabase
      .from("branches")
      .update({
        name: name || undefined,
        code: code ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        manager_user_id: managerUserId === undefined ? undefined : managerUserId || null,
        address_line_1: addressLine1 || undefined,
        address_line_2: addressLine2 ?? undefined,
        city: city || undefined,
        postal_code: postalCode || undefined,
        country: country || undefined,
        is_active: isActive ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error || !branch) {
      console.error("[branches PUT] Error updating branch:", error);
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({ data: branch });
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Archive a branch: marks it inactive but keeps it visible in the branch
// list (unlike is_deleted, which hides it entirely) so status can be
// reviewed or reversed later.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "branch.delete");
    if (permError) return permError;

    const { data: branch, error } = await context.supabase
      .from("branches")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error || !branch) {
      console.error("[branches DELETE] Error archiving branch:", error);
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({ data: branch });
  } catch (error) {
    console.error("Error archiving branch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
