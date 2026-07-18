-- ThuisZorgHub Billing System Migration
-- Creates tables for invoicing, payments, and financial management
-- Created: 2026-06-30

-- Create insurance_providers table
CREATE TABLE insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  contact_person VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(30),
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(organization_id, code)
);

-- Create municipality_contracts table
CREATE TABLE municipality_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  municipality_name VARCHAR(150) NOT NULL,
  contract_number VARCHAR(100) NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  weekend_rate NUMERIC(10, 2),
  holiday_rate NUMERIC(10, 2),
  night_rate NUMERIC(10, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(organization_id, contract_number)
);

-- Create billing_profiles table
CREATE TABLE billing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_hourly_rate NUMERIC(10, 2) NOT NULL,
  weekend_rate_multiplier NUMERIC(3, 2) DEFAULT 1.25,
  holiday_rate_multiplier NUMERIC(3, 2) DEFAULT 1.50,
  night_rate_multiplier NUMERIC(3, 2) DEFAULT 1.25,
  vat_percentage NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
  payment_terms_days INT DEFAULT 30,
  invoice_prefix VARCHAR(20),
  auto_generate_invoices BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(organization_id, name)
);

-- Create invoice_templates table
CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  billing_profile_id UUID REFERENCES billing_profiles(id),
  name VARCHAR(150) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  header_text TEXT,
  footer_text TEXT,
  notes_template TEXT,
  payment_instructions TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create invoices table (main billing table)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  vat_percentage NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  discount_description VARCHAR(255),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  remaining_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  billing_profile_id UUID REFERENCES billing_profiles(id),
  template_id UUID REFERENCES invoice_templates(id),
  notes TEXT,
  internal_notes TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(organization_id, invoice_number)
);

-- Create invoice_items table (line items)
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES scheduled_visits(id),
  description VARCHAR(255) NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  rate_type VARCHAR(50),
  vat_percentage NUMERIC(5, 2),
  subtotal NUMERIC(12, 2) NOT NULL,
  vat_amount NUMERIC(12, 2) DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL,
  line_number INT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id)
);

-- Create invoice_status_history table (audit trail)
CREATE TABLE invoice_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_reason VARCHAR(255),
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  bank_account VARCHAR(50),
  transaction_id VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  notes TEXT,
  internal_notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(organization_id, reference_number)
);

-- Create timesheets table (for hour tracking and billing)
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  total_hours NUMERIC(5, 2),
  billable_hours NUMERIC(5, 2),
  night_hours NUMERIC(5, 2) DEFAULT 0.00,
  weekend_hours NUMERIC(5, 2) DEFAULT 0.00,
  holiday_hours NUMERIC(5, 2) DEFAULT 0.00,
  travel_hours NUMERIC(5, 2) DEFAULT 0.00,
  cancelled_hours NUMERIC(5, 2) DEFAULT 0.00,
  overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
  hourly_rate NUMERIC(10, 2),
  rate_type VARCHAR(50) DEFAULT 'standard',
  notes TEXT,
  is_billed BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create financial_summary table (cached dashboard data)
CREATE TABLE financial_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue_today NUMERIC(12, 2) DEFAULT 0.00,
  revenue_this_month NUMERIC(12, 2) DEFAULT 0.00,
  revenue_this_year NUMERIC(12, 2) DEFAULT 0.00,
  outstanding_invoices_count INT DEFAULT 0,
  outstanding_amount NUMERIC(12, 2) DEFAULT 0.00,
  overdue_invoices_count INT DEFAULT 0,
  overdue_amount NUMERIC(12, 2) DEFAULT 0.00,
  paid_invoices_count INT DEFAULT 0,
  paid_amount NUMERIC(12, 2) DEFAULT 0.00,
  billable_hours_today NUMERIC(8, 2) DEFAULT 0.00,
  billable_hours_this_month NUMERIC(8, 2) DEFAULT 0.00,
  clients_served_today INT DEFAULT 0,
  clients_served_this_month INT DEFAULT 0,
  visits_completed_today INT DEFAULT 0,
  visits_completed_this_month INT DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, branch_id, summary_date)
);

-- Create indexes for performance
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_branch_id ON invoices(branch_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

CREATE INDEX idx_invoice_items_organization_id ON invoice_items(organization_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_visit_id ON invoice_items(visit_id);

CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_timesheets_organization_id ON timesheets(organization_id);
CREATE INDEX idx_timesheets_visit_id ON timesheets(visit_id);
CREATE INDEX idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX idx_timesheets_client_id ON timesheets(client_id);
CREATE INDEX idx_timesheets_visit_date ON timesheets(visit_date);
CREATE INDEX idx_timesheets_is_billed ON timesheets(is_billed);

CREATE INDEX idx_billing_profiles_organization_id ON billing_profiles(organization_id);
CREATE INDEX idx_insurance_providers_organization_id ON insurance_providers(organization_id);
CREATE INDEX idx_municipality_contracts_organization_id ON municipality_contracts(organization_id);
CREATE INDEX idx_municipality_contracts_branch_id ON municipality_contracts(branch_id);
CREATE INDEX idx_invoice_status_history_organization_id ON invoice_status_history(organization_id);
CREATE INDEX idx_invoice_status_history_invoice_id ON invoice_status_history(invoice_id);
CREATE INDEX idx_financial_summary_organization_id ON financial_summary(organization_id);
CREATE INDEX idx_financial_summary_summary_date ON financial_summary(summary_date);

-- Create RLS (Row Level Security) policies
-- All tables follow organization isolation

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipality_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_summary ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view invoices from their organization"
  ON invoices FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create invoices in their organization"
  ON invoices FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update invoices in their organization"
  ON invoices FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Similar policies for other tables (abbreviated for space)
CREATE POLICY "Users can view invoice_items from their organization"
  ON invoice_items FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view payments from their organization"
  ON payments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view timesheets from their organization"
  ON timesheets FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view billing_profiles from their organization"
  ON billing_profiles FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view insurance_providers from their organization"
  ON insurance_providers FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view municipality_contracts from their organization"
  ON municipality_contracts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view invoice_templates from their organization"
  ON invoice_templates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view financial_summary from their organization"
  ON financial_summary FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Audit log trigger for invoices
-- CREATE TRIGGER invoices_audit_trigger
-- AFTER UPDATE ON invoices
-- FOR EACH ROW
-- EXECUTE FUNCTION log_audit_change('invoices');

-- Audit log trigger for payments
-- CREATE TRIGGER payments_audit_trigger
-- AFTER UPDATE ON payments
-- FOR EACH ROW
-- EXECUTE FUNCTION log_audit_change('payments');

-- Status history trigger for invoices
CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO invoice_status_history (
      organization_id,
      invoice_id,
      old_status,
      new_status,
      created_by
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_status_trigger
AFTER UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION log_invoice_status_change();
