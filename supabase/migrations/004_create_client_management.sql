-- Client Management Migration
-- Creates clients and related tables for comprehensive client information
-- Created: 2026-06-29

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  email VARCHAR(255),
  phone VARCHAR(30),
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(30),
  case_status VARCHAR(50) NOT NULL DEFAULT 'active',
  risk_level VARCHAR(50) DEFAULT 'low',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_contacts table
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_type VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(255),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_addresses table
CREATE TABLE client_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  address_type VARCHAR(50) NOT NULL DEFAULT 'primary',
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Netherlands',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_medical_info table
CREATE TABLE client_medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  blood_type VARCHAR(5),
  mobility_status VARCHAR(100),
  cognitive_status VARCHAR(100),
  hearing_status VARCHAR(100),
  vision_status VARCHAR(100),
  special_needs TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_allergies table
CREATE TABLE client_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  allergen VARCHAR(200) NOT NULL,
  reaction VARCHAR(255),
  severity VARCHAR(50),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_medications table
CREATE TABLE client_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  medication_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_insurance table
CREATE TABLE client_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  insurance_provider VARCHAR(200),
  policy_number VARCHAR(100),
  member_id VARCHAR(100),
  effective_date DATE,
  expiry_date DATE,
  coverage_type VARCHAR(100),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_notes table
CREATE TABLE client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note_type VARCHAR(50),
  title VARCHAR(200),
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create client_tags table
CREATE TABLE client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, tag_name)
);

-- Create client_tag_assignments table
CREATE TABLE client_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES client_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_branch_id ON clients(branch_id);
CREATE INDEX idx_clients_case_status ON clients(case_status);
CREATE INDEX idx_clients_risk_level ON clients(risk_level);
CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_clients_is_deleted ON clients(is_deleted);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_email ON clients(email);

CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_is_primary ON client_contacts(is_primary);

CREATE INDEX idx_client_addresses_client_id ON client_addresses(client_id);
CREATE INDEX idx_client_addresses_is_primary ON client_addresses(is_primary);

CREATE INDEX idx_client_medical_info_client_id ON client_medical_info(client_id);

CREATE INDEX idx_client_allergies_client_id ON client_allergies(client_id);
CREATE INDEX idx_client_allergies_severity ON client_allergies(severity);

CREATE INDEX idx_client_medications_client_id ON client_medications(client_id);

CREATE INDEX idx_client_insurance_client_id ON client_insurance(client_id);

CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX idx_client_notes_created_by ON client_notes(created_by);

CREATE INDEX idx_client_tags_organization_id ON client_tags(organization_id);

CREATE INDEX idx_client_tag_assignments_client_id ON client_tag_assignments(client_id);
CREATE INDEX idx_client_tag_assignments_tag_id ON client_tag_assignments(tag_id);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "clients_organization_isolation" ON clients
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "client_contacts_organization_isolation" ON client_contacts
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "client_addresses_organization_isolation" ON client_addresses
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "client_medical_info_organization_isolation" ON client_medical_info
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "client_allergies_organization_isolation" ON client_allergies
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "client_medications_organization_isolation" ON client_medications
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "client_insurance_organization_isolation" ON client_insurance
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "client_notes_organization_isolation" ON client_notes
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "client_tags_organization_isolation" ON client_tags
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "client_tag_assignments_organization_isolation" ON client_tag_assignments
  FOR SELECT USING (
    tag_id IN (
      SELECT id FROM client_tags
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );
