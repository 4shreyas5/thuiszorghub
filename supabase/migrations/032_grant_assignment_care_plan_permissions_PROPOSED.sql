-- NOT a security fix - a discretionary product/permission-matrix decision.
-- Flagged in Part 5 of the Production Hardening Sprint report; review
-- before applying, and rename off the _PROPOSED suffix once approved.
--
-- Finding: create_organization_with_owner() (migration 002) hardcodes each
-- non-Owner role's starting permission set. It was written before
-- migration 006 added the assignment.* and care_plan.* permission codes,
-- and was never updated afterward. Every organization ever created by
-- this function therefore has Branch Manager/Scheduler/Administrator/
-- Caregiver/Finance/Auditor roles with ZERO assignment.*/care_plan.*
-- permissions - only Organization Owner (which is granted every
-- permission that exists at creation time, via a live `SELECT ... FROM
-- permissions` with no filter) has ever had them.
--
-- Consequence: now that Part 1 of this sprint wires up real permission
-- checks on POST/PUT /api/assignments and /api/care-plans (previously
-- unenforced), only Organization Owners will be able to create or edit
-- assignments and care plans - even though today, with zero enforcement,
-- every role can. That's very likely an unintended regression, not the
-- intended access model, given Branch Manager/Scheduler already hold the
-- adjacent employee.*/client.*/visit.* permissions this naturally
-- belongs alongside.
--
-- This migration grants a plausible corrected baseline, inferred from
-- each role's existing permission set (see the report for the reasoning
-- per role). It only affects EXISTING organizations' EXISTING system
-- roles - it does not touch create_organization_with_owner() itself,
-- which is a separate, larger change (fixing it so every future org gets
-- these permissions from creation) intentionally left out of this file so
-- the two decisions (backfill existing orgs vs. fix new-org defaults) can
-- be approved independently.

DO $$
DECLARE
  v_role RECORD;
  v_permission_id UUID;
  v_code TEXT;
BEGIN
  FOR v_role IN
    SELECT id, organization_id, name FROM roles
    WHERE is_system = TRUE AND name IN ('Branch Manager', 'Scheduler', 'Administrator', 'Caregiver', 'Auditor')
  LOOP
    -- Branch Manager: manages assignments and care plans within their
    -- branch, same tier as their existing employee.*/client.* grants.
    IF v_role.name = 'Branch Manager' THEN
      FOREACH v_code IN ARRAY ARRAY['assignment.view', 'assignment.create', 'assignment.update', 'care_plan.view', 'care_plan.create', 'care_plan.update']
      LOOP
        SELECT id INTO v_permission_id FROM permissions WHERE code = v_code;
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_role.id, v_permission_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    END IF;

    -- Scheduler: needs to create/update who's assigned to whom (their
    -- core job); care plans only read-only, to know what a visit involves.
    IF v_role.name = 'Scheduler' THEN
      FOREACH v_code IN ARRAY ARRAY['assignment.view', 'assignment.create', 'assignment.update', 'care_plan.view']
      LOOP
        SELECT id INTO v_permission_id FROM permissions WHERE code = v_code;
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_role.id, v_permission_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    END IF;

    -- Administrator: office coordination of assignments, matching their
    -- existing client.*/document.* office-admin grants. Care plans are
    -- clinical content, intentionally left out.
    IF v_role.name = 'Administrator' THEN
      FOREACH v_code IN ARRAY ARRAY['assignment.view', 'assignment.create', 'assignment.update']
      LOOP
        SELECT id INTO v_permission_id FROM permissions WHERE code = v_code;
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_role.id, v_permission_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    END IF;

    -- Caregiver: must be able to VIEW the care plan to know what tasks to
    -- perform during a visit (visit_task_completions references
    -- care_plan_tasks) - this is not optional, it's how they do their job.
    -- No create/update, and no assignment.* (they see their own visits via
    -- visit.view already).
    IF v_role.name = 'Caregiver' THEN
      SELECT id INTO v_permission_id FROM permissions WHERE code = 'care_plan.view';
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role.id, v_permission_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- Auditor: read-only oversight role, already has organization.view/
    -- user.view/employee.view/client.view/document.view/report.view -
    -- assignment.view/care_plan.view complete that pattern.
    IF v_role.name = 'Auditor' THEN
      FOREACH v_code IN ARRAY ARRAY['assignment.view', 'care_plan.view']
      LOOP
        SELECT id INTO v_permission_id FROM permissions WHERE code = v_code;
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_role.id, v_permission_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;
