-- Assignments Migration
-- Creates employee-client assignments and related permissions
-- Created: 2026-06-29

-- Create employee_client_assignments table
CREATE TABLE employee_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_from DATE NOT NULL,
  assigned_until DATE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, client_id)
);

-- Create indexes
CREATE INDEX idx_assignments_organization_id ON employee_client_assignments(organization_id);
CREATE INDEX idx_assignments_employee_id ON employee_client_assignments(employee_id);
CREATE INDEX idx_assignments_client_id ON employee_client_assignments(client_id);
CREATE INDEX idx_assignments_is_primary ON employee_client_assignments(is_primary);
CREATE INDEX idx_assignments_assigned_from ON employee_client_assignments(assigned_from);
CREATE INDEX idx_assignments_assigned_until ON employee_client_assignments(assigned_until);
CREATE INDEX idx_assignments_is_deleted ON employee_client_assignments(is_deleted);

-- Enable RLS
ALTER TABLE employee_client_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "assignments_organization_isolation" ON employee_client_assignments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

-- Insert care plan related permissions
INSERT INTO permissions (module, action, code, description) VALUES
('care_plan', 'view', 'care_plan.view', 'View care plans'),
('care_plan', 'create', 'care_plan.create', 'Create care plan'),
('care_plan', 'update', 'care_plan.update', 'Update care plan'),
('care_plan', 'delete', 'care_plan.delete', 'Delete care plan'),
('care_plan', 'manage', 'care_plan.manage', 'Manage care plans')
ON CONFLICT (code) DO NOTHING;

-- Insert assignment related permissions
INSERT INTO permissions (module, action, code, description) VALUES
('assignment', 'view', 'assignment.view', 'View assignments'),
('assignment', 'create', 'assignment.create', 'Create assignment'),
('assignment', 'update', 'assignment.update', 'Update assignment'),
('assignment', 'delete', 'assignment.delete', 'Delete assignment'),
('assignment', 'manage', 'assignment.manage', 'Manage assignments')
ON CONFLICT (code) DO NOTHING;
