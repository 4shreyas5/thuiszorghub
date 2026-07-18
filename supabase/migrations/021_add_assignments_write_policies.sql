-- Same root cause and same fix pattern as migrations 019 (employees) and
-- 020 (clients): employee_client_assignments had exactly one RLS policy
-- (SELECT only, migration 006). With RLS enabled and no INSERT/UPDATE
-- policy, every write is denied unconditionally: 42501 "new row violates
-- row-level security policy for table employee_client_assignments".
--
-- Reuses the existing get_my_organization_id() and user_has_permission()
-- helpers (migrations 013 and 019) rather than inventing a new mechanism,
-- checked against the assignment.create / assignment.update permission
-- codes already seeded in migration 006.

CREATE POLICY "assignments_insert_with_permission" ON employee_client_assignments
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('assignment.create')
  );

-- UPDATE (used by PUT /api/assignments/[id] and soft-delete via DELETE
-- handler) was equally unprotected and would have hit the identical 42501
-- the moment assignment edit/archive was tested next.
CREATE POLICY "assignments_update_with_permission" ON employee_client_assignments
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('assignment.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('assignment.update')
  );
