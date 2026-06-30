"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/core/context/auth-context";
import { PageHeader } from "@/components/admin/PageHeader";
import { Mail, Save } from "lucide-react";

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject_template: string;
  body_html_template: string;
  variables: string[];
  is_active: boolean;
}

const DEFAULT_TEMPLATES = [
  {
    templateKey: "welcome_email",
    templateName: "Welcome Email",
    variables: ["firstName", "organizationName", "loginUrl"],
  },
  {
    templateKey: "new_employee",
    templateName: "New Employee Notification",
    variables: ["firstName", "lastName", "position", "startDate"],
  },
  {
    templateKey: "new_client",
    templateName: "New Client Notification",
    variables: ["firstName", "lastName", "caseManager"],
  },
  {
    templateKey: "visit_reminder",
    templateName: "Visit Reminder",
    variables: ["clientName", "visitTime", "visitAddress", "caregiverName"],
  },
  {
    templateKey: "assignment_created",
    templateName: "Assignment Created",
    variables: ["employeeName", "clientName", "visitTime"],
  },
  {
    templateKey: "invoice_generated",
    templateName: "Invoice Generated",
    variables: ["clientName", "invoiceNumber", "amount", "dueDate"],
  },
  {
    templateKey: "invoice_overdue",
    templateName: "Invoice Overdue Reminder",
    variables: ["clientName", "invoiceNumber", "amount", "daysOverdue"],
  },
  {
    templateKey: "password_reset",
    templateName: "Password Reset",
    variables: ["firstName", "resetLink", "expiryTime"],
  },
  {
    templateKey: "care_plan_review_due",
    templateName: "Care Plan Review Due",
    variables: ["clientName", "reviewDate", "caseManager"],
  },
];

export default function EmailTemplatesPage() {
  const { isLoading } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const response = await fetch("/api/templates");
      const data = await response.json();

      // Fill in defaults for missing templates
      const existingKeys = (data.data || []).map((t: EmailTemplate) => t.template_key);
      const missingDefaults = DEFAULT_TEMPLATES.filter(
        (dt) => !existingKeys.includes(dt.templateKey)
      );

      setTemplates([
        ...(data.data || []),
        ...missingDefaults.map((dt) => ({
          id: "",
          template_key: dt.templateKey,
          template_name: dt.templateName,
          subject_template: "",
          body_html_template: "",
          variables: dt.variables,
          is_active: false,
        })),
      ]);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTemplate() {
    if (!editingTemplate || !selectedTemplate) return;

    try {
      setSaving(true);

      const method = selectedTemplate.id ? "PUT" : "POST";
      const url = selectedTemplate.id
        ? `/api/templates/${selectedTemplate.id}`
        : "/api/templates";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: editingTemplate.template_name,
          subjectTemplate: editingTemplate.subject_template,
          bodyHtmlTemplate: editingTemplate.body_html_template,
          variables: editingTemplate.variables,
          isActive: editingTemplate.is_active,
          templateKey: editingTemplate.template_key,
        }),
      });

      if (!response.ok) throw new Error("Save failed");

      alert("Template saved successfully!");
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Email Templates" description="Manage email templates" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Email Templates" description="Edit email notification templates" />

      <div className="grid grid-cols-3 gap-6">
        {/* Template List */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Templates</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id || template.template_key}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setEditingTemplate(template);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                    selectedTemplate?.template_key === template.template_key
                      ? "bg-blue-50 border-l-4 border-l-blue-600"
                      : ""
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {template.template_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.template_key}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="col-span-2">
          {editingTemplate ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingTemplate.template_name}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.subject_template || ""}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          subject_template: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email subject with {{variables}}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use double curly braces for variables: {"{{"}{"}}"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Body
                    </label>
                    <textarea
                      value={editingTemplate.body_html_template || ""}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          body_html_template: e.target.value,
                        })
                      }
                      rows={12}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="<p>Hello {{firstName}},</p>"
                    />
                  </div>

                  {editingTemplate.variables && editingTemplate.variables.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Variables
                      </label>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex flex-wrap gap-2">
                          {editingTemplate.variables.map((variable) => (
                            <code
                              key={variable}
                              className="bg-gray-900 text-gray-100 px-2 py-1 rounded text-xs"
                            >
                              {"{{"}{variable}{"}"}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingTemplate.is_active || false}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>

                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Template"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a template to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
