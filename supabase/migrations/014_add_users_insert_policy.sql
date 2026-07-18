-- Allow a newly authenticated user to create their own profile row.
-- Without this, RLS silently blocks every INSERT into users from the
-- non-admin client (42501), so /api/auth/register can never succeed
-- and no users row is ever created for new accounts.

CREATE POLICY "users_self_insert" ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());
