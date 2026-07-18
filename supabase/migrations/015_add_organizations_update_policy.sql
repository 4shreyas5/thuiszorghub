-- Allow an organization's own members to update it.
-- Only a FOR SELECT policy existed on organizations, so RLS silently
-- denied every UPDATE from the non-admin client (0 rows affected,
-- no error) -- PUT /api/organization's .select().single() then threw
-- PGRST116 because zero rows came back, not because the row was missing.

CREATE POLICY "organizations_update_own" ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = organizations.id
      AND users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = organizations.id
      AND users.id = auth.uid()
    )
  );
