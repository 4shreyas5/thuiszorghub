-- Extend organization_settings with application-configuration fields that
-- belong to Settings, not Organization (company info stays on `organizations`).
-- Timezone/currency/language already exist on organization_settings.

ALTER TABLE organization_settings
  ADD COLUMN notification_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN notification_sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN notification_push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN email_from_name VARCHAR(150),
  ADD COLUMN email_from_address VARCHAR(255),
  ADD COLUMN email_reply_to VARCHAR(255),
  ADD COLUMN session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN brand_primary_color VARCHAR(7) NOT NULL DEFAULT '#2563eb',
  ADD COLUMN brand_secondary_color VARCHAR(7);
