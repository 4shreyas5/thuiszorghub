-- Add a record-lifecycle status column to clients, separate from the
-- existing case_status (which answers "is this client's care case
-- open/closed" - a clinical/operational question). This new column
-- answers "is this record active/archived", mirroring the same pattern
-- added to employees in migration 024. Application layer keeps
-- is_active/is_deleted in sync with status on every write so existing
-- consumers of those two booleans keep working unchanged.
-- Created: 2026-07-19

ALTER TABLE clients
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived'));

UPDATE clients
SET status = CASE
  WHEN is_deleted THEN 'archived'
  WHEN is_active THEN 'active'
  ELSE 'inactive'
END;

CREATE INDEX idx_clients_status ON clients(status);
