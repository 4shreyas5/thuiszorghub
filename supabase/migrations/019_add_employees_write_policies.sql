-- employees had exactly one RLS policy (SELECT only, migration 003). With
-- RLS enabled and no INSERT/UPDATE policy, every write from the non-admin
-- client is denied unconditionally by Postgres's default-deny behavior:
-- 42501 "new row violates row-level security policy for table employees".
--
-- Required rule: authenticated + same organization + holds the relevant
-- permission. "Admin or HR role" doesn't exist as a literal role name in
-- this schema's seed data (roles are Organization Owner, Branch Manager,
-- Scheduler, Administrator, Caregiver, Finance, Auditor) - the existing
-- RBAC model expresses this via the permissions/role_permissions tables
-- instead (employee.create / employee.update codes, seeded in migration
-- 002), so the check is done against the permission, not a role name.

CREATE OR REPLACE FUNCTION public.user_has_permission(permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND p.code = permission_code
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated, anon;

CREATE POLICY "employees_insert_with_permission" ON employees
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('employee.create')
  );

-- UPDATE was equally unprotected (same empty-policy-set problem) and would
-- have hit the identical 42501 the moment employee edit was tested next.
CREATE POLICY "employees_update_with_permission" ON employees
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('employee.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('employee.update')
  );
