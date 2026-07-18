"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Settings {
  timezone: string;
  currency: string;
  language: string;
  date_format: string;
  time_format: string;
  work_week_start: number;
  default_visit_duration: number;
  notification_email_enabled: boolean;
  notification_sms_enabled: boolean;
  notification_push_enabled: boolean;
  email_from_name?: string;
  email_from_address?: string;
  email_reply_to?: string;
  session_timeout_minutes: number;
  mfa_required: boolean;
  brand_primary_color: string;
  brand_secondary_color?: string;
}

export default function SettingsPage() {
  const { user: authUser } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch("/api/settings");
      const result = await response.json();
      if (response.ok) {
        setSettings(result.data);
      } else {
        setLoadError(result.error || `Failed to load settings (${response.status})`);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      if (authUser) fetchSettings();
    });
  }, [authUser, fetchSettings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: settings.timezone,
          currency: settings.currency,
          language: settings.language,
          dateFormat: settings.date_format,
          timeFormat: settings.time_format,
          workWeekStart: settings.work_week_start,
          defaultVisitDuration: settings.default_visit_duration,
          notificationEmailEnabled: settings.notification_email_enabled,
          notificationSmsEnabled: settings.notification_sms_enabled,
          notificationPushEnabled: settings.notification_push_enabled,
          emailFromName: settings.email_from_name,
          emailFromAddress: settings.email_from_address,
          emailReplyTo: settings.email_reply_to,
          sessionTimeoutMinutes: settings.session_timeout_minutes,
          mfaRequired: settings.mfa_required,
          brandPrimaryColor: settings.brand_primary_color,
          brandSecondaryColor: settings.brand_secondary_color,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setSettings(result.data);
        setSaveMessage("Settings saved");
      } else {
        setSaveMessage(result.error || "Failed to save settings");
      }
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  if (!authUser) {
    return <div className="p-4">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Application configuration" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Application configuration" />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={fetchSettings}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Application configuration - for company information, see Organization"
      />

      {saveMessage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-blue-800 dark:text-blue-300 text-sm">
          {saveMessage}
        </div>
      )}

      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Regional</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Language"
            value={settings.language}
            onChange={(e) => update("language", e.target.value)}
            options={[
              { value: "nl", label: "Dutch (NL)" },
              { value: "en", label: "English (EN)" },
            ]}
          />
          <Select
            label="Timezone"
            value={settings.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            options={[
              { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET)" },
              { value: "Europe/Brussels", label: "Europe/Brussels (CET)" },
              { value: "UTC", label: "UTC" },
            ]}
          />
          <Select
            label="Currency"
            value={settings.currency}
            onChange={(e) => update("currency", e.target.value)}
            options={[
              { value: "EUR", label: "EUR (€)" },
              { value: "USD", label: "USD ($)" },
              { value: "GBP", label: "GBP (£)" },
            ]}
          />
          <Select
            label="Date Format"
            value={settings.date_format}
            onChange={(e) => update("date_format", e.target.value)}
            options={[
              { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
              { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ]}
          />
          <Select
            label="Time Format"
            value={settings.time_format}
            onChange={(e) => update("time_format", e.target.value)}
            options={[
              { value: "24h", label: "24-hour" },
              { value: "12h", label: "12-hour" },
            ]}
          />
          <Input
            label="Default Visit Duration (minutes)"
            type="number"
            value={settings.default_visit_duration}
            onChange={(e) => update("default_visit_duration", parseInt(e.target.value) || 0)}
          />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notification Defaults
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              checked={settings.notification_email_enabled}
              onChange={(e) => update("notification_email_enabled", e.target.checked)}
            />
            Email notifications enabled by default
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              checked={settings.notification_sms_enabled}
              onChange={(e) => update("notification_sms_enabled", e.target.checked)}
            />
            SMS notifications enabled by default
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              checked={settings.notification_push_enabled}
              onChange={(e) => update("notification_push_enabled", e.target.checked)}
            />
            Push notifications enabled by default
          </label>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="From Name"
            value={settings.email_from_name || ""}
            onChange={(e) => update("email_from_name", e.target.value)}
            placeholder="ThuisZorgHub"
          />
          <Input
            label="From Address"
            type="email"
            value={settings.email_from_address || ""}
            onChange={(e) => update("email_from_address", e.target.value)}
            placeholder="noreply@example.com"
          />
          <Input
            label="Reply-To Address"
            type="email"
            value={settings.email_reply_to || ""}
            onChange={(e) => update("email_reply_to", e.target.value)}
            placeholder="support@example.com"
          />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Session Timeout (minutes)"
            type="number"
            value={settings.session_timeout_minutes}
            onChange={(e) => update("session_timeout_minutes", parseInt(e.target.value) || 0)}
          />
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={settings.mfa_required}
                onChange={(e) => update("mfa_required", e.target.checked)}
              />
              Require multi-factor authentication for all users
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.brand_primary_color}
                onChange={(e) => update("brand_primary_color", e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600"
              />
              <Input
                value={settings.brand_primary_color}
                onChange={(e) => update("brand_primary_color", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.brand_secondary_color || "#64748b"}
                onChange={(e) => update("brand_secondary_color", e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600"
              />
              <Input
                value={settings.brand_secondary_color || ""}
                onChange={(e) => update("brand_secondary_color", e.target.value)}
                className="flex-1"
                placeholder="#64748b"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500">Logo upload is managed from the Organization page.</p>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
