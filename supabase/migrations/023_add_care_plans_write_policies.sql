-- Same root cause as employees (019), clients (020), assignments (021):
-- care_plans and every care_plan_* child table (migration 005) were given
-- only a FOR SELECT policy each. With RLS enabled and no INSERT/UPDATE
-- policy, every write is denied unconditionally: 42501 "new row violates
-- row-level security policy".
--
-- Reuses the existing get_my_organization_id() and user_has_permission()
-- helpers (migrations 013, 019) and the care_plan.create / care_plan.update
-- permission codes already seeded in migration 006. Only Care Plans tables
-- are touched here - no other table's policies are modified.

CREATE POLICY "care_plans_insert_with_permission" ON care_plans
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('care_plan.create')
  );

-- Covers both PUT /api/care-plans/[id] and the soft-delete performed by
-- DELETE /api/care-plans/[id] (is_deleted/deleted_at via UPDATE, not a
-- hard DELETE).
CREATE POLICY "care_plans_update_with_permission" ON care_plans
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('care_plan.update')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('care_plan.update')
  );

-- Goals, tasks, and reviews are child records of a care plan (no
-- organization_id of their own), scoped the same way their existing
-- SELECT policies already are: through care_plan_id -> care_plans.
CREATE POLICY "care_plan_goals_insert_with_permission" ON care_plan_goals
  FOR INSERT
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.create')
  );

CREATE POLICY "care_plan_goals_update_with_permission" ON care_plan_goals
  FOR UPDATE
  USING (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.update')
  )
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.update')
  );

CREATE POLICY "care_plan_tasks_insert_with_permission" ON care_plan_tasks
  FOR INSERT
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.create')
  );

CREATE POLICY "care_plan_tasks_update_with_permission" ON care_plan_tasks
  FOR UPDATE
  USING (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.update')
  )
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.update')
  );

CREATE POLICY "care_plan_reviews_insert_with_permission" ON care_plan_reviews
  FOR INSERT
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.create')
  );

CREATE POLICY "care_plan_reviews_update_with_permission" ON care_plan_reviews
  FOR UPDATE
  USING (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.update')
  )
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.update')
  );

-- care_plan_history is an app-written audit trail (POST/PUT/DELETE on
-- care_plans and goals insert into it) - INSERT-only, no UPDATE needed.
CREATE POLICY "care_plan_history_insert_with_permission" ON care_plan_history
  FOR INSERT
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
  );
