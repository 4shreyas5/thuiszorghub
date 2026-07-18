-- Add a real status column to employees
-- Previously employee state was only representable via two booleans
-- (is_active, is_deleted), which cannot distinguish "inactive" from
-- "on leave". This adds a proper enum-like status column while keeping
-- is_active/is_deleted in sync (application layer mirrors status into
-- both booleans on every write) so every existing consumer of those two
-- columns - RLS, AssignmentForm's ?status=active employee filter,
-- dashboard counts - keeps working unchanged.
-- Created: 2026-07-18

ALTER TABLE employees
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'on_leave', 'archived'));

-- Backfill from existing state: archived employees (is_deleted) map to
-- 'archived', everyone else maps from is_active. There is no existing way
-- to distinguish "inactive" from "on leave" in current data, so is_active
-- = false with is_deleted = false backfills to 'inactive' (the closer of
-- the two existing statuses to what that combination has meant so far).
UPDATE employees
SET status = CASE
  WHEN is_deleted THEN 'archived'
  WHEN is_active THEN 'active'
  ELSE 'inactive'
END;

CREATE INDEX idx_employees_status ON employees(status);
