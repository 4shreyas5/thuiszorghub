import { createServerAdminClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission, writeAuditLog } from "@/core/permissions/server";

// "pending" vs "accepted" isn't tracked in public.users - it's derived from
// Supabase Auth's own record of whether the invited account has confirmed
// its email / set a password yet (email_confirmed_at). Bounded to the
// current page of results, not the whole project.
async function getInvitationStatuses(
  userIds: string[]
): Promise<Map<string, "pending" | "accepted">> {
  const statusMap = new Map<string, "pending" | "accepted">();
  if (userIds.length === 0) return statusMap;

  try {
    const adminClient = await createServerAdminClient();
    const results = await Promise.all(userIds.map((id) => adminClient.auth.admin.getUserById(id)));
    results.forEach((result, index) => {
      const authUser = result?.data?.user;
      statusMap.set(userIds[index], authUser?.email_confirmed_at ? "accepted" : "pending");
    });
  } catch (error) {
    console.error("[users] Error fetching invitation statuses:", error);
  }

  return statusMap;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;
    const supabase = context.supabase;

    const permError = await requirePermission(context, "user.view");
    if (permError) return permError;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // NOTE: branches and user_roles are deliberately NOT embedded here.
    // Both would be ambiguous PostgREST embeds (PGRST201) because there is
    // more than one FK path between the tables involved:
    //   users.branch_id -> branches.id   AND   branches.manager_user_id -> users.id
    //   user_roles.user_id -> users.id   AND   user_roles.assigned_by -> users.id
    // A bare `branches(...)` or `user_roles(...)` embed can't tell PostgREST
    // which relationship to use, so the whole query throws and this endpoint
    // 500s. Fetching them separately and merging in JS sidesteps the
    // ambiguity entirely (the roles(...) embed below is safe: role_id is
    // the only FK from user_roles to roles).
    const {
      data: users,
      error: usersError,
      count,
    } = await supabase
      .from("users")
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        branch_id,
        is_active,
        created_at
        `,
        { count: "exact" }
      )
      .eq("organization_id", context.organizationId)
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("[users GET] Error fetching users list:", usersError);
      throw usersError;
    }

    console.log("[users GET] rows returned:", users?.length ?? 0);

    const userIds = (users || []).map((u) => u.id);
    const branchIds = Array.from(
      new Set((users || []).map((u) => u.branch_id).filter((id): id is string => Boolean(id)))
    );

    const [rolesResult, branchesResult, authStatusResult] = await Promise.all([
      userIds.length > 0
        ? supabase
            .from("user_roles")
            .select("user_id, id, roles(id, name, description)")
            .in("user_id", userIds)
        : Promise.resolve({ data: [], error: null }),
      branchIds.length > 0
        ? supabase.from("branches").select("id, name").in("id", branchIds)
        : Promise.resolve({ data: [], error: null }),
      getInvitationStatuses(userIds),
    ]);

    if (rolesResult.error) console.error("[users GET] Error fetching roles:", rolesResult.error);
    if (branchesResult.error)
      console.error("[users GET] Error fetching branches:", branchesResult.error);

    const rolesByUserId = new Map<
      string,
      Array<{ id: string; roles: { id: string; name: string; description: string | null } }>
    >();
    for (const ur of rolesResult.data || []) {
      const list = rolesByUserId.get(ur.user_id) || [];
      list.push({
        id: ur.id,
        roles: ur.roles as unknown as { id: string; name: string; description: string | null },
      });
      rolesByUserId.set(ur.user_id, list);
    }

    const branchById = new Map((branchesResult.data || []).map((b) => [b.id, b]));

    const enrichedUsers = (users || []).map((u) => ({
      ...u,
      branches: u.branch_id ? branchById.get(u.branch_id) || null : null,
      user_roles: rolesByUserId.get(u.id) || [],
      invitationStatus: authStatusResult.get(u.id) || "accepted",
    }));

    return NextResponse.json({
      data: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Invite a new user into the organization. Creates the auth account (via
// Supabase Admin API, which sends the invite email) and the matching
// public.users row in the same request, since users.organization_id is
// NOT NULL and only the inviter (an existing org member) can supply it.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { context } = auth;

    const permError = await requirePermission(context, "user.invite");
    if (permError) return permError;

    const body = await request.json();
    const { email, firstName, lastName, branchId, roleId } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Assigning a role at invite time is the same sensitive action as
    // reassigning roles via PUT /api/users/[id] - gated the same way, so
    // "user.invite" alone can never be used to invite someone straight
    // into a privileged role.
    if (roleId) {
      const roleError = await requirePermission(context, "user.manage");
      if (roleError) return roleError;
    }

    const adminClient = await createServerAdminClient();

    console.log("[users POST] Inviting user:", email, "into org:", context.organizationId);

    let authUserId: string;
    let isExistingAccount = false;

    // redirectTo must land the invited user on the page that lets them set
    // a password (that page already works via the browser client's
    // detectSessionInUrl - it just was never being linked to, since no
    // redirectTo was passed here, so Supabase fell back to its default
    // Site URL and the invite silently signed people in with no password
    // set and no prompt to create one). Must also be present in Supabase's
    // Auth > URL Configuration > Redirect URLs allow-list, or Supabase
    // ignores it and falls back to the Site URL again.
    const inviteRedirectTo = `${request.nextUrl.origin}/auth/reset-password`;
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: inviteRedirectTo,
      }
    );

    if (inviteError || !invited?.user) {
      const alreadyExists = /already.*(registered|exists)/i.test(inviteError?.message || "");

      if (!alreadyExists) {
        console.error("[users POST] Error inviting user:", inviteError);
        return NextResponse.json(
          { error: inviteError?.message || "Failed to send invitation" },
          { status: 400 }
        );
      }

      // Email already has a Supabase Auth account - do NOT create a second
      // one. Find it and attach it to this organization instead.
      console.log(
        "[users POST] Email already has an auth account, attaching instead of inviting:",
        email
      );
      const { data: listResult, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listError) {
        console.error("[users POST] Error listing users to find existing account:", listError);
        return NextResponse.json({ error: "Failed to look up existing account" }, { status: 500 });
      }

      const existingAuthUser = listResult?.users?.find(
        (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (!existingAuthUser) {
        console.error("[users POST] Could not locate existing auth account for:", email);
        return NextResponse.json({ error: "Failed to send invitation" }, { status: 400 });
      }

      authUserId = existingAuthUser.id;
      isExistingAccount = true;

      const { data: existingProfile } = await adminClient
        .from("users")
        .select("id, organization_id, is_deleted")
        .eq("id", authUserId)
        .maybeSingle();

      if (
        existingProfile &&
        !existingProfile.is_deleted &&
        existingProfile.organization_id !== context.organizationId
      ) {
        return NextResponse.json(
          { error: "This email already belongs to a user in another organization" },
          { status: 409 }
        );
      }
    } else {
      authUserId = invited.user.id;
    }

    // Insert (new invite) or attach (existing account / previously removed
    // user) the profile row for this organization.
    const { data: newUser, error: upsertError } = await adminClient
      .from("users")
      .upsert({
        id: authUserId,
        organization_id: context.organizationId,
        branch_id: branchId || null,
        first_name: firstName || "",
        last_name: lastName || "",
        email,
        is_active: true,
        is_deleted: false,
        deleted_at: null,
      })
      .select()
      .single();

    if (upsertError) {
      console.error("[users POST] Error creating/attaching user profile:", upsertError);
      if (!isExistingAccount) {
        // Roll back the auth invite so retrying doesn't hit "already invited"
        await adminClient.auth.admin.deleteUser(authUserId);
      }
      throw upsertError;
    }

    if (roleId) {
      const { error: roleAssignError } = await adminClient
        .from("user_roles")
        .upsert(
          { user_id: newUser.id, role_id: roleId, assigned_by: context.userId },
          { onConflict: "user_id,role_id" }
        );

      if (roleAssignError) {
        console.error("[users POST] Error assigning role:", roleAssignError);
      }
    }

    console.log(
      "[users POST]",
      isExistingAccount ? "Existing account attached:" : "User invited successfully:",
      newUser.id
    );

    await writeAuditLog(context, {
      eventType: "CREATE",
      resourceType: "users",
      resourceId: newUser.id,
      action: "invited",
      changes: { new_values: { email, firstName, lastName, branchId, roleId } },
    });

    return NextResponse.json({ data: newUser, isExistingAccount }, { status: 201 });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
