-- Reporting & Analytics Infrastructure
-- Migration 011: Create tables and indexes for reporting features

-- Reporting Audit Log
CREATE TABLE IF NOT EXISTS report_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'generated', 'exported', 'filtered'
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_format VARCHAR(20), -- 'csv', 'excel', 'pdf', NULL for view
  row_count INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Cached Report Data (for performance)
CREATE TABLE IF NOT EXISTS cached_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  report_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 day',
  UNIQUE(organization_id, report_type, report_date)
);

-- Reporting Preferences (user customizations)
CREATE TABLE IF NOT EXISTS report_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  default_date_range VARCHAR(30) DEFAULT 'this_month',
  default_filters JSONB DEFAULT '{}'::jsonb,
  favorite_reports JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  UNIQUE(organization_id, user_id, report_type)
);

-- Indexes for performance
CREATE INDEX idx_report_audit_logs_organization_id ON report_audit_logs(organization_id);
CREATE INDEX idx_report_audit_logs_user_id ON report_audit_logs(user_id);
CREATE INDEX idx_report_audit_logs_report_type ON report_audit_logs(report_type);
CREATE INDEX idx_report_audit_logs_created_at ON report_audit_logs(created_at);
CREATE INDEX idx_report_audit_logs_action ON report_audit_logs(action);

CREATE INDEX idx_cached_report_data_organization_id ON cached_report_data(organization_id);
CREATE INDEX idx_cached_report_data_report_type ON cached_report_data(report_type);
CREATE INDEX idx_cached_report_data_report_date ON cached_report_data(report_date);
CREATE INDEX idx_cached_report_data_expires_at ON cached_report_data(expires_at);

CREATE INDEX idx_report_preferences_organization_id ON report_preferences(organization_id);
CREATE INDEX idx_report_preferences_user_id ON report_preferences(user_id);

-- Optimize existing tables for reporting queries
CREATE INDEX idx_visits_scheduled_visits_organization_id_status_scheduled_date ON scheduled_visits(organization_id, status, scheduled_date);
CREATE INDEX idx_visits_scheduled_visits_organization_id_visit_type_scheduled_date ON scheduled_visits(organization_id, visit_type, scheduled_date);
CREATE INDEX idx_visits_scheduled_visits_organization_id_branch_id_scheduled_date ON scheduled_visits(organization_id, branch_id, scheduled_date);
CREATE INDEX idx_visits_scheduled_visits_organization_id_employee_id_scheduled_date ON scheduled_visits(organization_id, employee_id, scheduled_date);
CREATE INDEX idx_visits_scheduled_visits_organization_id_client_id_scheduled_date ON scheduled_visits(organization_id, client_id, scheduled_date);

CREATE INDEX idx_visit_executions_organization_id_status_executed_date ON visit_executions(organization_id, status, executed_date);
CREATE INDEX idx_visit_executions_organization_id_employee_id_status ON visit_executions(organization_id, employee_id, status);
CREATE INDEX idx_visit_executions_organization_id_client_id_status ON visit_executions(organization_id, client_id, status);

CREATE INDEX idx_invoices_organization_id_status_invoice_date ON invoices(organization_id, status, invoice_date);
CREATE INDEX idx_invoices_organization_id_client_id_status ON invoices(organization_id, client_id, status);
CREATE INDEX idx_invoices_organization_id_branch_id_status ON invoices(organization_id, branch_id, status);

CREATE INDEX idx_timesheets_organization_id_employee_id_timesheet_date ON timesheets(organization_id, employee_id, timesheet_date);
CREATE INDEX idx_timesheets_organization_id_is_billed_timesheet_date ON timesheets(organization_id, is_billed, timesheet_date);

CREATE INDEX idx_care_plans_organization_id_status_created_at ON care_plans(organization_id, status, created_at);
CREATE INDEX idx_care_plans_organization_id_client_id_status ON care_plans(organization_id, client_id, status);

CREATE INDEX idx_care_plan_goals_organization_id_status_created_at ON care_plan_goals(organization_id, status, created_at);
CREATE INDEX idx_care_plan_tasks_organization_id_status_created_at ON care_plan_tasks(organization_id, status, created_at);
CREATE INDEX idx_care_plan_reviews_organization_id_status_created_at ON care_plan_reviews(organization_id, status, created_at);

-- RLS Policies for report_audit_logs
ALTER TABLE report_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's report audit logs"
  ON report_audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create report audit logs for their organization"
  ON report_audit_logs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- RLS Policies for cached_report_data
ALTER TABLE cached_report_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's cached report data"
  ON cached_report_data FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for report_preferences
ALTER TABLE report_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own report preferences"
  ON report_preferences FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update their own report preferences"
  ON report_preferences FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can insert their own report preferences"
  ON report_preferences FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Cleanup function for expired cache (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_report_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cached_report_data
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
