-- branches.manager_user_id existed with no foreign key, so PostgREST could
-- not embed the manager's user record (needed for the Branch Manager feature).
ALTER TABLE branches
  ADD CONSTRAINT branches_manager_user_id_fkey
  FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;
