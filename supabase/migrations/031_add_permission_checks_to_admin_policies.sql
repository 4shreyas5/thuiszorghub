-- Part 1 (RBAC enforcement) of the Production Hardening Sprint found that
-- roles, role_permissions, user_roles, branches, users, organizations,
-- and organization_settings all have write RLS policies (migration 001 +
-- 013-016) that check ONLY "does this row belong to my organization" -
-- none of them check the calling user's permissions. Combined with zero
-- application-layer permission checks (fixed separately, in the API route
-- handlers themselves), this meant any authenticated org member - a
-- Caregiver, a Finance user, anyone - could create a custom role with
-- every permission, assign it to themselves via user_roles, and become a
-- full Organization Owner. Concretely:
--
--   1. POST /api/roles with permissionIds = every permission in the org
--   2. PUT /api/users/{self} with roleIds = [that new role's id]
--
-- Both steps were previously allowed by RLS (both are "same org" writes)
-- with no application-layer check either. This migration closes the gap
-- at the database layer to match the application-layer fix, so the
-- database itself refuses privilege escalation even if a future code
-- change regresses the application-layer check.
--
-- Reuses user_has_permission() (migration 019). Every DROP/CREATE pair
-- below reproduces the original policy's condition unchanged and adds
-- exactly one `AND public.user_has_permission(...)` clause - no other
-- behavior changes.

-- ---------- roles ----------
DROP POLICY IF EXISTS "roles_insert_own_org" ON roles;
CREATE POLICY "roles_insert_with_permission" ON roles
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('role.create')
  );

DROP POLICY IF EXISTS "roles_update_own_org" ON roles;
CREATE POLICY "roles_update_with_permission" ON roles
  FOR UPDATE
  USING (
    is_system = FALSE
    AND organization_id = public.get_my_organization_id()
    AND public.user_has_permission('role.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('role.update')
  );

DROP POLICY IF EXISTS "roles_delete_own_org" ON roles;
CREATE POLICY "roles_delete_with_permission" ON roles
  FOR DELETE
  USING (
    is_system = FALSE
    AND organization_id = public.get_my_organization_id()
    AND public.user_has_permission('role.delete')
  );

-- ---------- role_permissions ----------
-- Gated on role.update (matches the app: assigning/removing a permission
-- from a role is done via PUT /api/roles/[id] and
-- POST|DELETE /api/roles/[id]/permissions, both requiring role.update).
DROP POLICY IF EXISTS "role_permissions_insert_own_org" ON role_permissions;
CREATE POLICY "role_permissions_insert_with_permission" ON role_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('role.update')
  );

DROP POLICY IF EXISTS "role_permissions_delete_own_org" ON role_permissions;
CREATE POLICY "role_permissions_delete_with_permission" ON role_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('role.update')
  );

-- ---------- users ----------
-- Covers PUT /api/users/[id]'s base-field update (name/phone/branch/
-- isActive) and DELETE's soft-remove. Role reassignment is a separate
-- table (user_roles, below) with its own, stricter gate.
DROP POLICY IF EXISTS "users_update_own_org" ON users;
CREATE POLICY "users_update_with_permission" ON users
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('user.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('user.update')
  );

-- ---------- user_roles ----------
-- This is the table that made self-promotion to Organization Owner
-- possible - gated on user.manage specifically (not user.update), a
-- separate, more sensitive permission that only the Owner role holds in
-- the seed data (migration 002), matching the same distinction already
-- made in PUT /api/users/[id] and POST /api/users (inviting with a role).
DROP POLICY IF EXISTS "user_roles_insert_own_org" ON user_roles;
CREATE POLICY "user_roles_insert_with_permission" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_roles.user_id AND users.organization_id = public.get_my_organization_id())
    AND public.user_has_permission('user.manage')
  );

DROP POLICY IF EXISTS "user_roles_delete_own_org" ON user_roles;
CREATE POLICY "user_roles_delete_with_permission" ON user_roles
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_roles.user_id AND users.organization_id = public.get_my_organization_id())
    AND public.user_has_permission('user.manage')
  );

-- ---------- branches ----------
DROP POLICY IF EXISTS "branches_insert_own_org" ON branches;
CREATE POLICY "branches_insert_with_permission" ON branches
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('branch.create')
  );

DROP POLICY IF EXISTS "branches_update_own_org" ON branches;
CREATE POLICY "branches_update_with_permission" ON branches
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('branch.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('branch.update')
  );

-- ---------- organizations ----------
DROP POLICY IF EXISTS "organizations_update_own" ON organizations;
CREATE POLICY "organizations_update_with_permission" ON organizations
  FOR UPDATE
  USING (
    id = public.get_my_organization_id()
    AND public.user_has_permission('organization.update')
  )
  WITH CHECK (
    id = public.get_my_organization_id()
    AND public.user_has_permission('organization.update')
  );

-- ---------- organization_settings ----------
DROP POLICY IF EXISTS "organization_settings_update_own_org" ON organization_settings;
CREATE POLICY "organization_settings_update_with_permission" ON organization_settings
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('settings.manage')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('settings.manage')
  );
