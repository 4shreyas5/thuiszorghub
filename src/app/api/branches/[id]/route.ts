import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

async function requireOrgContext(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;

  const { data: userData, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) } as const;
  }

  return { user, organizationId: userData.organization_id } as const;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const ctx = await requireOrgContext(supabase);
    if ("error" in ctx) return ctx.error;

    const { data: branch, error } = await supabase
      .from("branches")
      .select("*, manager:manager_user_id(id, first_name, last_name, email)")
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
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
    const supabase = await createServerClient();
    const { id } = await params;
    const ctx = await requireOrgContext(supabase);
    if ("error" in ctx) return ctx.error;

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

    const { data: branch, error } = await supabase
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
      .eq("organization_id", ctx.organizationId)
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
    const supabase = await createServerClient();
    const { id } = await params;
    const ctx = await requireOrgContext(supabase);
    if ("error" in ctx) return ctx.error;

    const { data: branch, error } = await supabase
      .from("branches")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
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
