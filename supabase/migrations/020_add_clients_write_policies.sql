-- Same root cause and same fix pattern as migration 019 (employees):
-- clients had exactly one RLS policy (SELECT only, migration 004). With RLS
-- enabled and no INSERT/UPDATE policy, every write from the non-admin
-- client is denied unconditionally: 42501 "new row violates row-level
-- security policy for table clients".
--
-- Reuses the existing get_my_organization_id() and user_has_permission()
-- helpers (added in migrations 013 and 019) rather than inventing a new
-- mechanism, checked against the client.create / client.update permission
-- codes already seeded in migration 002.

CREATE POLICY "clients_insert_with_permission" ON clients
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('client.create')
  );

CREATE POLICY "clients_update_with_permission" ON clients
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('client.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('client.update')
  );
