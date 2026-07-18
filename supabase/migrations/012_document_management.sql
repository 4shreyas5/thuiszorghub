-- Document Management & Communications Infrastructure
-- Migration 012: Create tables for documents, notifications, and email templates

-- Documents table (stores metadata, file in Supabase Storage)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'employee', 'client', 'visit', 'care_plan', 'invoice', 'branch', 'organization'
  entity_id UUID NOT NULL,
  document_type VARCHAR(100) NOT NULL, -- 'employment_contract', 'passport', 'invoice', etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- path in Supabase Storage
  file_size INTEGER NOT NULL, -- bytes
  mime_type VARCHAR(100) NOT NULL,
  bucket_name VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date DATE,
  verification_status VARCHAR(50) DEFAULT 'unverified', -- 'unverified', 'verified', 'expired', 'rejected'
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  custom_metadata JSONB DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, file_path)
);

-- Document versions (track document changes)
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  change_notes TEXT,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(document_id, version_number)
);

-- Document audit logs (track all document operations)
CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'upload', 'download', 'replace', 'delete', 'preview', 'verify'
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL, -- 'new_employee', 'new_client', 'assignment', 'visit_reminder', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  entity_type VARCHAR(50), -- 'employee', 'client', 'visit', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Notification preferences (user notification settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id, notification_type)
);

-- Email templates (for sending notifications)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_key VARCHAR(100) NOT NULL, -- 'welcome', 'invoice_reminder', 'password_reset', etc.
  template_name VARCHAR(200) NOT NULL,
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT,
  variables JSONB DEFAULT '[]'::jsonb, -- list of variable placeholders
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(organization_id, template_key)
);

-- Email logs (track sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  template_key VARCHAR(100),
  subject VARCHAR(500),
  status VARCHAR(50) NOT NULL, -- 'pending', 'sent', 'failed', 'bounced'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Communication log (track all communications per entity)
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'employee', 'client', 'visit'
  entity_id UUID NOT NULL,
  communication_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'notification'
  subject VARCHAR(255),
  message TEXT,
  recipient_email VARCHAR(255),
  sent_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_entity_type_id ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_verification_status ON documents(verification_status);
CREATE INDEX idx_documents_expiry_date ON documents(expiry_date);
CREATE INDEX idx_documents_created_at ON documents(created_at);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_is_current ON document_versions(is_current);

CREATE INDEX idx_document_audit_logs_organization_id ON document_audit_logs(organization_id);
CREATE INDEX idx_document_audit_logs_document_id ON document_audit_logs(document_id);
CREATE INDEX idx_document_audit_logs_user_id ON document_audit_logs(user_id);
CREATE INDEX idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX idx_document_audit_logs_created_at ON document_audit_logs(created_at);

CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_notification_preferences_organization_id ON notification_preferences(organization_id);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

CREATE INDEX idx_email_templates_organization_id ON email_templates(organization_id);
CREATE INDEX idx_email_templates_template_key ON email_templates(template_key);

CREATE INDEX idx_email_logs_organization_id ON email_logs(organization_id);
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);

CREATE INDEX idx_communication_logs_organization_id ON communication_logs(organization_id);
CREATE INDEX idx_communication_logs_entity_type_id ON communication_logs(entity_type, entity_id);

-- RLS Policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_org_isolation ON documents
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for document_versions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_versions_access ON document_versions
  USING (
    document_id IN (
      SELECT id FROM documents
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for document_audit_logs
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_audit_logs_org_isolation ON document_audit_logs
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_user_access ON notifications
  USING (
    user_id = auth.uid() OR organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_preferences_user_access ON notification_preferences
  USING (user_id = auth.uid());

-- RLS Policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_templates_org_isolation ON email_templates
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_logs_org_isolation ON email_logs
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for communication_logs
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY communication_logs_org_isolation ON communication_logs
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
