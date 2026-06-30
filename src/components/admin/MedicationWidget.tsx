/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Pill, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Medication {
  id: string;
  medication_name: string;
  prescribed_dosage?: string;
  administered_dosage?: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface MedicationWidgetProps {
  medications: Medication[];
  isEditing: boolean;
  onAddMedication: (data: Record<string, unknown>) => Promise<void>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  given: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200" },
  not_given: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-800 dark:text-gray-200" },
  refused: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200" },
  unavailable: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200" },
  late: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-200" },
};

export function MedicationWidget({
  medications,
  isEditing,
  onAddMedication,
}: MedicationWidgetProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: "",
    prescribed_dosage: "",
    administered_dosage: "",
    status: "given" as const,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddMedication(formData);
      setFormData({
        medication_name: "",
        prescribed_dosage: "",
        administered_dosage: "",
        status: "given",
        notes: "",
      });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const givenCount = medications.filter((m) => m.status === "given").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Medications</h3>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {givenCount} given
        </span>
      </div>

      {medications.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          No medications recorded
        </div>
      ) : (
        <div className="space-y-2">
          {medications.map((med) => (
            <div
              key={med.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {med.medication_name}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {med.prescribed_dosage && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Prescribed: {med.prescribed_dosage}
                      </span>
                    )}
                    {med.administered_dosage && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Given: {med.administered_dosage}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        STATUS_COLORS[med.status]?.bg || "bg-gray-100"
                      } ${STATUS_COLORS[med.status]?.text || "text-gray-800"}`}
                    >
                      {med.status}
                    </span>
                  </div>
                  {med.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {med.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Medication
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.medication_name}
                  onChange={(e) =>
                    setFormData({ ...formData, medication_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="e.g., Aspirin"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prescribed Dosage
                  </label>
                  <input
                    type="text"
                    value={formData.prescribed_dosage}
                    onChange={(e) =>
                      setFormData({ ...formData, prescribed_dosage: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Administered Dosage
                  </label>
                  <input
                    type="text"
                    value={formData.administered_dosage}
                    onChange={(e) =>
                      setFormData({ ...formData, administered_dosage: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="e.g., 500mg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="given">Given</option>
                  <option value="not_given">Not Given</option>
                  <option value="refused">Refused</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  Save Medication
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
