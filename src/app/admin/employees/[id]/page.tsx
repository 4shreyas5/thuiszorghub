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
  Upload,
  Download,
  Trash2,
  FileText,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Employee } from "@/types/employee";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InitialsAvatar } from "@/components/ui/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { UpdateEmployeePayload } from "@/types/employee";
import { Assignment } from "@/types/assignment";
import { Visit } from "@/types/visit";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  users: { first_name: string; last_name: string; email: string } | null;
}

interface DocumentEntry {
  id: string;
  file_name: string;
  document_type: string;
  verification_status: string;
  uploaded_at: string;
  file_size: number;
}

const DOCUMENT_TYPES = [
  { value: "employment_contract", label: "Employment contract" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "driving_licence", label: "Driving licence" },
  { value: "certificates", label: "Certificates" },
  { value: "training_certificates", label: "Training certificates" },
  { value: "background_check", label: "Background check" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

function employeeCode(id: string): string {
  return `EMP-${id.slice(0, 8).toUpperCase()}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [isEditing, setIsEditing] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("edit") === "true"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState("");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) throw new Error("Failed to fetch employee");
      const data = await response.json();
      setEmployee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch(
        `/api/documents?entityType=employee&entityId=${employeeId}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoadingDocuments(false);
    }
  }, [employeeId]);

  useEffect(() => {
    // Deferred to a microtask so these fetch triggers aren't synchronous setState calls in the effect body.
    queueMicrotask(() => {
      fetchEmployee();

      const fetchAssignments = async () => {
        try {
          setLoadingAssignments(true);
          const response = await fetch(`/api/assignments/employee/${employeeId}`);
          if (response.ok) setAssignments((await response.json()) || []);
        } catch (err) {
          console.error("Error fetching assignments:", err);
        } finally {
          setLoadingAssignments(false);
        }
      };

      const fetchVisits = async () => {
        try {
          setLoadingVisits(true);
          const response = await fetch(`/api/visits/employee/${employeeId}?filter=upcoming`);
          if (response.ok) setVisits((await response.json()) || []);
        } catch (err) {
          console.error("Error fetching visits:", err);
        } finally {
          setLoadingVisits(false);
        }
      };

      const fetchAuditLogs = async () => {
        try {
          setLoadingAudit(true);
          const response = await fetch(
            `/api/audit-logs?entityType=employees&entityId=${employeeId}&limit=20`
          );
          if (response.ok) {
            const data = await response.json();
            setAuditLogs(data.data || []);
          }
        } catch (err) {
          console.error("Error fetching audit history:", err);
        } finally {
          setLoadingAudit(false);
        }
      };

      fetchAssignments();
      fetchVisits();
      fetchAuditLogs();
      fetchDocuments();
    });
  }, [employeeId, fetchEmployee, fetchDocuments]);

  const handleUpdateSubmit = async (data: UpdateEmployeePayload) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update employee");

      setEmployee(result);
      setIsEditing(false);
      addToast({ type: "success", message: "Employee updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update employee";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to archive employee");
      const result = await response.json();
      setEmployee(result);
      addToast({ type: "success", message: `${result.first_name} has been archived` });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to archive employee",
      });
    } finally {
      setStatusActionLoading(false);
      setConfirmArchive(false);
    }
  };

  const handleActivate = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!response.ok) throw new Error("Failed to activate employee");
      const result = await response.json();
      setEmployee(result);
      addToast({ type: "success", message: `${result.first_name} is active again` });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to activate employee",
      });
    } finally {
      setStatusActionLoading(false);
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
      formData.append("entityType", "employee");
      formData.append("entityId", employeeId);
      formData.append("documentType", uploadDocumentType);
      if (uploadExpiryDate) formData.append("expiryDate", uploadExpiryDate);

      const response = await fetch("/api/documents", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");

      addToast({ type: "success", message: "Document uploaded" });
      setUploadFile(null);
      setUploadDocumentType("");
      setUploadExpiryDate("");
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
              <Skeleton className="mt-2 h-4 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Not Found" />
        <Card bordered padding="lg" className="text-center">
          <p className="mb-4 text-muted-foreground">
            The employee you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/employees")}>Back to Employees</Button>
        </Card>
      </div>
    );
  }

  const name = `${employee.first_name} ${employee.last_name}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <InitialsAvatar name={name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{name}</h1>
              <StatusBadge
                status={employee.status}
                label={employee.status?.replace("_", " ")}
                className="capitalize"
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {employee.email} · {employeeCode(employee.id)}
            </p>
          </div>
        </div>
        {!isEditing && (
          <div className="flex shrink-0 gap-2">
            {employee.status === "archived" ? (
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
            <CardTitle size="sm">Edit Employee</CardTitle>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cancel editing"
            >
              <X className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
            </button>
          </CardHeader>
          <EmployeeForm employee={employee} isLoading={isSaving} onSubmit={handleUpdateSubmit} />
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="care">Assignments &amp; Visits</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Contact</CardTitle>
                </CardHeader>
                <dl className="divide-y divide-border">
                  <DetailRow label="Email" value={employee.email} />
                  <DetailRow label="Phone" value={employee.phone || "—"} />
                </dl>
              </Card>

              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Employment</CardTitle>
                </CardHeader>
                <dl className="divide-y divide-border">
                  <DetailRow label="Branch" value={employee.branch?.name || "—"} />
                  <DetailRow
                    label="Employment Type"
                    value={<span className="capitalize">{employee.employment_type}</span>}
                  />
                  <DetailRow
                    label="Start Date"
                    value={new Date(employee.start_date).toLocaleDateString("nl-NL")}
                  />
                  <DetailRow
                    label="End Date"
                    value={
                      employee.end_date
                        ? new Date(employee.end_date).toLocaleDateString("nl-NL")
                        : "Ongoing"
                    }
                  />
                  {employee.hourly_rate != null && (
                    <DetailRow
                      label="Hourly Rate"
                      value={`€${employee.hourly_rate.toFixed(2)}/hour`}
                    />
                  )}
                </dl>
              </Card>

              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Emergency Contact</CardTitle>
                </CardHeader>
                {employee.emergency_contact_name || employee.emergency_contact_phone ? (
                  <dl className="divide-y divide-border">
                    <DetailRow label="Name" value={employee.emergency_contact_name || "—"} />
                    <DetailRow label="Phone" value={employee.emergency_contact_phone || "—"} />
                    <DetailRow
                      label="Relationship"
                      value={employee.emergency_contact_relationship || "—"}
                    />
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No emergency contact on file.</p>
                )}
              </Card>

              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Notes</CardTitle>
                </CardHeader>
                <p className="text-sm text-muted-foreground">
                  {employee.bio || "No notes on file."}
                </p>
              </Card>
            </div>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">System Information</CardTitle>
              </CardHeader>
              <dl className="divide-y divide-border">
                <DetailRow
                  label="Created"
                  value={new Date(employee.created_at).toLocaleString("nl-NL")}
                />
                <DetailRow
                  label="Last Updated"
                  value={new Date(employee.updated_at).toLocaleString("nl-NL")}
                />
                {employee.deleted_at && (
                  <DetailRow
                    label="Archived"
                    value={new Date(employee.deleted_at).toLocaleString("nl-NL")}
                  />
                )}
              </dl>
            </Card>
          </TabsContent>

          <TabsContent value="care" className="space-y-6">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Assigned Clients</CardTitle>
              </CardHeader>
              {loadingAssignments ? (
                <Skeleton className="h-20 w-full" />
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients assigned yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/admin/clients/${assignment.client_id}`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {assignment.client?.first_name} {assignment.client?.last_name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(assignment.assigned_from).toLocaleDateString("nl-NL")}
                          {assignment.assigned_until
                            ? ` – ${new Date(assignment.assigned_until).toLocaleDateString("nl-NL")}`
                            : " – Ongoing"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {assignment.is_primary && (
                          <span className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
                            Primary
                          </span>
                        )}
                        <Link
                          href={`/admin/clients/${assignment.client_id}`}
                          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                        >
                          Open
                          <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Upcoming Visits</CardTitle>
              </CardHeader>
              {loadingVisits ? (
                <Skeleton className="h-20 w-full" />
              ) : visits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming visits scheduled.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {visits.map((visit) => (
                    <li key={visit.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/clients/${visit.client_id}`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {visit.client?.first_name} {visit.client?.last_name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(visit.scheduled_date).toLocaleDateString("nl-NL")} ·{" "}
                          {visit.start_time} - {visit.end_time}
                        </p>
                      </div>
                      <Link
                        href={`/admin/visits/${visit.id}`}
                        className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                      >
                        View
                        <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Upload Document</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select
                  label="Document Type"
                  placeholder="Select document type..."
                  value={uploadDocumentType}
                  onChange={(e) => setUploadDocumentType(e.target.value)}
                  options={DOCUMENT_TYPES}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  helperText="Optional"
                  value={uploadExpiryDate}
                  onChange={(e) => setUploadExpiryDate(e.target.value)}
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
                <Skeleton className="h-10 w-full" />
              </Card>
            ) : documents.length === 0 ? (
              <Card bordered padding="md">
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Uploaded documents for this employee will appear here."
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
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
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

      <ConfirmDialog
        isOpen={confirmArchive}
        title="Archive employee"
        message={`${name} will be moved out of active selectors but remains searchable and stays linked to their visit and assignment history. You can reactivate them at any time.`}
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
