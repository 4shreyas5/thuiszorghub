-- RLS policies required for the Administration module (Branches, Users, Roles, Permissions).
-- Migration 001 only ever defined FOR SELECT policies for these tables, so every
-- write (INSERT/UPDATE/DELETE) from the non-admin client was silently denied by
-- RLS's default-deny behavior. This mirrors the same "same organization" check
-- already used by organizations_isolation / organizations_update_own (migration 015).

-- ---------- branches ----------
CREATE POLICY "branches_insert_own_org" ON branches
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.organization_id = branches.organization_id AND users.id = auth.uid())
  );

CREATE POLICY "branches_update_own_org" ON branches
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.organization_id = branches.organization_id AND users.id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.organization_id = branches.organization_id AND users.id = auth.uid())
  );

-- ---------- roles ----------
CREATE POLICY "roles_insert_own_org" ON roles
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.organization_id = roles.organization_id AND users.id = auth.uid())
  );

CREATE POLICY "roles_update_own_org" ON roles
  FOR UPDATE
  USING (
    is_system = FALSE
    AND EXISTS (SELECT 1 FROM users WHERE users.organization_id = roles.organization_id AND users.id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.organization_id = roles.organization_id AND users.id = auth.uid())
  );

CREATE POLICY "roles_delete_own_org" ON roles
  FOR DELETE
  USING (
    is_system = FALSE
    AND EXISTS (SELECT 1 FROM users WHERE users.organization_id = roles.organization_id AND users.id = auth.uid())
  );

-- ---------- role_permissions ----------
CREATE POLICY "role_permissions_insert_own_org" ON role_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY "role_permissions_delete_own_org" ON role_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.organization_id = public.get_my_organization_id()
    )
  );

-- ---------- users (broaden beyond self-only INSERT from migration 014) ----------
CREATE POLICY "users_update_own_org" ON users
  FOR UPDATE
  USING (organization_id = public.get_my_organization_id())
  WITH CHECK (organization_id = public.get_my_organization_id());

-- ---------- user_roles ----------
CREATE POLICY "user_roles_insert_own_org" ON user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_roles.user_id AND users.organization_id = public.get_my_organization_id())
  );

CREATE POLICY "user_roles_delete_own_org" ON user_roles
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_roles.user_id AND users.organization_id = public.get_my_organization_id())
  );

-- ---------- organization_settings ----------
CREATE POLICY "organization_settings_update_own_org" ON organization_settings
  FOR UPDATE
  USING (organization_id = public.get_my_organization_id())
  WITH CHECK (organization_id = public.get_my_organization_id());
