-- Billing Automation Enhancement
-- Adds tables and features for automatic invoice generation from completed visits
-- Created: 2026-06-30

-- Create client_billing_overrides table
CREATE TABLE IF NOT EXISTS client_billing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  reason VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(organization_id, client_id, effective_from)
);

-- Create insurance_contracts table
CREATE TABLE IF NOT EXISTS insurance_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insurance_provider VARCHAR(200) NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  weekend_rate NUMERIC(10, 2),
  holiday_rate NUMERIC(10, 2),
  night_rate NUMERIC(10, 2),
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Add billing_hourly_rate column to branches if it doesn't exist
ALTER TABLE branches ADD COLUMN IF NOT EXISTS billing_hourly_rate NUMERIC(10, 2);

-- Create visit_to_invoice mapping table
CREATE TABLE IF NOT EXISTS visit_invoice_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visit_execution_id UUID NOT NULL REFERENCES visit_executions(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  billable_hours NUMERIC(8, 2) NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  line_item_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(visit_execution_id, invoice_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_billing_overrides_organization_id
  ON client_billing_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_overrides_client_id
  ON client_billing_overrides(client_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_overrides_is_active
  ON client_billing_overrides(is_active);

CREATE INDEX IF NOT EXISTS idx_insurance_contracts_organization_id
  ON insurance_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_insurance_contracts_provider
  ON insurance_contracts(insurance_provider);
CREATE INDEX IF NOT EXISTS idx_insurance_contracts_is_active
  ON insurance_contracts(is_active);

CREATE INDEX IF NOT EXISTS idx_visit_invoice_mappings_organization_id
  ON visit_invoice_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_visit_invoice_mappings_visit_execution_id
  ON visit_invoice_mappings(visit_execution_id);
CREATE INDEX IF NOT EXISTS idx_visit_invoice_mappings_invoice_id
  ON visit_invoice_mappings(invoice_id);

-- Enable RLS
ALTER TABLE client_billing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_invoice_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "client_billing_overrides_organization_isolation"
  ON client_billing_overrides FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "insurance_contracts_organization_isolation"
  ON insurance_contracts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "visit_invoice_mappings_organization_isolation"
  ON visit_invoice_mappings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Add columns to timesheets for tracking billing status
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS invoice_line_item_id UUID REFERENCES invoice_items(id);

-- Create index for invoice tracking
CREATE INDEX IF NOT EXISTS idx_timesheets_invoice_id
  ON timesheets(invoice_id);

-- Add trigger to mark visits as billed when invoice is marked as sent/paid
CREATE OR REPLACE FUNCTION mark_timesheets_billed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('sent', 'partially_paid', 'paid') THEN
    UPDATE timesheets
    SET is_billed = TRUE
    WHERE invoice_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timesheets_invoice_billed_trigger
AFTER UPDATE ON invoices
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION mark_timesheets_billed();

-- Create function to check for negative invoices
CREATE OR REPLACE FUNCTION validate_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Invoice total amount cannot be negative';
  END IF;
  IF NEW.paid_amount < 0 THEN
    RAISE EXCEPTION 'Paid amount cannot be negative';
  END IF;
  IF NEW.paid_amount > NEW.total_amount THEN
    RAISE EXCEPTION 'Paid amount cannot exceed total amount';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_amount_validation_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION validate_invoice_amounts();

-- Create function to prevent duplicate payments
CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total NUMERIC;
  total_paid NUMERIC;
BEGIN
  SELECT total_amount INTO invoice_total
  FROM invoices
  WHERE id = NEW.invoice_id;

  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id AND id != NEW.id AND is_deleted = FALSE;

  IF (total_paid + NEW.amount) > invoice_total THEN
    RAISE EXCEPTION 'Total payment amount would exceed invoice total';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_amount_validation_trigger
BEFORE INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION validate_payment_amount();
