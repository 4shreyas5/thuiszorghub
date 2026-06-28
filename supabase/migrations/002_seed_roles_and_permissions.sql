-- Seed System Roles and Permissions
-- This migration populates the permissions and system roles
-- Created: 2026-06-29

-- Permissions for organization management
INSERT INTO permissions (module, action, code, description) VALUES
('organization', 'view', 'organization.view', 'View organization details'),
('organization', 'create', 'organization.create', 'Create new organization'),
('organization', 'update', 'organization.update', 'Update organization'),
('organization', 'delete', 'organization.delete', 'Delete organization'),
('organization', 'manage', 'organization.manage', 'Manage organization settings');

-- Permissions for branch management
INSERT INTO permissions (module, action, code, description) VALUES
('branch', 'view', 'branch.view', 'View branches'),
('branch', 'create', 'branch.create', 'Create branch'),
('branch', 'update', 'branch.update', 'Update branch'),
('branch', 'delete', 'branch.delete', 'Delete branch'),
('branch', 'manage', 'branch.manage', 'Manage branches');

-- Permissions for user management
INSERT INTO permissions (module, action, code, description) VALUES
('user', 'view', 'user.view', 'View users'),
('user', 'create', 'user.create', 'Create user'),
('user', 'update', 'user.update', 'Update user'),
('user', 'delete', 'user.delete', 'Delete user'),
('user', 'invite', 'user.invite', 'Invite user'),
('user', 'manage', 'user.manage', 'Manage users');

-- Permissions for role management
INSERT INTO permissions (module, action, code, description) VALUES
('role', 'view', 'role.view', 'View roles'),
('role', 'create', 'role.create', 'Create role'),
('role', 'update', 'role.update', 'Update role'),
('role', 'delete', 'role.delete', 'Delete role'),
('role', 'manage', 'role.manage', 'Manage roles');

-- Permissions for permission management
INSERT INTO permissions (module, action, code, description) VALUES
('permission', 'view', 'permission.view', 'View permissions'),
('permission', 'manage', 'permission.manage', 'Manage permissions');

-- Permissions for employee management
INSERT INTO permissions (module, action, code, description) VALUES
('employee', 'view', 'employee.view', 'View employees'),
('employee', 'create', 'employee.create', 'Create employee'),
('employee', 'update', 'employee.update', 'Update employee'),
('employee', 'delete', 'employee.delete', 'Delete employee'),
('employee', 'manage', 'employee.manage', 'Manage employees');

-- Permissions for client management
INSERT INTO permissions (module, action, code, description) VALUES
('client', 'view', 'client.view', 'View clients'),
('client', 'create', 'client.create', 'Create client'),
('client', 'update', 'client.update', 'Update client'),
('client', 'delete', 'client.delete', 'Delete client'),
('client', 'manage', 'client.manage', 'Manage clients');

-- Permissions for scheduling
INSERT INTO permissions (module, action, code, description) VALUES
('schedule', 'view', 'schedule.view', 'View schedules'),
('schedule', 'create', 'schedule.create', 'Create schedule'),
('schedule', 'update', 'schedule.update', 'Update schedule'),
('schedule', 'delete', 'schedule.delete', 'Delete schedule'),
('schedule', 'assign', 'schedule.assign', 'Assign schedules');

-- Permissions for visits
INSERT INTO permissions (module, action, code, description) VALUES
('visit', 'view', 'visit.view', 'View visits'),
('visit', 'create', 'visit.create', 'Create visit'),
('visit', 'update', 'visit.update', 'Update visit'),
('visit', 'delete', 'visit.delete', 'Delete visit'),
('visit', 'complete', 'visit.complete', 'Complete visit'),
('visit', 'manage', 'visit.manage', 'Manage visits');

-- Permissions for documents
INSERT INTO permissions (module, action, code, description) VALUES
('document', 'view', 'document.view', 'View documents'),
('document', 'create', 'document.create', 'Create document'),
('document', 'update', 'document.update', 'Update document'),
('document', 'delete', 'document.delete', 'Delete document'),
('document', 'upload', 'document.upload', 'Upload document'),
('document', 'download', 'document.download', 'Download document');

-- Permissions for reports
INSERT INTO permissions (module, action, code, description) VALUES
('report', 'view', 'report.view', 'View reports'),
('report', 'export', 'report.export', 'Export reports'),
('report', 'manage', 'report.manage', 'Manage reports');

-- Permissions for audit logs
INSERT INTO permissions (module, action, code, description) VALUES
('audit', 'view', 'audit.view', 'View audit logs'),
('audit', 'manage', 'audit.manage', 'Manage audit logs');

-- Permissions for settings
INSERT INTO permissions (module, action, code, description) VALUES
('settings', 'view', 'settings.view', 'View settings'),
('settings', 'update', 'settings.update', 'Update settings'),
('settings', 'manage', 'settings.manage', 'Manage settings');

-- Permissions for billing
INSERT INTO permissions (module, action, code, description) VALUES
('billing', 'view', 'billing.view', 'View billing'),
('billing', 'manage', 'billing.manage', 'Manage billing'),
('billing', 'export', 'billing.export', 'Export billing');

