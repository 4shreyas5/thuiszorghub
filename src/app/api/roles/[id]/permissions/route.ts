import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/permissions/server";

// Toggle a single permission on a role - used by the permission matrix grid.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id: roleId } = await params;

    const permCheck = await requirePermission(context, "role.update");
    if (permCheck) return permCheck;

    const { permissionId } = await request.json();
    if (!permissionId) {
      return NextResponse.json({ error: "permissionId is required" }, { status: 400 });
    }

    const { data: role } = await context.supabase
      .from("roles")
      .select("id")
      .eq("id", roleId)
      .eq("organization_id", context.organizationId)
      .single();

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const { error } = await context.supabase
      .from("role_permissions")
      .insert({ role_id: roleId, permission_id: permissionId });

    if (error) {
      console.error("[role permissions POST] Error:", error);
      const dbError = error as { code?: string };
      if (dbError?.code === "23505") {
        return NextResponse.json({ data: { alreadyAssigned: true } });
      }
      throw error;
    }

    return NextResponse.json({ data: { assigned: true } }, { status: 201 });
  } catch (error) {
    console.error("Error assigning permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id: roleId } = await params;

    const permCheck = await requirePermission(context, "role.update");
    if (permCheck) return permCheck;

    const permissionId = request.nextUrl.searchParams.get("permissionId");
    if (!permissionId) {
      return NextResponse.json({ error: "permissionId is required" }, { status: 400 });
    }

    const { data: role } = await context.supabase
      .from("roles")
      .select("id")
      .eq("id", roleId)
      .eq("organization_id", context.organizationId)
      .single();

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const { error } = await context.supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("permission_id", permissionId);

    if (error) throw error;

    return NextResponse.json({ data: { removed: true } });
  } catch (error) {
    console.error("Error removing permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
