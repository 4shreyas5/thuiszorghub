-- employee_client_assignments_employee_id_client_id_key (UNIQUE(employee_id,
-- client_id), migration 006) makes a second assignment between the same
-- employee and client permanently impossible, with no time dimension at
-- all. That's wrong for this business: a caregiver can be reassigned to
-- the same client across separate, non-overlapping periods over months or
-- years, and history must be preserved (soft-delete only, never hard
-- delete). Only *simultaneous active* assignments for the same
-- employee+client pair should be prevented, and that requires comparing
-- date ranges - something a plain UNIQUE constraint cannot express - so
-- the rule is enforced in the application layer instead (see the
-- overlap-aware duplicate check in POST /api/assignments).
--
-- Foreign keys (employee_id, client_id, organization_id -> ... ON DELETE
-- CASCADE) are untouched. Only this one uniqueness constraint is dropped.

ALTER TABLE employee_client_assignments
  DROP CONSTRAINT employee_client_assignments_employee_id_client_id_key;

-- Dropping the UNIQUE constraint also drops the unique index that backed
-- it. Replace it with a plain (non-unique) composite index so lookups
-- filtered by both employee_id and client_id together - exactly what the
-- new application-layer duplicate check does - stay indexed.
CREATE INDEX idx_assignments_employee_client
  ON employee_client_assignments(employee_id, client_id);
