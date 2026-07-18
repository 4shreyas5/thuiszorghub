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

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  params: {
    organizationId: string;
    userId: string;
    action: string;
    resourceId: string;
    changes?: unknown;
  }
) {
  try {
    await supabase.from("audit_logs").insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      event_type: `user.${params.action}`,
      resource_type: "users",
      resource_id: params.resourceId,
      action: params.action,
      changes: params.changes ?? null,
    });
  } catch (auditError) {
    console.error("[users] Failed to write audit log:", auditError);
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const ctx = await requireOrgContext(supabase);
    if ("error" in ctx) return ctx.error;

    // branches/user_roles are fetched separately, not embedded - see the
    // comment in /api/users GET for why the bare embed is ambiguous
    // (branches.manager_user_id and user_roles.assigned_by both create a
    // second FK path to/from users).
    const { data: targetUser, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone, branch_id, is_active, created_at")
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .eq("is_deleted", false)
      .single();

    if (error || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [{ data: userRoles }, branchResult] = await Promise.all([
      supabase.from("user_roles").select("id, roles(id, name, description)").eq("user_id", id),
      targetUser.branch_id
        ? supabase.from("branches").select("id, name").eq("id", targetUser.branch_id).single()
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
    const supabase = await createServerClient();
    const { id } = await params;
    const ctx = await requireOrgContext(supabase);
    if ("error" in ctx) return ctx.error;

    const body = await request.json();
    const { firstName, lastName, phone, branchId, isActive, roleIds } = body;

    const { data: updatedUser, error } = await supabase
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
      .eq("organization_id", ctx.organizationId)
      .select()
      .single();

    if (error || !updatedUser) {
      console.error("[users PUT] Error updating user:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Replace role assignments if provided
    if (Array.isArray(roleIds)) {
      await supabase.from("user_roles").delete().eq("user_id", id);

      if (roleIds.length > 0) {
        const { error: roleError } = await supabase.from("user_roles").insert(
          roleIds.map((roleId: string) => ({
            user_id: id,
            role_id: roleId,
            assigned_by: ctx.user.id,
          }))
        );
        if (roleError) console.error("[users PUT] Error assigning roles:", roleError);
      }
    }

    await writeAuditLog(supabase, {
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "update",
      resourceId: id,
      changes: body,
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
    const supabase = await createServerClient();
    const { id } = await params;
    const ctx = await requireOrgContext(supabase);
    if ("error" in ctx) return ctx.error;

    if (id === ctx.user.id) {
      return NextResponse.json({ error: "You cannot remove your own account" }, { status: 400 });
    }

    const { data: removedUser, error } = await supabase
      .from("users")
      .update({
        is_deleted: true,
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .select()
      .single();

    if (error || !removedUser) {
      console.error("[users DELETE] Error removing user:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await writeAuditLog(supabase, {
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "delete",
      resourceId: id,
    });

    return NextResponse.json({ data: removedUser });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