-- Permissions for notifications
INSERT INTO permissions (module, action, code, description) VALUES
('notification', 'view', 'notification.view', 'View notifications'),
('notification', 'send', 'notification.send', 'Send notification'),
('notification', 'manage', 'notification.manage', 'Manage notifications');

-- Permissions for dashboard
INSERT INTO permissions (module, action, code, description) VALUES
('dashboard', 'view', 'dashboard.view', 'View dashboard');

-- Function to create organization with owner role
-- This function will be called after user creation
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_organization_name VARCHAR,
  p_organization_email VARCHAR,
  p_user_id UUID,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_language VARCHAR DEFAULT 'nl',
  p_timezone VARCHAR DEFAULT 'Europe/Amsterdam'
)
RETURNS TABLE(organization_id UUID, success BOOLEAN, message VARCHAR) AS $$
DECLARE
  v_org_id UUID;
  v_owner_role_id UUID;
  v_caregiver_role_id UUID;
  v_admin_role_id UUID;
  v_scheduler_role_id UUID;
  v_branch_manager_role_id UUID;
  v_finance_role_id UUID;
  v_auditor_role_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (
    name, email, address_line_1, city, postal_code, country,
    primary_language, timezone, currency
  ) VALUES (
    p_organization_name, p_organization_email, 'Address pending', 'City pending', '0000', 'Netherlands',
    p_language, p_timezone, 'EUR'
  )
  RETURNING organizations.id INTO v_org_id;

  -- Create user record
  INSERT INTO users (
    id, organization_id, first_name, last_name, email,
    language, timezone, is_active
  ) VALUES (
    p_user_id, v_org_id, p_first_name, p_last_name, p_organization_email,
    p_language, p_timezone, TRUE
  );

  -- Create organization settings
  INSERT INTO organization_settings (
    organization_id, date_format, time_format, currency,
    work_week_start, default_visit_duration, timezone, language
  ) VALUES (
    v_org_id, 'DD-MM-YYYY', '24h', 'EUR', 1, 60, p_timezone, p_language
  );

  -- Create system roles
  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (v_org_id, 'Organization Owner', 'Full organization access', TRUE)
  RETURNING roles.id INTO v_owner_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (v_org_id, 'Branch Manager', 'Branch-level management', TRUE)
  RETURNING roles.id INTO v_branch_manager_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (v_org_id, 'Scheduler', 'Schedule and planning', TRUE)
  RETURNING roles.id INTO v_scheduler_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (v_org_id, 'Administrator', 'Office administration', TRUE)
  RETURNING roles.id INTO v_admin_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (v_org_id, 'Caregiver', 'Field caregiver', TRUE)
  RETURNING roles.id INTO v_caregiver_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (v_org_id, 'Finance', 'Financial management', TRUE)
  RETURNING roles.id INTO v_finance_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (v_org_id, 'Auditor', 'Read-only audit access', TRUE)
  RETURNING roles.id INTO v_auditor_role_id;

  -- Assign all permissions to Owner role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_owner_role_id, permissions.id FROM permissions;

  -- Assign permissions to Branch Manager
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_branch_manager_role_id, permissions.id FROM permissions
  WHERE code IN (
    'branch.view', 'employee.view', 'employee.create', 'employee.update',
    'client.view', 'client.create', 'client.update', 'schedule.view',
    'schedule.create', 'visit.view', 'visit.manage', 'document.view',
    'report.view', 'settings.view', 'dashboard.view'
  );

  -- Assign permissions to Scheduler
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_scheduler_role_id, permissions.id FROM permissions
  WHERE code IN (
    'schedule.view', 'schedule.create', 'schedule.update', 'schedule.assign',
    'employee.view', 'client.view', 'visit.view', 'visit.update',
    'visit.complete', 'dashboard.view', 'notification.view'
  );

  -- Assign permissions to Administrator
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, permissions.id FROM permissions
  WHERE code IN (
    'client.view', 'client.create', 'client.update', 'employee.view',
    'document.view', 'document.upload', 'document.download',
    'notification.view', 'notification.send', 'dashboard.view', 'settings.view'
  );

  -- Assign permissions to Caregiver
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_caregiver_role_id, permissions.id FROM permissions
  WHERE code IN (
    'schedule.view', 'client.view', 'visit.view', 'visit.complete',
    'document.view', 'document.upload', 'notification.view', 'dashboard.view'
  );

  -- Assign permissions to Finance
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_finance_role_id, permissions.id FROM permissions
  WHERE code IN (
    'billing.view', 'billing.export', 'report.view', 'report.export',
    'dashboard.view'
  );

  -- Assign permissions to Auditor
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_auditor_role_id, permissions.id FROM permissions
  WHERE code IN (
    'audit.view', 'organization.view', 'user.view', 'employee.view',
    'client.view', 'document.view', 'report.view', 'dashboard.view'
  );

  -- Assign Owner role to user
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (p_user_id, v_owner_role_id, p_user_id);

  RETURN QUERY SELECT v_org_id, TRUE::BOOLEAN, 'Organization created successfully'::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_owner(VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
