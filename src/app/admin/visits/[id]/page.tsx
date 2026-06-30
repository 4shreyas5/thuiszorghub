/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { TaskChecklistWidget } from "@/components/admin/TaskChecklistWidget";
import { MedicationWidget } from "@/components/admin/MedicationWidget";
import { VisitNotesWidget } from "@/components/admin/VisitNotesWidget";
import { Clock, AlertCircle, CheckCircle, Play, Square } from "lucide-react";
import { formatDate } from "date-fns";

export const dynamic = "force-dynamic";

interface TaskItem {
  id: string;
  task_title: string;
  task_type: string;
  time_category: string;
  estimated_duration_minutes?: number;
  instructions?: string;
  completion_status?: string;
}

interface MedicationItem {
  id: string;
  medication_name: string;
  prescribed_dosage?: string;
  administered_dosage?: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface NoteItem {
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

interface Visit {
  id: string;
  title: string;
  visit_type: string;
  status: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  estimated_duration_minutes: number;
  organization_id: string;
  client?: {
    first_name: string;
    last_name: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
  };
  care_plan?: {
    id: string;
    title: string;
  };
}

export default function VisitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const visitId = params.id;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const fetchVisitData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/visits/${visitId}`);
      if (!response.ok) throw new Error("Failed to fetch visit");
      const visitData = await response.json();
      setVisit(visitData);

      // Fetch tasks if in progress
      if (["in_progress", "started"].includes(visitData.status)) {
        const tasksRes = await fetch(`/api/visits/${visitId}/execute/tasks`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.tasks);
        }

        const medRes = await fetch(`/api/visits/${visitId}/execute/medications`);
        if (medRes.ok) {
          const medData = await medRes.json();
          setMedications(medData.medications);
        }

        const notesRes = await fetch(`/api/visits/${visitId}/execute/notes`);
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData.notes);
        }

      }
    } catch (err) {
      console.error("Error fetching visit data:", err);
      setError(err instanceof Error ? err.message : "Failed to load visit");
    } finally {
      setLoading(false);
    }
  }, [visitId]);

   
  useEffect(() => {
    fetchVisitData();
  }, [fetchVisitData]);

  const handleStartVisit = async () => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      const response = await fetch(`/api/visits/${visitId}/execute/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual_start_time: timeStr }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setIsEditing(true);
      await fetchVisitData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start visit");
    }
  };

  const handleTaskComplete = async (taskId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/visits/${visitId}/execute/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ care_plan_task_id: taskId, status, notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record task");
      }

      await fetchVisitData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record task");
    }
  };

  const handleAddMedication = async (data: any) => {
    try {
      const response = await fetch(`/api/visits/${visitId}/execute/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record medication");
      }

      await fetchVisitData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record medication");
    }
  };

  const handleAddNote = async (data: any) => {
    try {
      const response = await fetch(`/api/visits/${visitId}/execute/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save note");
      }

      await fetchVisitData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    }
  };

  const handleCompleteVisit = async () => {
    if (!completionNotes.trim()) {
      setError("Completion notes are required");
      return;
    }

    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      const response = await fetch(`/api/visits/${visitId}/execute/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual_end_time: timeStr, notes: completionNotes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete visit");
      }

      setIsEditing(false);
      setCompletionNotes("");
      await fetchVisitData();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete visit");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Visit not found</h2>
        <Button onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const isInProgress = ["in_progress", "started"].includes(visit.status);
  const isCompleted = visit.status === "completed";
  const canStart = ["scheduled", "confirmed"].includes(visit.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={visit.title}
          description={`${visit.visit_type} • ${formatDate(
            new Date(`${visit.scheduled_date}T${visit.start_time}`),
            "MMM d, yyyy HH:mm"
          )}`}
        />
        <div className="flex gap-2">
          {canStart && (
            <Button onClick={handleStartVisit} className="gap-2">
              <Play className="w-4 h-4" />
              Start Visit
            </Button>
          )}
          {isInProgress && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "secondary" : "outline"}
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              {isEditing ? "Stop Editing" : "Edit"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isCompleted && (
        <div className="flex gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">This visit has been completed</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visit Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">Visit Information</h3>

          {visit.client && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {visit.client.first_name} {visit.client.last_name}
              </p>
            </div>
          )}

          {visit.employee && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Employee</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {visit.employee.first_name} {visit.employee.last_name}
              </p>
            </div>
          )}

          {visit.care_plan && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Care Plan</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {visit.care_plan.title}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              isCompleted ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" :
              isInProgress ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" :
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}>
              {visit.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm">
              {visit.estimated_duration_minutes} min
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
            <p className="text-sm font-medium">
              {visit.start_time} - {visit.end_time}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {isInProgress && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <TaskChecklistWidget
                  tasks={tasks}
                  isEditing={isEditing}
                  onTaskComplete={handleTaskComplete}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <MedicationWidget
                  medications={medications}
                  isEditing={isEditing}
                  onAddMedication={handleAddMedication}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <VisitNotesWidget
                  notes={notes}
                  isEditing={isEditing}
                  onAddNote={handleAddNote}
                />
              </div>

              {isEditing && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Complete Visit</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Completion Notes *
                    </label>
                    <textarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Summary of the visit, any observations, or incidents..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCompleteVisit}>
                      Complete Visit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {!isInProgress && !isCompleted && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
              <p className="text-blue-900 dark:text-blue-200">
                Click &quot;Start Visit&quot; to begin recording visit details
              </p>
            </div>
          )}

          {isCompleted && notes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Completed Notes</h3>
              <VisitNotesWidget
                notes={notes}
                isEditing={false}
                onAddNote={async () => {}}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
