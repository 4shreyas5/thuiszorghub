-- Employee Management Migration
-- Creates employees, qualifications, languages, and availability tables
-- Created: 2026-06-29

-- Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  employment_type VARCHAR(50) NOT NULL DEFAULT 'full-time',
  hourly_rate DECIMAL(10, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  bio TEXT,
  avatar_url TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Create employee_qualifications table
CREATE TABLE employee_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  qualification VARCHAR(200) NOT NULL,
  certification_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create employee_languages table
CREATE TABLE employee_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  language VARCHAR(50) NOT NULL,
  proficiency_level VARCHAR(50) DEFAULT 'native',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create employee_availability table (weekly working hours)
CREATE TABLE employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, day_of_week)
);

-- Create employee_unavailability table (leave, vacation, sick, etc)
CREATE TABLE employee_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  unavailability_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Create indexes
CREATE INDEX idx_employees_organization_id ON employees(organization_id);
CREATE INDEX idx_employees_branch_id ON employees(branch_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_employees_is_deleted ON employees(is_deleted);
CREATE INDEX idx_employees_created_at ON employees(created_at);

CREATE INDEX idx_employee_qualifications_employee_id ON employee_qualifications(employee_id);
CREATE INDEX idx_employee_qualifications_expiry_date ON employee_qualifications(expiry_date);

CREATE INDEX idx_employee_languages_employee_id ON employee_languages(employee_id);

CREATE INDEX idx_employee_availability_employee_id ON employee_availability(employee_id);
CREATE INDEX idx_employee_availability_day_of_week ON employee_availability(day_of_week);

CREATE INDEX idx_employee_unavailability_employee_id ON employee_unavailability(employee_id);
CREATE INDEX idx_employee_unavailability_start_date ON employee_unavailability(start_date);
CREATE INDEX idx_employee_unavailability_type ON employee_unavailability(unavailability_type);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_unavailability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "employees_organization_isolation" ON employees
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "employee_qualifications_organization_isolation" ON employee_qualifications
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "employee_languages_organization_isolation" ON employee_languages
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "employee_availability_organization_isolation" ON employee_availability
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "employee_unavailability_organization_isolation" ON employee_unavailability
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );
