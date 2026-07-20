-- invoice_items, payments, and timesheets each had exactly one RLS policy
-- (SELECT only, migration 008). invoices itself already has INSERT/UPDATE
-- (migration 008), but its line items (invoice_items) did not - meaning
-- every invoice created against the real database silently lost all of
-- its line items (the insert into invoice_items was denied, 42501, while
-- the invoice header succeeded). payments and timesheets were fully
-- write-blocked the same way. invoice_status_history had RLS enabled with
-- NO policy at all (not even SELECT) - the invoice_status_trigger
-- (migration 008, not SECURITY DEFINER) that inserts into it on every
-- invoices status change would itself fail under RLS.
--
-- Reuses get_my_organization_id() and user_has_permission() (migrations
-- 013, 019). billing.manage is the only granular billing permission in
-- the seed data (migration 002) - there is no billing.create/update split
-- the way employees/clients/care_plans/assignments have, so all billing
-- writes are gated on the same code.

-- ---------- invoice_items ----------
CREATE POLICY "invoice_items_insert_with_permission" ON invoice_items
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  );

CREATE POLICY "invoice_items_update_with_permission" ON invoice_items
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  );

-- ---------- payments ----------
CREATE POLICY "payments_insert_with_permission" ON payments
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  );

CREATE POLICY "payments_update_with_permission" ON payments
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  );

-- ---------- timesheets ----------
-- Also written by POST /api/visits/[id]/execute/complete (auto-creates a
-- timesheet on visit completion) - that write path holds visit.complete,
-- not billing.manage, so it's included here too rather than forcing
-- Caregivers to also hold a billing permission just to finish a visit.
CREATE POLICY "timesheets_insert_with_permission" ON timesheets
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND (
      public.user_has_permission('billing.manage')
      OR public.user_has_permission('visit.complete')
    )
  );

CREATE POLICY "timesheets_update_with_permission" ON timesheets
  FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  );

-- ---------- invoice_status_history ----------
-- Had zero policies of any kind (not even SELECT) - add both. Written both
-- directly by the app (PATCH /api/billing/invoices/[id]) and by the
-- log_invoice_status_change() trigger (migration 008, plain plpgsql, not
-- SECURITY DEFINER, so it runs under the same RLS context as whoever ran
-- the triggering `UPDATE invoices`) - that trigger doesn't reliably set
-- created_by to the current user (it copies invoices.updated_by, which
-- isn't always set on every update path), so INSERT is gated on org +
-- billing.manage like the rest of this migration, not self-attribution.
CREATE POLICY "invoice_status_history_select_own_org" ON invoice_status_history
  FOR SELECT
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY "invoice_status_history_insert_with_permission" ON invoice_status_history
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.user_has_permission('billing.manage')
  );
