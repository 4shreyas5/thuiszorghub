-- Add emergency contact fields to employees, mirroring the pattern already
-- used on clients (emergency_contact_name, emergency_contact_phone).
-- Created: 2026-07-18

ALTER TABLE employees
  ADD COLUMN emergency_contact_name VARCHAR(150),
  ADD COLUMN emergency_contact_phone VARCHAR(30),
  ADD COLUMN emergency_contact_relationship VARCHAR(100);
