/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Square,
  XCircle,
  UserX,
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Clock3,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { TaskChecklistWidget } from "@/components/admin/TaskChecklistWidget";
import { MedicationWidget } from "@/components/admin/MedicationWidget";
import { VisitNotesWidget } from "@/components/admin/VisitNotesWidget";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

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
  client?: { first_name: string; last_name: string };
  employee?: { first_name: string; last_name: string };
  care_plan?: { id: string; title: string };
}

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
  { value: "photos", label: "Photos" },
  { value: "attachments", label: "Attachments" },
  { value: "incident_reports", label: "Incident Reports" },
  { value: "signed_forms", label: "Signed Forms" },
  { value: "completion_documents", label: "Completion Documents" },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function VisitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const visitId = params.id as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmNoShow, setConfirmNoShow] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchVisitData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/visits/${visitId}`);
      if (!response.ok) throw new Error("Failed to fetch visit");
      const visitData = await response.json();
      setVisit(visitData);

      if (["in_progress", "started"].includes(visitData.status)) {
        const tasksRes = await fetch(`/api/visits/${visitId}/execute/tasks`);
        if (tasksRes.ok) setTasks((await tasksRes.json()).tasks);

        const medRes = await fetch(`/api/visits/${visitId}/execute/medications`);
        if (medRes.ok) setMedications((await medRes.json()).medications);

        const notesRes = await fetch(`/api/visits/${visitId}/execute/notes`);
        if (notesRes.ok) setNotes((await notesRes.json()).notes);
      }
    } catch (err) {
      console.error("Error fetching visit data:", err);
      setError(err instanceof Error ? err.message : "Failed to load visit");
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch(`/api/documents?entityType=visit&entityId=${visitId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } finally {
      setLoadingDocuments(false);
    }
  }, [visitId]);

  useEffect(() => {
    // Deferred to a microtask so these fetch triggers aren't synchronous setState calls in the effect body.
    queueMicrotask(() => {
      fetchVisitData();
      fetchDocuments();

      const fetchAuditLogs = async () => {
        try {
          setLoadingAudit(true);
          const response = await fetch(
            `/api/audit-logs?entityType=scheduled_visits&entityId=${visitId}&limit=20`
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
  }, [visitId, fetchVisitData, fetchDocuments]);

  const handleStartVisit = async () => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const response = await fetch(`/api/visits/${visitId}/execute/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual_start_time: timeStr }),
      });

      if (!response.ok) throw new Error(await response.text());

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
      if (!response.ok) throw new Error((await response.json()).error || "Failed to record task");
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
      if (!response.ok)
        throw new Error((await response.json()).error || "Failed to record medication");
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
      if (!response.ok) throw new Error((await response.json()).error || "Failed to save note");
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
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const response = await fetch(`/api/visits/${visitId}/execute/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual_end_time: timeStr, notes: completionNotes }),
      });
      if (!response.ok)
        throw new Error((await response.json()).error || "Failed to complete visit");

      setIsEditing(false);
      setCompletionNotes("");
      await fetchVisitData();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete visit");
    }
  };

  const handleCancelVisit = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/visits/${visitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!response.ok) throw new Error("Failed to cancel visit");
      await fetchVisitData();
      addToast({ type: "success", message: "Visit cancelled" });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to cancel visit",
      });
    } finally {
      setStatusActionLoading(false);
      setConfirmCancel(false);
    }
  };

  const handleNoShow = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/visits/${visitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "no_show" }),
      });
      if (!response.ok) throw new Error("Failed to mark as no-show");
      await fetchVisitData();
      addToast({ type: "success", message: "Visit marked as no-show" });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to mark as no-show",
      });
    } finally {
      setStatusActionLoading(false);
      setConfirmNoShow(false);
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
      formData.append("entityType", "visit");
      formData.append("entityId", visitId);
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
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Visit Not Found" />
        <Card bordered padding="lg" className="text-center">
          <p className="mb-4 text-muted-foreground">
            The visit you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/visits")}>Back to Visits</Button>
        </Card>
      </div>
    );
  }

  const isInProgress = ["in_progress", "started"].includes(visit.status);
  const isCompleted = visit.status === "completed";
  const isClosed = ["completed", "cancelled", "no_show"].includes(visit.status);
  const canStart = ["scheduled", "confirmed"].includes(visit.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{visit.title}</h1>
            <StatusBadge status={visit.status} size="sm" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {visit.visit_type} ·{" "}
            {format(new Date(`${visit.scheduled_date}T${visit.start_time}`), "MMM d, yyyy HH:mm")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {canStart && (
            <Button onClick={handleStartVisit}>
              <Play className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              Start Visit
            </Button>
          )}
          {isInProgress && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "secondary" : "outline"}
            >
              <Square className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              {isEditing ? "Stop Editing" : "Edit"}
            </Button>
          )}
          {!isClosed && (
            <>
              <Button variant="outline" onClick={() => setConfirmNoShow(true)}>
                <UserX className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                No Show
              </Button>
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                <XCircle className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex gap-3 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <AlertCircle
            className={`${ICON_SIZE.md} mt-0.5 shrink-0`}
            strokeWidth={ICON_STROKE_WIDTH}
          />
          <p>{error}</p>
        </div>
      )}

      {isCompleted && (
        <div className="flex gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle
            className={`${ICON_SIZE.md} mt-0.5 shrink-0`}
            strokeWidth={ICON_STROKE_WIDTH}
          />
          <p>This visit has been completed.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card bordered padding="md">
          <CardHeader>
            <CardTitle size="sm">Visit Information</CardTitle>
          </CardHeader>
          <dl className="divide-y divide-border">
            {visit.client && (
              <DetailRow
                label="Client"
                value={`${visit.client.first_name} ${visit.client.last_name}`}
              />
            )}
            {visit.employee && (
              <DetailRow
                label="Employee"
                value={`${visit.employee.first_name} ${visit.employee.last_name}`}
              />
            )}
            {visit.care_plan && <DetailRow label="Care Plan" value={visit.care_plan.title} />}
            <DetailRow
              label="Duration"
              value={
                <span className="inline-flex items-center gap-1">
                  <Clock className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                  {visit.estimated_duration_minutes} min
                </span>
              }
            />
            <DetailRow
              label="Scheduled"
              value={`${visit.start_time?.slice(0, 5)} - ${visit.end_time?.slice(0, 5)}`}
            />
          </dl>
        </Card>

        <div className="space-y-6 md:col-span-2">
          {isInProgress && (
            <>
              <Card bordered padding="md">
                <TaskChecklistWidget
                  tasks={tasks}
                  isEditing={isEditing}
                  onTaskComplete={handleTaskComplete}
                />
              </Card>
              <Card bordered padding="md">
                <MedicationWidget
                  medications={medications}
                  isEditing={isEditing}
                  onAddMedication={handleAddMedication}
                />
              </Card>
              <Card bordered padding="md">
                <VisitNotesWidget notes={notes} isEditing={isEditing} onAddNote={handleAddNote} />
              </Card>

              {isEditing && (
                <Card bordered padding="md" className="space-y-4">
                  <CardTitle size="sm">Complete Visit</CardTitle>
                  <Textarea
                    label="Completion Notes"
                    required
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    rows={4}
                    placeholder="Summary of the visit, any observations, or incidents..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCompleteVisit}>Complete Visit</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}

          {!isInProgress && !isCompleted && !isClosed && (
            <Card bordered padding="md" className="border-l-4 border-l-info text-center">
              <p className="text-sm text-foreground">
                Click &quot;Start Visit&quot; to begin recording visit details.
              </p>
            </Card>
          )}

          {isCompleted && notes.length > 0 && (
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Completed Notes</CardTitle>
              </CardHeader>
              <VisitNotesWidget notes={notes} isEditing={false} onAddNote={async () => {}} />
            </Card>
          )}
        </div>
      </div>

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
            description="Photos, attachments and other files for this visit will appear here."
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
                    <span className="font-medium capitalize">{log.action.replace(/_/g, " ")}</span>{" "}
                    by{" "}
                    {log.users
                      ? `${log.users.first_name} ${log.users.last_name}`.trim() || log.users.email
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

      <ConfirmDialog
        isOpen={confirmCancel}
        title="Cancel visit"
        message="This visit will be marked as cancelled. This can't be undone from here, but the visit stays in history."
        confirmLabel="Cancel Visit"
        cancelLabel="Keep Visit"
        variant="danger"
        onConfirm={handleCancelVisit}
        onCancel={() => setConfirmCancel(false)}
        isLoading={statusActionLoading}
      />

      <ConfirmDialog
        isOpen={confirmNoShow}
        title="Mark as no-show"
        message="This visit will be marked as a no-show. This can't be undone from here, but the visit stays in history."
        confirmLabel="Mark No Show"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleNoShow}
        onCancel={() => setConfirmNoShow(false)}
        isLoading={statusActionLoading}
      />
    </div>
  );
}
