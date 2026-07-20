-- scheduled_visits, visit_executions, visit_task_completions,
-- visit_medication_records, and visit_notes each had exactly one RLS
-- policy (SELECT only, migrations 007/009). With RLS enabled and no
-- INSERT/UPDATE policy, every write from the non-admin client is denied
-- unconditionally: 42501 "new row violates row-level security policy".
-- This is the entire scheduling + visit-execution workflow (creating a
-- visit, starting it, completing tasks, recording medications, writing
-- clinical notes) - none of it can currently write against the real
-- database.
--
-- Reuses the existing get_my_organization_id() and user_has_permission()
-- helpers (migrations 013, 019) rather than inventing a new mechanism.
-- Same "same organization + holds the permission" shape as the
-- employees/clients/assignments/care_plans write policies added in
-- migrations 019-023.

-- ---------- scheduled_visits (has its own organization_id) ----------
CREATE POLICY "scheduled_visits_insert_with_permission" ON scheduled_visits
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('visit.create')
  );

-- Covers PUT/PATCH /api/visits/[id], POST /api/visits/assign, and the
-- status-only transitions in POST /api/visits/[id]/complete and
-- /execute/start /execute/complete (all UPDATE, not INSERT).
CREATE POLICY "scheduled_visits_update_with_permission" ON scheduled_visits
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('visit.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('visit.update')
  );

-- ---------- visit_executions (has its own organization_id) ----------
-- visit.complete is the permission actually held by the Caregiver role in
-- the seed data (migration 002) - the role that starts/completes visits
-- day to day - so execution-workflow writes are gated on that, not
-- visit.create/update which Caregiver does not hold.
CREATE POLICY "visit_executions_insert_with_permission" ON visit_executions
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('visit.complete')
  );

CREATE POLICY "visit_executions_update_with_permission" ON visit_executions
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('visit.complete')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('visit.complete')
  );

-- ---------- visit_task_completions, visit_medication_records, visit_notes ----------
-- None of these three tables has its own organization_id column - each
-- only has scheduled_visit_id (and visit_execution_id). Scoped the same
-- way care_plan_goals/tasks/reviews are scoped through care_plan_id
-- (migration 023): via a one-hop lookup through scheduled_visits, which
-- does have organization_id. INSERT-only: the app never updates a task
-- completion, medication record, or note after creation.
CREATE POLICY "visit_task_completions_insert_with_permission" ON visit_task_completions
  FOR INSERT
  WITH CHECK (
    scheduled_visit_id IN (
      SELECT id FROM scheduled_visits WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('visit.complete')
  );

CREATE POLICY "visit_medication_records_insert_with_permission" ON visit_medication_records
  FOR INSERT
  WITH CHECK (
    scheduled_visit_id IN (
      SELECT id FROM scheduled_visits WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('visit.complete')
  );

CREATE POLICY "visit_notes_insert_with_permission" ON visit_notes
  FOR INSERT
  WITH CHECK (
    scheduled_visit_id IN (
      SELECT id FROM scheduled_visits WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('visit.complete')
  );

-- ---------- visit_history ----------
-- App-written history/audit trail (POST /api/visits/[id], /complete,
-- /execute/start, /execute/complete all insert into it) - same shape as
-- care_plan_history (migration 023): INSERT-only, gated on org membership
-- and self-attribution rather than a CRUD permission, since every role
-- that can act on a visit also needs to be able to record that action in
-- its history.
CREATE POLICY "visit_history_insert_own_org" ON visit_history
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND action_by_id = auth.uid()
  );
