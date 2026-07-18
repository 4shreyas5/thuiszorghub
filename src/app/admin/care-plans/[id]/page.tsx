"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Pencil,
  X,
  Archive,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Download,
  Eye,
  FileText,
  Clock3,
  Pill,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  CarePlan,
  CarePlanGoal,
  CarePlanTask,
  CarePlanReview,
  UpdateCarePlanPayload,
} from "@/types/care-plan";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { CarePlanForm } from "@/components/admin/CarePlanForm";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface AuditLogEntry {
  id: string;
  action: string;
  created_at: string;
  users: { first_name: string; last_name: string; email: string } | null;
}

interface DocumentEntry {
  id: string;
  file_name: string;
  document_type: string;
  verification_status: string;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "goals", label: "Goals" },
  { value: "tasks", label: "Tasks" },
  { value: "reviews", label: "Reviews" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function CarePlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const carePlanId = params.id as string;

  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [goals, setGoals] = useState<CarePlanGoal[]>([]);
  const [tasks, setTasks] = useState<CarePlanTask[]>([]);
  const [reviews, setReviews] = useState<CarePlanReview[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);

  const [isEditing, setIsEditing] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("edit") === "true"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    goal_statement: "",
    priority: "normal",
    target_date: "",
    notes: "",
  });
  const [savingGoal, setSavingGoal] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    task_title: "",
    task_type: "care",
    time_category: "morning",
    instructions: "",
    start_date: new Date().toISOString().split("T")[0],
  });
  const [savingTask, setSavingTask] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    scheduled_date: "",
    outcome: "",
    recommendations: "",
  });
  const [savingReview, setSavingReview] = useState(false);
  const [completingReview, setCompletingReview] = useState<CarePlanReview | null>(null);
  const [completeForm, setCompleteForm] = useState({ outcome: "", recommendations: "" });
  const [savingComplete, setSavingComplete] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchCarePlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/care-plans/${carePlanId}`);
      if (!response.ok) throw new Error("Failed to fetch care plan");
      setCarePlan(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load care plan");
    } finally {
      setLoading(false);
    }
  }, [carePlanId]);

  const fetchGoals = useCallback(async () => {
    try {
      setLoadingGoals(true);
      const response = await fetch(`/api/care-plans/${carePlanId}/goals`);
      if (response.ok) setGoals((await response.json()) || []);
    } finally {
      setLoadingGoals(false);
    }
  }, [carePlanId]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const response = await fetch(`/api/care-plans/${carePlanId}/tasks`);
      if (response.ok) setTasks((await response.json()) || []);
    } finally {
      setLoadingTasks(false);
    }
  }, [carePlanId]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const response = await fetch(`/api/care-plans/${carePlanId}/reviews`);
      if (response.ok) setReviews((await response.json()) || []);
    } finally {
      setLoadingReviews(false);
    }
  }, [carePlanId]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch(
        `/api/documents?entityType=care_plan&entityId=${carePlanId}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } finally {
      setLoadingDocuments(false);
    }
  }, [carePlanId]);

  useEffect(() => {
    // Deferred to a microtask so these fetch triggers aren't synchronous setState calls in the effect body.
    queueMicrotask(() => {
      fetchCarePlan();
      fetchGoals();
      fetchTasks();
      fetchReviews();
      fetchDocuments();

      const fetchAuditLogs = async () => {
        try {
          setLoadingAudit(true);
          const response = await fetch(
            `/api/audit-logs?entityType=care_plans&entityId=${carePlanId}&limit=20`
          );
          if (response.ok) {
            const data = await response.json();
            setAuditLogs(data.data || []);
          }
        } finally {
          setLoadingAudit(false);
        }
      };
      fetchAuditLogs();
    });
  }, [carePlanId, fetchCarePlan, fetchGoals, fetchTasks, fetchReviews, fetchDocuments]);

  const handleUpdateSubmit = async (data: UpdateCarePlanPayload) => {
    try {
      setIsSaving(true);
      setError(null);
      const response = await fetch(`/api/care-plans/${carePlanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update care plan");
      setCarePlan(result);
      setIsEditing(false);
      addToast({ type: "success", message: "Care plan updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update care plan";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/care-plans/${carePlanId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to archive care plan");
      await fetchCarePlan();
      addToast({ type: "success", message: "Care plan archived" });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to archive care plan",
      });
    } finally {
      setStatusActionLoading(false);
      setConfirmArchive(false);
    }
  };

  const handleActivate = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/care-plans/${carePlanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!response.ok) throw new Error("Failed to activate care plan");
      setCarePlan(await response.json());
      addToast({ type: "success", message: "Care plan is active again" });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to activate care plan",
      });
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalForm.goal_statement.trim()) {
      addToast({ type: "warning", message: "Goal statement is required" });
      return;
    }
    try {
      setSavingGoal(true);
      const response = await fetch(`/api/care-plans/${carePlanId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalForm),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to add goal");
      addToast({ type: "success", message: "Goal added" });
      setGoalModalOpen(false);
      setGoalForm({ goal_statement: "", priority: "normal", target_date: "", notes: "" });
      fetchGoals();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to add goal",
      });
    } finally {
      setSavingGoal(false);
    }
  };

  const handleCompleteGoal = async (goal: CarePlanGoal) => {
    try {
      const response = await fetch(`/api/care-plans/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", completion_percentage: 100 }),
      });
      if (!response.ok) throw new Error("Failed to update goal");
      addToast({ type: "success", message: "Goal marked complete" });
      fetchGoals();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update goal",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/care-plans/goals/${goalId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove goal");
      fetchGoals();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove goal",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.task_title.trim()) {
      addToast({ type: "warning", message: "Task title is required" });
      return;
    }
    try {
      setSavingTask(true);
      const response = await fetch(`/api/care-plans/${carePlanId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to add task");
      addToast({ type: "success", message: "Task added" });
      setTaskModalOpen(false);
      setTaskForm({
        task_title: "",
        task_type: "care",
        time_category: "morning",
        instructions: "",
        start_date: new Date().toISOString().split("T")[0],
      });
      fetchTasks();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to add task",
      });
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/care-plans/tasks/${taskId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove task");
      fetchTasks();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove task",
      });
    }
  };

  const handleScheduleReview = async () => {
    if (!reviewForm.scheduled_date) {
      addToast({ type: "warning", message: "A scheduled date is required" });
      return;
    }
    try {
      setSavingReview(true);
      const response = await fetch(`/api/care-plans/${carePlanId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      if (!response.ok)
        throw new Error((await response.json()).error || "Failed to schedule review");
      addToast({ type: "success", message: "Review scheduled" });
      setReviewModalOpen(false);
      setReviewForm({ scheduled_date: "", outcome: "", recommendations: "" });
      fetchReviews();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to schedule review",
      });
    } finally {
      setSavingReview(false);
    }
  };

  const handleCompleteReview = async () => {
    if (!completingReview) return;
    try {
      setSavingComplete(true);
      const response = await fetch(`/api/care-plans/reviews/${completingReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...completeForm, status: "completed" }),
      });
      if (!response.ok) throw new Error("Failed to complete review");
      addToast({ type: "success", message: "Review completed" });
      setCompletingReview(null);
      setCompleteForm({ outcome: "", recommendations: "" });
      fetchReviews();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to complete review",
      });
    } finally {
      setSavingComplete(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/care-plans/reviews/${reviewId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove review");
      fetchReviews();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove review",
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadDocumentType) {
      addToast({ type: "warning", message: "Choose a document type and a file first" });
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("entityType", "care_plan");
      formData.append("entityId", carePlanId);
      formData.append("documentType", uploadDocumentType);

      const response = await fetch("/api/documents", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");

      addToast({ type: "success", message: "Document uploaded" });
      setUploadFile(null);
      setUploadDocumentType("");
      fetchDocuments();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to upload document",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      addToast({ type: "success", message: "Document deleted" });
      fetchDocuments();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete document",
      });
    }
  };

  const handleDownloadDocument = async (doc: DocumentEntry) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      addToast({ type: "error", message: "Failed to download document" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} bordered>
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-4 h-8 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!carePlan) {
    return (
      <div className="space-y-6">
        <PageHeader title="Care Plan Not Found" />
        <Card bordered padding="lg" className="text-center">
          <p className="mb-4 text-muted-foreground">
            The care plan you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/care-plans")}>Back to Care Plans</Button>
        </Card>
      </div>
    );
  }

  const medicationTasks = tasks.filter((t) => t.task_type === "medication");
  const otherTasks = tasks.filter((t) => t.task_type !== "medication");
  const upcomingReviews = reviews.filter((r) => r.status === "scheduled");
  const pastReviews = reviews.filter((r) => r.status !== "scheduled");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {carePlan.title}
            </h1>
            <StatusBadge status={carePlan.status} size="sm" />
            <Badge
              variant={
                carePlan.priority === "urgent" || carePlan.priority === "high"
                  ? "danger"
                  : "default"
              }
              size="sm"
              className="capitalize"
            >
              {carePlan.priority}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {carePlan.client ? (
              <Link
                href={`/admin/clients/${carePlan.client.id}`}
                className="hover:text-primary hover:underline"
              >
                {carePlan.client.first_name} {carePlan.client.last_name}
              </Link>
            ) : (
              "No client"
            )}
          </p>
        </div>
        {!isEditing && (
          <div className="flex shrink-0 gap-2">
            {carePlan.status === "archived" ? (
              <Button variant="outline" onClick={handleActivate} loading={statusActionLoading}>
                <RotateCcw className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                Activate
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setConfirmArchive(true)}>
                <Archive className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                Archive
              </Button>
            )}
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              Edit
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {isEditing ? (
        <Card bordered padding="lg">
          <CardHeader className="flex flex-row items-center justify-between" divided>
            <CardTitle size="sm">Edit Care Plan</CardTitle>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cancel editing"
            >
              <X className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
            </button>
          </CardHeader>
          <CarePlanForm carePlan={carePlan} isLoading={isSaving} onSubmit={handleUpdateSubmit} />
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Details</CardTitle>
                </CardHeader>
                <dl className="divide-y divide-border">
                  <DetailRow
                    label="Primary Caregiver"
                    value={
                      carePlan.primary_caregiver
                        ? `${carePlan.primary_caregiver.first_name} ${carePlan.primary_caregiver.last_name}`
                        : "Unassigned"
                    }
                  />
                  <DetailRow
                    label="Start Date"
                    value={new Date(carePlan.start_date).toLocaleDateString("nl-NL")}
                  />
                  <DetailRow
                    label="Review Date"
                    value={
                      carePlan.review_date
                        ? new Date(carePlan.review_date).toLocaleDateString("nl-NL")
                        : "—"
                    }
                  />
                  <DetailRow
                    label="End Date"
                    value={
                      carePlan.end_date
                        ? new Date(carePlan.end_date).toLocaleDateString("nl-NL")
                        : "Ongoing"
                    }
                  />
                </dl>
              </Card>

              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Description</CardTitle>
                </CardHeader>
                <p className="text-sm text-muted-foreground">
                  {carePlan.description || "No description on file."}
                </p>
              </Card>
            </div>

            {carePlan.assessment_notes && (
              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Assessment Notes</CardTitle>
                </CardHeader>
                <p className="text-sm text-muted-foreground">{carePlan.assessment_notes}</p>
              </Card>
            )}

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">System Information</CardTitle>
              </CardHeader>
              <dl className="divide-y divide-border">
                <DetailRow
                  label="Created"
                  value={new Date(carePlan.created_at).toLocaleString("nl-NL")}
                />
                <DetailRow
                  label="Last Updated"
                  value={new Date(carePlan.updated_at).toLocaleString("nl-NL")}
                />
              </dl>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card bordered padding="md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle size="sm">Goals</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setGoalModalOpen(true)}>
                  <Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                  Add Goal
                </Button>
              </CardHeader>
              {loadingGoals ? (
                <Skeleton className="h-20 w-full" />
              ) : goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No goals added yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {goals.map((goal) => (
                    <li key={goal.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{goal.goal_statement}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${goal.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {goal.completion_percentage}%
                          </span>
                          <StatusBadge status={goal.status} size="sm" />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {goal.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Mark complete"
                            onClick={() => handleCompleteGoal(goal)}
                          >
                            <CheckCircle2
                              className={ICON_SIZE.sm}
                              strokeWidth={ICON_STROKE_WIDTH}
                            />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-danger hover:text-danger"
                          aria-label="Remove"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {medicationTasks.length > 0 && (
              <Card bordered padding="md" className="border-l-4 border-l-info">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Pill className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                  <CardTitle size="sm">Medication References</CardTitle>
                </CardHeader>
                <ul className="divide-y divide-border">
                  {medicationTasks.map((task) => (
                    <li key={task.id} className="flex items-start justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{task.task_title}</p>
                        {task.instructions && (
                          <p className="text-xs text-muted-foreground">{task.instructions}</p>
                        )}
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                          {task.time_category} · {task.frequency || "As instructed"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-danger hover:text-danger"
                        aria-label="Remove"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card bordered padding="md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle size="sm">Tasks</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setTaskModalOpen(true)}>
                  <Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                  Add Task
                </Button>
              </CardHeader>
              {loadingTasks ? (
                <Skeleton className="h-20 w-full" />
              ) : otherTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks added yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {otherTasks.map((task) => (
                    <li key={task.id} className="flex items-start justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{task.task_title}</p>
                        {task.instructions && (
                          <p className="text-xs text-muted-foreground">{task.instructions}</p>
                        )}
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                          {task.task_type} · {task.time_category}
                          {task.assigned_employee
                            ? ` · ${task.assigned_employee.first_name} ${task.assigned_employee.last_name}`
                            : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-danger hover:text-danger"
                        aria-label="Remove"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card bordered padding="md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle size="sm">Upcoming Reviews</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setReviewModalOpen(true)}>
                  <Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                  Schedule Review
                </Button>
              </CardHeader>
              {loadingReviews ? (
                <Skeleton className="h-16 w-full" />
              ) : upcomingReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews scheduled.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {upcomingReviews.map((review) => (
                    <li key={review.id} className="flex items-center justify-between gap-3 py-2.5">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(review.scheduled_date).toLocaleDateString("nl-NL")}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCompletingReview(review)}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-danger hover:text-danger"
                          aria-label="Cancel"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {pastReviews.length > 0 && (
              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Past Reviews</CardTitle>
                </CardHeader>
                <ul className="divide-y divide-border">
                  {pastReviews.map((review) => (
                    <li key={review.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {new Date(review.scheduled_date).toLocaleDateString("nl-NL")}
                        </p>
                        <StatusBadge status={review.status} size="sm" />
                      </div>
                      {review.outcome && (
                        <p className="mt-1 text-xs text-muted-foreground">{review.outcome}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Upload Document</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Document Type"
                  placeholder="Select document type..."
                  value={uploadDocumentType}
                  onChange={(e) => setUploadDocumentType(e.target.value)}
                  options={DOCUMENT_TYPES}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleUpload} loading={uploading}>
                  <Upload className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                  Upload
                </Button>
              </div>
            </Card>

            {loadingDocuments ? (
              <Card bordered padding="md" className="space-y-3">
                <Skeleton className="h-10 w-full" />
              </Card>
            ) : documents.length === 0 ? (
              <Card bordered padding="md">
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Uploaded documents for this care plan will appear here."
                />
              </Card>
            ) : (
              <Table>
                <TableHead>
                  <TableRow hover={false}>
                    <TableHeaderCell>File</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Uploaded</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium text-foreground">{doc.file_name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {doc.document_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={doc.verification_status}
                          label={doc.verification_status}
                          className="capitalize"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(doc.uploaded_at), "PP")}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Preview"
                            asChild
                          >
                            <a
                              href={`/api/documents/${doc.id}/preview`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Download"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-danger hover:text-danger"
                            aria-label="Delete"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Audit History</CardTitle>
              </CardHeader>
              {loadingAudit ? (
                <Skeleton className="h-16 w-full" />
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
              ) : (
                <ul className="space-y-4">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Clock3 className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium capitalize">{log.action}</span> by{" "}
                          {log.users
                            ? `${log.users.first_name} ${log.users.last_name}`.trim() ||
                              log.users.email
                            : "system"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("nl-NL")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Modal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="Add Goal"
        actions={
          <>
            <Button variant="secondary" onClick={() => setGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} loading={savingGoal}>
              Add Goal
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Goal Statement"
            required
            value={goalForm.goal_statement}
            onChange={(e) => setGoalForm((f) => ({ ...f, goal_statement: e.target.value }))}
            rows={3}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={goalForm.priority}
            onChange={(e) => setGoalForm((f) => ({ ...f, priority: e.target.value }))}
          />
          <Input
            label="Target Date"
            type="date"
            value={goalForm.target_date}
            onChange={(e) => setGoalForm((f) => ({ ...f, target_date: e.target.value }))}
          />
          <Textarea
            label="Notes"
            value={goalForm.notes}
            onChange={(e) => setGoalForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />
        </div>
      </Modal>

      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Add Task"
        actions={
          <>
            <Button variant="secondary" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} loading={savingTask}>
              Add Task
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            required
            value={taskForm.task_title}
            onChange={(e) => setTaskForm((f) => ({ ...f, task_title: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              options={[
                { value: "care", label: "Care" },
                { value: "medication", label: "Medication" },
                { value: "assessment", label: "Assessment" },
                { value: "therapy", label: "Therapy" },
                { value: "social", label: "Social" },
                { value: "other", label: "Other" },
              ]}
              value={taskForm.task_type}
              onChange={(e) => setTaskForm((f) => ({ ...f, task_type: e.target.value }))}
            />
            <Select
              label="Time"
              options={[
                { value: "morning", label: "Morning" },
                { value: "afternoon", label: "Afternoon" },
                { value: "evening", label: "Evening" },
                { value: "night", label: "Night" },
                { value: "prn", label: "As needed" },
                { value: "custom", label: "Custom" },
              ]}
              value={taskForm.time_category}
              onChange={(e) => setTaskForm((f) => ({ ...f, time_category: e.target.value }))}
            />
          </div>
          <Input
            label="Start Date"
            type="date"
            required
            value={taskForm.start_date}
            onChange={(e) => setTaskForm((f) => ({ ...f, start_date: e.target.value }))}
          />
          <Textarea
            label="Instructions"
            value={taskForm.instructions}
            onChange={(e) => setTaskForm((f) => ({ ...f, instructions: e.target.value }))}
            rows={2}
          />
        </div>
      </Modal>

      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Schedule Review"
        actions={
          <>
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleReview} loading={savingReview}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Scheduled Date"
            type="date"
            required
            value={reviewForm.scheduled_date}
            onChange={(e) => setReviewForm((f) => ({ ...f, scheduled_date: e.target.value }))}
          />
          <Textarea
            label="Notes"
            helperText="Optional"
            value={reviewForm.recommendations}
            onChange={(e) => setReviewForm((f) => ({ ...f, recommendations: e.target.value }))}
            rows={2}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!completingReview}
        onClose={() => setCompletingReview(null)}
        title="Complete Review"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCompletingReview(null)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteReview} loading={savingComplete}>
              Mark Complete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Outcome"
            value={completeForm.outcome}
            onChange={(e) => setCompleteForm((f) => ({ ...f, outcome: e.target.value }))}
            rows={3}
          />
          <Textarea
            label="Recommendations"
            value={completeForm.recommendations}
            onChange={(e) => setCompleteForm((f) => ({ ...f, recommendations: e.target.value }))}
            rows={3}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmArchive}
        title="Archive care plan"
        message="This care plan will be moved out of active selectors but its goals, tasks, reviews and history stay intact. You can reactivate it at any time."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
        isLoading={statusActionLoading}
      />
    </div>
  );
}
