-- care_plan_documents had exactly one RLS policy (SELECT only, migration
-- 005) and was never covered by migration 023's care-plans write-policy
-- pass (023 only touched care_plans, care_plan_goals, care_plan_tasks,
-- care_plan_reviews, care_plan_history). GET/POST
-- /api/care-plans/[id]/documents can currently read but never write
-- against the real database.
--
-- Same shape as migration 023's child-table policies: no organization_id
-- of its own, scoped one hop through care_plan_id -> care_plans, gated on
-- the same care_plan.create/update permissions used for every other
-- care-plan sub-resource.

CREATE POLICY "care_plan_documents_insert_with_permission" ON care_plan_documents
  FOR INSERT
  WITH CHECK (
    care_plan_id IN (
      SELECT id FROM care_plans WHERE organization_id = public.get_my_organization_id()
    )
    AND public.user_has_permission('care_plan.create')
  );

-- Covers the is_verified toggle and soft-delete (is_deleted/deleted_at)
-- update paths.
CREATE POLICY "care_plan_documents_update_with_permission" ON care_plan_documents
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
