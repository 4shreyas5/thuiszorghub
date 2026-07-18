-- Reporting & Analytics Infrastructure
-- Migration 011: Create tables for reporting features
-- CORRECTED: All indexes reference only existing columns
-- Created: 2026-07-08

-- ===== Table 1: Report Audit Logs =====
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

-- ===== Table 2: Cached Report Data =====
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

-- ===== Table 3: Report Preferences =====
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

-- ===== INDEXES FOR REPORT TABLES =====

-- Indexes for report_audit_logs (all columns exist)
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_organization_id
  ON report_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_user_id
  ON report_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_report_type
  ON report_audit_logs(report_type);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_created_at
  ON report_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_action
  ON report_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_organization_report_action
  ON report_audit_logs(organization_id, report_type, action, created_at);

-- Indexes for cached_report_data (all columns exist)
CREATE INDEX IF NOT EXISTS idx_cached_report_data_organization_id
  ON cached_report_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_cached_report_data_report_type
  ON cached_report_data(report_type);
CREATE INDEX IF NOT EXISTS idx_cached_report_data_report_date
  ON cached_report_data(report_date);
CREATE INDEX IF NOT EXISTS idx_cached_report_data_expires_at
  ON cached_report_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_report_data_org_type_date
  ON cached_report_data(organization_id, report_type, report_date);

-- Indexes for report_preferences (all columns exist)
CREATE INDEX IF NOT EXISTS idx_report_preferences_organization_id
  ON report_preferences(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_preferences_user_id
  ON report_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_report_preferences_org_user_type
  ON report_preferences(organization_id, user_id, report_type);

-- ===== COMPOSITE INDEXES FOR REPORTING QUERIES =====
-- These improve performance for common reporting queries

-- scheduled_visits reporting indexes (all columns exist)
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_org_status_date
  ON scheduled_visits(organization_id, status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_org_type_date
  ON scheduled_visits(organization_id, visit_type, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_org_branch_date
  ON scheduled_visits(organization_id, branch_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_org_employee_date
  ON scheduled_visits(organization_id, employee_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_org_client_date
  ON scheduled_visits(organization_id, client_id, scheduled_date);

-- visit_executions reporting indexes (only valid columns: scheduled_visit_id, organization_id, status, completed_at)
-- Note: visit_executions does NOT have employee_id or client_id columns directly
-- Use scheduled_visits foreign key for employee/client filtering
CREATE INDEX IF NOT EXISTS idx_visit_executions_org_status_completed
  ON visit_executions(organization_id, status, completed_at);

-- invoices reporting indexes (all columns exist)
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_date
  ON invoices(organization_id, status, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_org_client_status
  ON invoices(organization_id, client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_branch_status
  ON invoices(organization_id, branch_id, status);

-- timesheets reporting indexes (all columns exist)
CREATE INDEX IF NOT EXISTS idx_timesheets_org_employee_date
  ON timesheets(organization_id, employee_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_org_billed_date
  ON timesheets(organization_id, is_billed, visit_date);

-- care_plans reporting indexes (all columns exist)
-- Note: care_plans table DOES have organization_id, client_id, and status columns
CREATE INDEX IF NOT EXISTS idx_care_plans_org_status_created
  ON care_plans(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_care_plans_org_client_status
  ON care_plans(organization_id, client_id, status);

-- care_plan_goals reporting indexes (limited - only has care_plan_id, goal_statement, priority, target_date, completion_percentage, status, notes)
-- Note: care_plan_goals does NOT have organization_id - must join through care_plans
CREATE INDEX IF NOT EXISTS idx_care_plan_goals_care_plan_status
  ON care_plan_goals(care_plan_id, status);

-- care_plan_tasks reporting indexes (limited - only has care_plan_id, task_type, time_category, assigned_to_employee_id, start_date, end_date, frequency)
-- Note: care_plan_tasks does NOT have status or organization_id
CREATE INDEX IF NOT EXISTS idx_care_plan_tasks_care_plan_type
  ON care_plan_tasks(care_plan_id, task_type, time_category);
CREATE INDEX IF NOT EXISTS idx_care_plan_tasks_assigned_start
  ON care_plan_tasks(assigned_to_employee_id, start_date);

-- care_plan_reviews reporting indexes (limited - only has care_plan_id, status, scheduled_date, completed_date)
-- Note: care_plan_reviews does NOT have organization_id
CREATE INDEX IF NOT EXISTS idx_care_plan_reviews_care_plan_status
  ON care_plan_reviews(care_plan_id, status, scheduled_date);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all reporting tables
ALTER TABLE report_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_preferences ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES FOR REPORT_AUDIT_LOGS =====

DROP POLICY IF EXISTS "Users can view their organization's report audit logs" ON report_audit_logs;
CREATE POLICY "Users can view their organization's report audit logs"
  ON report_audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create report audit logs for their organization" ON report_audit_logs;
CREATE POLICY "Users can create report audit logs for their organization"
  ON report_audit_logs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- ===== RLS POLICIES FOR CACHED_REPORT_DATA =====

DROP POLICY IF EXISTS "Users can view their organization's cached report data" ON cached_report_data;
CREATE POLICY "Users can view their organization's cached report data"
  ON cached_report_data FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert cached report data for their organization" ON cached_report_data;
CREATE POLICY "Users can insert cached report data for their organization"
  ON cached_report_data FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ===== RLS POLICIES FOR REPORT_PREFERENCES =====

DROP POLICY IF EXISTS "Users can view their own report preferences" ON report_preferences;
CREATE POLICY "Users can view their own report preferences"
  ON report_preferences FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own report preferences" ON report_preferences;
CREATE POLICY "Users can update their own report preferences"
  ON report_preferences FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert their own report preferences" ON report_preferences;
CREATE POLICY "Users can insert their own report preferences"
  ON report_preferences FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- ===== UTILITY FUNCTIONS =====

-- Cleanup function for expired cache (run periodically via cron or API)
CREATE OR REPLACE FUNCTION cleanup_expired_report_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cached_report_data
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users to call cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_report_cache() TO authenticated;
