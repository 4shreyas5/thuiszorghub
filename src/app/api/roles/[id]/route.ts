import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "role.view");
    if (permError) return permError;

    const { data: role, error } = await context.supabase
      .from("roles")
      .select(
        "id, name, description, is_system, created_at, role_permissions(id, permissions(id, module, action, code, description))"
      )
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (error || !role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ data: role });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permCheck = await requirePermission(context, "role.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { name, description, permissionIds } = body;

    const { data: role, error } = await context.supabase
      .from("roles")
      .update({
        name: name || undefined,
        description: description ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error || !role) {
      console.error("[roles PUT] Error updating role:", error);
      const dbError = error as { code?: string } | null;
      if (dbError?.code === "23505") {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Role not found or is a system role" }, { status: 404 });
    }

    if (Array.isArray(permissionIds)) {
      await context.supabase.from("role_permissions").delete().eq("role_id", id);
      if (permissionIds.length > 0) {
        const { error: permError } = await context.supabase.from("role_permissions").insert(
          permissionIds.map((permissionId: string) => ({
            role_id: id,
            permission_id: permissionId,
          }))
        );
        if (permError) console.error("[roles PUT] Error updating permissions:", permError);
      }
    }

    return NextResponse.json({ data: role });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permCheck = await requirePermission(context, "role.delete");
    if (permCheck) return permCheck;

    const { data: role, error } = await context.supabase
      .from("roles")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error || !role) {
      console.error("[roles DELETE] Error deleting role:", error);
      return NextResponse.json(
        { error: "Role not found or cannot be deleted (system role)" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: role });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
