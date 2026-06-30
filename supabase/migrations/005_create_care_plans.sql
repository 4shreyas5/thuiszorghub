-- Care Plans Migration
-- Creates care plans and all related tables (goals, tasks, reviews, documents, history)
-- Created: 2026-06-29

-- Create care_plans table
CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  primary_caregiver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assessment_notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  start_date DATE NOT NULL,
  review_date DATE,
  end_date DATE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create care_plan_goals table
CREATE TABLE care_plan_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  goal_statement TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  target_date DATE,
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create care_plan_tasks table
CREATE TABLE care_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  task_title VARCHAR(200) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  time_category VARCHAR(50) NOT NULL,
  estimated_duration_minutes INTEGER,
  instructions TEXT,
  is_checklist BOOLEAN NOT NULL DEFAULT FALSE,
  checklist_items JSONB,
  assigned_to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  frequency VARCHAR(50),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create care_plan_reviews table
CREATE TABLE care_plan_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  outcome TEXT,
  recommendations TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create care_plan_documents table
CREATE TABLE care_plan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create care_plan_history table (audit trail)
CREATE TABLE care_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  action_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create care_plan_task_executions table (daily tracking)
CREATE TABLE care_plan_task_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_task_id UUID NOT NULL REFERENCES care_plan_tasks(id) ON DELETE CASCADE,
  execution_date DATE NOT NULL,
  completed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(care_plan_task_id, execution_date)
);

-- Create indexes
CREATE INDEX idx_care_plans_organization_id ON care_plans(organization_id);
CREATE INDEX idx_care_plans_client_id ON care_plans(client_id);
CREATE INDEX idx_care_plans_branch_id ON care_plans(branch_id);
CREATE INDEX idx_care_plans_primary_caregiver_id ON care_plans(primary_caregiver_id);
CREATE INDEX idx_care_plans_created_by_id ON care_plans(created_by_id);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE INDEX idx_care_plans_priority ON care_plans(priority);
CREATE INDEX idx_care_plans_is_deleted ON care_plans(is_deleted);
CREATE INDEX idx_care_plans_created_at ON care_plans(created_at);

CREATE INDEX idx_care_plan_goals_care_plan_id ON care_plan_goals(care_plan_id);
CREATE INDEX idx_care_plan_goals_status ON care_plan_goals(status);

CREATE INDEX idx_care_plan_tasks_care_plan_id ON care_plan_tasks(care_plan_id);
CREATE INDEX idx_care_plan_tasks_task_type ON care_plan_tasks(task_type);
CREATE INDEX idx_care_plan_tasks_time_category ON care_plan_tasks(time_category);
CREATE INDEX idx_care_plan_tasks_assigned_to ON care_plan_tasks(assigned_to_employee_id);

CREATE INDEX idx_care_plan_reviews_care_plan_id ON care_plan_reviews(care_plan_id);
CREATE INDEX idx_care_plan_reviews_status ON care_plan_reviews(status);
CREATE INDEX idx_care_plan_reviews_scheduled_date ON care_plan_reviews(scheduled_date);

CREATE INDEX idx_care_plan_documents_care_plan_id ON care_plan_documents(care_plan_id);
CREATE INDEX idx_care_plan_documents_type ON care_plan_documents(document_type);
CREATE INDEX idx_care_plan_documents_expiry_date ON care_plan_documents(expiry_date);

CREATE INDEX idx_care_plan_history_care_plan_id ON care_plan_history(care_plan_id);
CREATE INDEX idx_care_plan_history_action ON care_plan_history(action);
CREATE INDEX idx_care_plan_history_created_at ON care_plan_history(created_at);

CREATE INDEX idx_care_plan_task_executions_task_id ON care_plan_task_executions(care_plan_task_id);
CREATE INDEX idx_care_plan_task_executions_date ON care_plan_task_executions(execution_date);

-- Enable RLS
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_task_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "care_plans_organization_isolation" ON care_plans
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "care_plan_goals_organization_isolation" ON care_plan_goals
  FOR SELECT USING (
    care_plan_id IN (
      SELECT id FROM care_plans
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "care_plan_tasks_organization_isolation" ON care_plan_tasks
  FOR SELECT USING (
    care_plan_id IN (
      SELECT id FROM care_plans
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "care_plan_reviews_organization_isolation" ON care_plan_reviews
  FOR SELECT USING (
    care_plan_id IN (
      SELECT id FROM care_plans
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "care_plan_documents_organization_isolation" ON care_plan_documents
  FOR SELECT USING (
    care_plan_id IN (
      SELECT id FROM care_plans
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "care_plan_history_organization_isolation" ON care_plan_history
  FOR SELECT USING (
    care_plan_id IN (
      SELECT id FROM care_plans
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "care_plan_task_executions_organization_isolation" ON care_plan_task_executions
  FOR SELECT USING (
    care_plan_task_id IN (
      SELECT id FROM care_plan_tasks
      WHERE care_plan_id IN (
        SELECT id FROM care_plans
        WHERE organization_id IN (
          SELECT organization_id FROM users WHERE users.id = auth.uid()
        )
      )
    )
  );
