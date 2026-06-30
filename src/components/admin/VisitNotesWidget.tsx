/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "date-fns";

interface Note {
  id: string;
  category: string;
  content: string;
  mood_score?: number;
  pain_score?: number;
  vital_signs?: Record<string, string>;
  recommendations?: string;
  created_by_id: string;
  created_at: string;
}

interface VisitNotesWidgetProps {
  notes: Note[];
  isEditing: boolean;
  onAddNote: (data: Record<string, unknown>) => Promise<void>;
}

const CATEGORY_COLORS: Record<string, string> = {
  observation: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  incident: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  mood: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  pain: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  vitals: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  recommendation: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
};

export function VisitNotesWidget({
  notes,
  isEditing,
  onAddNote,
}: VisitNotesWidgetProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "observation" as const,
    content: "",
    mood_score: undefined as number | undefined,
    pain_score: undefined as number | undefined,
    recommendations: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddNote(formData);
      setFormData({
        category: "observation",
        content: "",
        mood_score: undefined,
        pain_score: undefined,
        recommendations: "",
      });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Visit Notes</h3>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          No notes recorded
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-start gap-2 mb-2">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    CATEGORY_COLORS[note.category] || CATEGORY_COLORS.observation
                  }`}
                >
                  {note.category}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(new Date(note.created_at), "MMM d, HH:mm")}
                </span>
              </div>

              <p className="text-sm text-gray-900 dark:text-white mb-2">
                {note.content}
              </p>

              {(note.mood_score || note.pain_score) && (
                <div className="flex gap-4 text-sm mb-2">
                  {note.mood_score && (
                    <span className="text-gray-600 dark:text-gray-400">
                      Mood: <span className="font-medium">{note.mood_score}/10</span>
                    </span>
                  )}
                  {note.pain_score && (
                    <span className="text-gray-600 dark:text-gray-400">
                      Pain: <span className="font-medium">{note.pain_score}/10</span>
                    </span>
                  )}
                </div>
              )}

              {note.vital_signs && Object.keys(note.vital_signs).length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Vitals:</span>
                  {Object.entries(note.vital_signs).map(([key, value]) => (
                    <span key={key} className="ml-2">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}

              {note.recommendations && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-900 dark:text-blue-200 mt-2">
                  <span className="font-medium">Recommendations:</span>
                  <p className="mt-1">{note.recommendations}</p>
                </div>
              )}
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
              Add Note
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="observation">Observation</option>
                  <option value="incident">Incident</option>
                  <option value="mood">Mood</option>
                  <option value="pain">Pain</option>
                  <option value="vitals">Vitals</option>
                  <option value="recommendation">Recommendation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Write your note here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mood Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.mood_score || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mood_score: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pain Score (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.pain_score || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pain_score: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Recommendations
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) =>
                    setFormData({ ...formData, recommendations: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Any recommendations for future care..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  Save Note
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
