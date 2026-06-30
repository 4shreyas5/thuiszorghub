-- Visit Execution Migration
-- Creates tables for visit execution workflow: task completion, medication, notes
-- Created: 2026-06-30

-- Create visit_executions table
CREATE TABLE visit_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE,
  actual_start_time TIME,
  actual_end_time TIME,
  actual_duration_minutes INTEGER,
  billable_duration_minutes INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visit_task_completions table
CREATE TABLE visit_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_execution_id UUID NOT NULL REFERENCES visit_executions(id) ON DELETE CASCADE,
  scheduled_visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  care_plan_task_id UUID NOT NULL REFERENCES care_plan_tasks(id) ON DELETE RESTRICT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  notes TEXT,
  skipped_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visit_medication_records table
CREATE TABLE visit_medication_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_execution_id UUID NOT NULL REFERENCES visit_executions(id) ON DELETE CASCADE,
  scheduled_visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  prescribed_dosage VARCHAR(100),
  administered_dosage VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'given',
  administered_at TIMESTAMP WITH TIME ZONE,
  administered_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  not_given_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visit_notes table
CREATE TABLE visit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_execution_id UUID NOT NULL REFERENCES visit_executions(id) ON DELETE CASCADE,
  scheduled_visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  mood_score INTEGER,
  pain_score INTEGER,
  vital_signs JSONB,
  recommendations TEXT,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_visit_executions_organization_id ON visit_executions(organization_id);
CREATE INDEX idx_visit_executions_scheduled_visit_id ON visit_executions(scheduled_visit_id);
CREATE INDEX idx_visit_executions_status ON visit_executions(status);
CREATE INDEX idx_visit_executions_completed_at ON visit_executions(completed_at);
CREATE INDEX idx_visit_executions_created_at ON visit_executions(created_at);

CREATE INDEX idx_visit_task_completions_visit_execution_id ON visit_task_completions(visit_execution_id);
CREATE INDEX idx_visit_task_completions_scheduled_visit_id ON visit_task_completions(scheduled_visit_id);
CREATE INDEX idx_visit_task_completions_care_plan_task_id ON visit_task_completions(care_plan_task_id);
CREATE INDEX idx_visit_task_completions_completed_at ON visit_task_completions(completed_at);

CREATE INDEX idx_visit_medication_records_visit_execution_id ON visit_medication_records(visit_execution_id);
CREATE INDEX idx_visit_medication_records_scheduled_visit_id ON visit_medication_records(scheduled_visit_id);
CREATE INDEX idx_visit_medication_records_status ON visit_medication_records(status);

CREATE INDEX idx_visit_notes_visit_execution_id ON visit_notes(visit_execution_id);
CREATE INDEX idx_visit_notes_scheduled_visit_id ON visit_notes(scheduled_visit_id);
CREATE INDEX idx_visit_notes_category ON visit_notes(category);

-- Enable RLS
ALTER TABLE visit_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "visit_executions_organization_isolation" ON visit_executions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "visit_task_completions_organization_isolation" ON visit_task_completions
  FOR SELECT USING (
    scheduled_visit_id IN (
      SELECT id FROM scheduled_visits
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "visit_medication_records_organization_isolation" ON visit_medication_records
  FOR SELECT USING (
    scheduled_visit_id IN (
      SELECT id FROM scheduled_visits
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "visit_notes_organization_isolation" ON visit_notes
  FOR SELECT USING (
    scheduled_visit_id IN (
      SELECT id FROM scheduled_visits
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );
