-- Scheduling Migration
-- Creates scheduled_visits, visit_recurrence, visit_templates, visit_checklists, visit_conflicts, and visit_history tables
-- Created: 2026-06-29

-- Create scheduled_visits table
CREATE TABLE scheduled_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  care_plan_id UUID REFERENCES care_plans(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  visit_type VARCHAR(50) NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  estimated_duration_minutes INTEGER,
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  visit_recurrence_id UUID,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visit_recurrence table
CREATE TABLE visit_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recurrence_pattern VARCHAR(50) NOT NULL,
  custom_rrule TEXT,
  end_date DATE,
  occurrence_count INTEGER,
  skip_dates JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint to scheduled_visits for recurrence
ALTER TABLE scheduled_visits
ADD CONSTRAINT fk_scheduled_visits_recurrence
FOREIGN KEY (visit_recurrence_id) REFERENCES visit_recurrence(id) ON DELETE SET NULL;

-- Create visit_templates table
CREATE TABLE visit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  template_name VARCHAR(200) NOT NULL,
  visit_type VARCHAR(50) NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER,
  checklist_items JSONB,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visit_checklists table
CREATE TABLE visit_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  item_title VARCHAR(200) NOT NULL,
  item_order INTEGER,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visit_conflicts table
CREATE TABLE visit_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scheduled_visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  conflict_type VARCHAR(100) NOT NULL,
  conflicting_visit_id UUID REFERENCES scheduled_visits(id) ON DELETE SET NULL,
  description TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create visit_history table
CREATE TABLE visit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scheduled_visit_id UUID NOT NULL REFERENCES scheduled_visits(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  action_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_scheduled_visits_organization_id ON scheduled_visits(organization_id);
CREATE INDEX idx_scheduled_visits_client_id ON scheduled_visits(client_id);
CREATE INDEX idx_scheduled_visits_employee_id ON scheduled_visits(employee_id);
CREATE INDEX idx_scheduled_visits_branch_id ON scheduled_visits(branch_id);
CREATE INDEX idx_scheduled_visits_care_plan_id ON scheduled_visits(care_plan_id);
CREATE INDEX idx_scheduled_visits_date ON scheduled_visits(scheduled_date);
CREATE INDEX idx_scheduled_visits_status ON scheduled_visits(status);
CREATE INDEX idx_scheduled_visits_priority ON scheduled_visits(priority);
CREATE INDEX idx_scheduled_visits_is_deleted ON scheduled_visits(is_deleted);
CREATE INDEX idx_scheduled_visits_created_at ON scheduled_visits(created_at);
CREATE INDEX idx_scheduled_visits_employee_date ON scheduled_visits(employee_id, scheduled_date);
CREATE INDEX idx_scheduled_visits_client_date ON scheduled_visits(client_id, scheduled_date);

CREATE INDEX idx_visit_recurrence_organization_id ON visit_recurrence(organization_id);
CREATE INDEX idx_visit_recurrence_pattern ON visit_recurrence(recurrence_pattern);
CREATE INDEX idx_visit_recurrence_is_active ON visit_recurrence(is_active);

CREATE INDEX idx_visit_templates_organization_id ON visit_templates(organization_id);
CREATE INDEX idx_visit_templates_branch_id ON visit_templates(branch_id);
CREATE INDEX idx_visit_templates_type ON visit_templates(visit_type);
CREATE INDEX idx_visit_templates_is_active ON visit_templates(is_active);

CREATE INDEX idx_visit_checklists_visit_id ON visit_checklists(scheduled_visit_id);
CREATE INDEX idx_visit_checklists_is_completed ON visit_checklists(is_completed);

CREATE INDEX idx_visit_conflicts_organization_id ON visit_conflicts(organization_id);
CREATE INDEX idx_visit_conflicts_visit_id ON visit_conflicts(scheduled_visit_id);
CREATE INDEX idx_visit_conflicts_employee_id ON visit_conflicts(employee_id);
CREATE INDEX idx_visit_conflicts_is_resolved ON visit_conflicts(is_resolved);

CREATE INDEX idx_visit_history_organization_id ON visit_history(organization_id);
CREATE INDEX idx_visit_history_visit_id ON visit_history(scheduled_visit_id);
CREATE INDEX idx_visit_history_action ON visit_history(action);
CREATE INDEX idx_visit_history_created_at ON visit_history(created_at);

-- Enable RLS
ALTER TABLE scheduled_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_recurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "scheduled_visits_organization_isolation" ON scheduled_visits
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "visit_recurrence_organization_isolation" ON visit_recurrence
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "visit_templates_organization_isolation" ON visit_templates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "visit_checklists_organization_isolation" ON visit_checklists
  FOR SELECT USING (
    scheduled_visit_id IN (
      SELECT id FROM scheduled_visits
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "visit_conflicts_organization_isolation" ON visit_conflicts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "visit_history_organization_isolation" ON visit_history
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );
