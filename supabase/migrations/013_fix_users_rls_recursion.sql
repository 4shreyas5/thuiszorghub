-- Fix infinite recursion (42P17) in the users table RLS policy
-- Root cause: "users_organization_isolation" policy on the users table
-- runs a subquery against the users table itself. Postgres must apply
-- the users RLS policy to evaluate that inner subquery, which re-triggers
-- the same policy -> infinite recursion.
--
-- Fix: introduce a SECURITY DEFINER helper function that reads a user's
-- organization_id bypassing RLS, then reference that function (not a
-- self-referencing subquery) from the users policy.

-- Helper function: resolves the organization_id of the currently
-- authenticated user without re-entering RLS on public.users.
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Restrict execution to authenticated/anon roles only (Supabase default roles)
GRANT EXECUTE ON FUNCTION public.get_my_organization_id() TO authenticated, anon;

-- Replace the recursive users policy
DROP POLICY IF EXISTS "users_organization_isolation" ON users;

CREATE POLICY "users_organization_isolation" ON users
  FOR SELECT USING (
    id = auth.uid()
    OR organization_id = public.get_my_organization_id()
  );
