-- ThuisZorgHub Platform Foundation Migration
-- This migration creates the core tables for multi-tenant SaaS operations
-- Created: 2026-06-29

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  legal_name VARCHAR(200),
  kvk_number VARCHAR(30) UNIQUE,
  vat_number VARCHAR(50),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30),
  website VARCHAR(255),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Netherlands',
  logo_url TEXT,
  primary_language VARCHAR(10) NOT NULL DEFAULT 'nl',
  timezone VARCHAR(100) NOT NULL DEFAULT 'Europe/Amsterdam',
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  subscription_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create branches table
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20),
  manager_user_id UUID,
  email VARCHAR(255),
  phone VARCHAR(30),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Netherlands',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  employee_id UUID,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  avatar_url TEXT,
  language VARCHAR(10) NOT NULL DEFAULT 'nl',
  timezone VARCHAR(100) NOT NULL DEFAULT 'Europe/Amsterdam',
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, email)
);

-- Create roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  code VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create organization_settings table
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  date_format VARCHAR(20) NOT NULL DEFAULT 'DD-MM-YYYY',
  time_format VARCHAR(5) NOT NULL DEFAULT '24h',
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  work_week_start INTEGER NOT NULL DEFAULT 1,
  default_visit_duration INTEGER NOT NULL DEFAULT 60,
  timezone VARCHAR(100) NOT NULL DEFAULT 'Europe/Amsterdam',
  language VARCHAR(10) NOT NULL DEFAULT 'nl',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_branches_organization_id ON branches(organization_id);
CREATE INDEX idx_branches_manager_user_id ON branches(manager_user_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_roles_organization_id ON roles(organization_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "organizations_isolation" ON organizations
  FOR SELECT USING (
    auth.uid()::text = organizations.id::text OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = organizations.id
      AND users.id = auth.uid()
    )
  );

-- Create RLS policies for branches
CREATE POLICY "branches_organization_isolation" ON branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = branches.organization_id
      AND users.id = auth.uid()
    )
  );

-- Create RLS policies for users
CREATE POLICY "users_organization_isolation" ON users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Create RLS policies for roles
CREATE POLICY "roles_organization_isolation" ON roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Create RLS policies for role_permissions
CREATE POLICY "role_permissions_organization_isolation" ON role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT id FROM roles
      WHERE organization_id IN (
        SELECT organization_id FROM users
        WHERE users.id = auth.uid()
      )
    )
  );

-- Create RLS policies for user_roles
CREATE POLICY "user_roles_organization_isolation" ON user_roles
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users
      WHERE organization_id IN (
        SELECT organization_id FROM users
        WHERE users.id = auth.uid()
      )
    )
  );

-- Create RLS policies for organization_settings
CREATE POLICY "organization_settings_isolation" ON organization_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Create RLS policies for audit_logs
CREATE POLICY "audit_logs_organization_isolation" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Permissions RLS (global table, anyone can view)
CREATE POLICY "permissions_public_read" ON permissions
  FOR SELECT USING (TRUE);
