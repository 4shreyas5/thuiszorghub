import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "user.view");
    if (permError) return permError;

    // branches/user_roles are fetched separately, not embedded - see the
    // comment in /api/users GET for why the bare embed is ambiguous
    // (branches.manager_user_id and user_roles.assigned_by both create a
    // second FK path to/from users).
    const { data: targetUser, error } = await context.supabase
      .from("users")
      .select("id, first_name, last_name, email, phone, branch_id, is_active, created_at")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .single();

    if (error || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [{ data: userRoles }, branchResult] = await Promise.all([
      context.supabase
        .from("user_roles")
        .select("id, roles(id, name, description)")
        .eq("user_id", id),
      targetUser.branch_id
        ? context.supabase
            .from("branches")
            .select("id, name")
            .eq("id", targetUser.branch_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      data: {
        ...targetUser,
        branches: branchResult.data || null,
        user_roles: userRoles || [],
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "user.update");
    if (permError) return permError;

    const body = await request.json();
    const { firstName, lastName, phone, branchId, isActive, roleIds } = body;

    // Reassigning roles is a distinct, more sensitive privilege than
    // editing a user's own profile fields - gated separately so
    // "user.update" alone can never be used to change what a user is
    // allowed to do (up to and including granting Organization Owner).
    if (Array.isArray(roleIds)) {
      const roleError = await requirePermission(context, "user.manage");
      if (roleError) return roleError;
    }

    const { data: updatedUser, error } = await context.supabase
      .from("users")
      .update({
        first_name: firstName ?? undefined,
        last_name: lastName ?? undefined,
        phone: phone ?? undefined,
        branch_id: branchId === undefined ? undefined : branchId,
        is_active: isActive ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error || !updatedUser) {
      console.error("[users PUT] Error updating user:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Replace role assignments if provided
    if (Array.isArray(roleIds)) {
      await context.supabase.from("user_roles").delete().eq("user_id", id);

      if (roleIds.length > 0) {
        const { error: roleError } = await context.supabase.from("user_roles").insert(
          roleIds.map((roleId: string) => ({
            user_id: id,
            role_id: roleId,
            assigned_by: context.userId,
          }))
        );
        if (roleError) console.error("[users PUT] Error assigning roles:", roleError);
      }
    }

    await writeAuditLog(context, {
      eventType: "UPDATE",
      resourceType: "users",
      resourceId: id,
      action: "updated",
      changes: { new_values: body },
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Soft-remove a user from the organization (revokes access, keeps history).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const { id } = await params;

    const permError = await requirePermission(context, "user.delete");
    if (permError) return permError;

    if (id === context.userId) {
      return NextResponse.json({ error: "You cannot remove your own account" }, { status: 400 });
    }

    const { data: removedUser, error } = await context.supabase
      .from("users")
      .update({
        is_deleted: true,
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error || !removedUser) {
      console.error("[users DELETE] Error removing user:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await writeAuditLog(context, {
      eventType: "DELETE",
      resourceType: "users",
      resourceId: id,
      action: "deleted",
    });

    return NextResponse.json({ data: removedUser });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
