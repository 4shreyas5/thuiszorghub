-- audit_logs had exactly one RLS policy (SELECT only, migration 001).
-- With RLS enabled and no INSERT policy, every audit-trail write from the
-- non-admin client is denied unconditionally (42501) - meaning every
-- audit_logs.insert() call across the entire application (every module:
-- employees, clients, care plans, assignments, visits, billing, users,
-- roles, organization, branches) has been silently failing since the
-- table was created. This is the headline finding from the Final
-- Production Audit (2026-07-19).
--
-- Not gated on a CRUD permission the way employees/clients/etc. are:
-- audit_logs writes are a side effect of the ACTING user's own tracked
-- action, so every authenticated org member needs to be able to write
-- one for themselves regardless of which resource-level permissions they
-- hold - the same shape already used successfully for report_audit_logs
-- (migration 011: org-scoped + `user_id = auth.uid()`).

CREATE POLICY "audit_logs_insert_own_org" ON audit_logs
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND user_id = auth.uid()
  );
