import { NextResponse } from "next/server";
import { createServerClient } from "@/core/database/server";

export interface AuthContext {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  userId: string;
  organizationId: string;
  branchId: string | null;
}

export type AuthResult = { ok: true; context: AuthContext } | { ok: false; response: NextResponse };

/**
 * Resolves the authenticated user and their organization/branch in one
 * round trip. Every API route handler should call this first and return
 * `result.response` immediately when `ok` is false - this is the single
 * place that decides what counts as "authenticated" (rejects sessions
 * with no matching users row, and removed/deactivated users, neither of
 * which most routes checked for before).
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: unauthorized() };
  }

  const { data: userData, error } = await supabase
    .from("users")
    .select("organization_id, branch_id, is_active, is_deleted")
    .eq("id", user.id)
    .single();

  if (error || !userData || userData.is_deleted || !userData.is_active) {
    return { ok: false, response: unauthorized() };
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      organizationId: userData.organization_id,
      branchId: userData.branch_id,
    },
  };
}

/**
 * Checks a permission code (e.g. "employee.update") against the calling
 * user via the same public.user_has_permission() SQL function the RLS
 * write policies use (see supabase/migrations/019_add_employees_write_policies.sql),
 * so the application-layer check and the database-layer check can never
 * drift apart. Returns null when allowed, or a ready-to-return 403 response.
 */
export async function requirePermission(
  context: AuthContext,
  permissionCode: string
): Promise<NextResponse | null> {
  if (!(await hasPermission(context, permissionCode))) {
    return forbidden(`Missing permission: ${permissionCode}`);
  }
  return null;
}

/** Same check as requirePermission, without producing a response - for branching logic. */
export async function hasPermission(
  context: AuthContext,
  permissionCode: string
): Promise<boolean> {
  const { data, error } = await context.supabase.rpc("user_has_permission", {
    permission_code: permissionCode,
  });
  return !error && Boolean(data);
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export interface AuditLogParams {
  eventType: string;
  resourceType: string;
  resourceId: string;
  action: string;
  changes?: unknown;
}

/**
 * Writes to audit_logs using its real columns (event_type/resource_type/
 * resource_id/action/changes - there is no entity_type/entity_id column,
 * see supabase/migrations/001_create_platform_foundation.sql:135-149).
 * Failures are logged, never thrown, so a broken audit write can't fail
 * the request whose action it's recording.
 */
export async function writeAuditLog(context: AuthContext, params: AuditLogParams): Promise<void> {
  try {
    const { error } = await context.supabase.from("audit_logs").insert({
      organization_id: context.organizationId,
      user_id: context.userId,
      event_type: params.eventType,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      action: params.action,
      changes: params.changes ?? null,
    });
    if (error) console.error("[audit-log] write failed:", error);
  } catch (error) {
    console.error("[audit-log] write failed:", error);
  }
}
