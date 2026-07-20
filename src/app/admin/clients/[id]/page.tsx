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
  Eye,
  Trash2,
  FileText,
  Clock3,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Client } from "@/types/client";
import { CarePlan, CarePlanReview } from "@/types/care-plan";
import { StatusBadge, Badge } from "@/components/ui/Badge";
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
import { ClientForm } from "@/components/admin/ClientForm";
import { UpdateClientPayload } from "@/types/client";
import { Assignment } from "@/types/assignment";
import { Visit } from "@/types/visit";
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

interface BillingSummary {
  outstanding_amount: number;
  overdue_amount: number;
  paid_amount: number;
}

interface ClientInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  remaining_balance: number;
  status: string;
  invoice_date: string;
}

const DOCUMENT_TYPES = [
  { value: "referral", label: "Referral" },
  { value: "consent_forms", label: "Consent forms" },
  { value: "insurance_card", label: "Insurance card" },
  { value: "medical_documents", label: "Medical documents" },
  { value: "care_plan_pdf", label: "Care plan PDF" },
  { value: "assessment", label: "Assessment" },
  { value: "identification", label: "Identification" },
  { value: "other", label: "Other" },
];

function clientCode(id: string): string {
  return `CLI-${id.slice(0, 8).toUpperCase()}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<
    (CarePlanReview & { carePlanTitle: string })[]
  >([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [loadingCarePlans, setLoadingCarePlans] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingBilling, setLoadingBilling] = useState(true);

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

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client");
      setClient(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch(
        `/api/documents?entityType=client&entityId=${clientId}&limit=50`
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
  }, [clientId]);

  const fetchCarePlansAndReviews = useCallback(async () => {
    try {
      setLoadingCarePlans(true);
      const response = await fetch(`/api/care-plans?client_id=${clientId}&limit=50`);
      if (!response.ok) return;
      const data = await response.json();
      const plans: CarePlan[] = data.care_plans || [];
      setCarePlans(plans);

      // No aggregate "reviews for this client" endpoint exists - reviews
      // are nested per care plan. A client realistically has 1-3 care
      // plans, so this bounded fan-out avoids adding new backend surface.
      const reviewLists = await Promise.all(
        plans.map((plan) =>
          fetch(`/api/care-plans/${plan.id}/reviews`)
            .then((res) => (res.ok ? res.json() : []))
            .then((reviews: CarePlanReview[]) =>
              reviews.map((r) => ({ ...r, carePlanTitle: plan.title }))
            )
            .catch(() => [])
        )
      );
      const upcoming = reviewLists
        .flat()
        .filter((r) => r.status === "scheduled")
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
      setUpcomingReviews(upcoming);
    } catch (err) {
      console.error("Error fetching care plans:", err);
    } finally {
      setLoadingCarePlans(false);
    }
  }, [clientId]);

  useEffect(() => {
    // Deferred to a microtask so these fetch triggers aren't synchronous setState calls in the effect body.
    queueMicrotask(() => {
      fetchClient();

      const fetchAssignments = async () => {
        try {
          setLoadingAssignments(true);
          const response = await fetch(`/api/assignments/client/${clientId}`);
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
          const response = await fetch(`/api/visits/client/${clientId}?filter=all`);
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
            `/api/audit-logs?entityType=clients&entityId=${clientId}&limit=20`
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

      const fetchBilling = async () => {
        try {
          setLoadingBilling(true);
          const [summaryRes, invoicesRes] = await Promise.all([
            fetch(`/api/billing/summary?clientId=${clientId}&period=year`),
            fetch(`/api/billing/invoices?clientId=${clientId}&limit=10`),
          ]);
          if (summaryRes.ok) {
            const data = await summaryRes.json();
            setBillingSummary({
              outstanding_amount: data.summary.outstanding_amount,
              overdue_amount: data.summary.overdue_amount,
              paid_amount: data.summary.paid_amount,
            });
          }
          if (invoicesRes.ok) {
            const data = await invoicesRes.json();
            setClientInvoices(data.data || []);
          }
        } catch (err) {
          console.error("Error fetching billing summary:", err);
        } finally {
          setLoadingBilling(false);
        }
      };

      fetchAssignments();
      fetchVisits();
      fetchCarePlansAndReviews();
      fetchAuditLogs();
      fetchDocuments();
      fetchBilling();
    });
  }, [clientId, fetchClient, fetchCarePlansAndReviews, fetchDocuments]);

  const handleUpdateSubmit = async (data: UpdateClientPayload) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update client");

      setClient(result);
      setIsEditing(false);
      addToast({ type: "success", message: "Client updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update client";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to archive client");
      const result = await response.json();
      setClient(result);
      addToast({ type: "success", message: `${result.first_name} has been archived` });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to archive client",
      });
    } finally {
      setStatusActionLoading(false);
      setConfirmArchive(false);
    }
  };

  const handleActivate = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!response.ok) throw new Error("Failed to activate client");
      const result = await response.json();
      setClient(result);
      addToast({ type: "success", message: `${result.first_name} is active again` });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to activate client",
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
      formData.append("entityType", "client");
      formData.append("entityId", clientId);
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

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client Not Found" />
        <Card bordered padding="lg" className="text-center">
          <p className="mb-4 text-muted-foreground">
            The client you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/clients")}>Back to Clients</Button>
        </Card>
      </div>
    );
  }

  const name = `${client.first_name} ${client.last_name}`;
  const now = new Date();
  const upcomingVisits = visits
    .filter((v) => new Date(`${v.scheduled_date}T${v.start_time || "00:00"}`) >= now)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  const pastVisits = visits
    .filter((v) => new Date(`${v.scheduled_date}T${v.start_time || "00:00"}`) < now)
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
  const lastVisit = pastVisits[0];
  const activeCarePlans = carePlans.filter(
    (p) => p.status === "active" || p.status === "draft" || p.status === "on_hold"
  );
  const completedCarePlans = carePlans.filter(
    (p) => p.status === "completed" || p.status === "archived"
  );
  const primaryAddress = client.addresses?.find((a) => a.is_primary) || client.addresses?.[0];
  const primaryInsurance = client.insurance?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <InitialsAvatar name={name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{name}</h1>
              <StatusBadge status={client.status} label={client.status} className="capitalize" />
              {client.risk_level === "high" && (
                <Badge variant="danger" size="sm" className="capitalize">
                  high risk
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {client.email || "No email"} · {clientCode(client.id)}
            </p>
          </div>
        </div>
        {!isEditing && (
          <div className="flex shrink-0 gap-2">
            {client.status === "archived" ? (
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
            <CardTitle size="sm">Edit Client</CardTitle>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cancel editing"
            >
              <X className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
            </button>
          </CardHeader>
          <ClientForm client={client} isLoading={isSaving} onSubmit={handleUpdateSubmit} />
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clinical">Clinical</TabsTrigger>
            <TabsTrigger value="care">Care</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Personal Information</CardTitle>
                </CardHeader>
                <dl className="divide-y divide-border">
                  <DetailRow
                    label="Date of Birth"
                    value={
                      client.date_of_birth
                        ? new Date(client.date_of_birth).toLocaleDateString("nl-NL")
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Case Status"
                    value={<span className="capitalize">{client.case_status}</span>}
                  />
                </dl>
              </Card>

              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Contact</CardTitle>
                </CardHeader>
                <dl className="divide-y divide-border">
                  <DetailRow label="Email" value={client.email || "—"} />
                  <DetailRow label="Phone" value={client.phone || "—"} />
                </dl>
              </Card>

              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Address</CardTitle>
                </CardHeader>
                {primaryAddress ? (
                  <p className="text-sm text-foreground">
                    {primaryAddress.address_line_1}
                    {primaryAddress.address_line_2 ? `, ${primaryAddress.address_line_2}` : ""}
                    <br />
                    {primaryAddress.postal_code} {primaryAddress.city}
                    <br />
                    {primaryAddress.country}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No address on file.</p>
                )}
              </Card>

              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Emergency Contact</CardTitle>
                </CardHeader>
                {client.emergency_contact_name || client.emergency_contact_phone ? (
                  <dl className="divide-y divide-border">
                    <DetailRow label="Name" value={client.emergency_contact_name || "—"} />
                    <DetailRow label="Phone" value={client.emergency_contact_phone || "—"} />
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No emergency contact on file.</p>
                )}
              </Card>
            </div>

            {primaryInsurance && (
              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Insurance</CardTitle>
                </CardHeader>
                <dl className="divide-y divide-border">
                  <DetailRow label="Provider" value={primaryInsurance.insurance_provider || "—"} />
                  <DetailRow label="Policy Number" value={primaryInsurance.policy_number || "—"} />
                </dl>
              </Card>
            )}

            {client.notes && (
              <Card bordered padding="md">
                <CardHeader>
                  <CardTitle size="sm">Notes</CardTitle>
                </CardHeader>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </Card>
            )}

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">System Information</CardTitle>
              </CardHeader>
              <dl className="divide-y divide-border">
                <DetailRow
                  label="Created"
                  value={new Date(client.created_at).toLocaleString("nl-NL")}
                />
                <DetailRow
                  label="Last Updated"
                  value={new Date(client.updated_at).toLocaleString("nl-NL")}
                />
                {client.deleted_at && (
                  <DetailRow
                    label="Archived"
                    value={new Date(client.deleted_at).toLocaleString("nl-NL")}
                  />
                )}
              </dl>
            </Card>
          </TabsContent>

          <TabsContent value="clinical" className="space-y-6">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Risk Level</CardTitle>
              </CardHeader>
              {client.risk_level ? (
                <Badge
                  variant={
                    client.risk_level === "high"
                      ? "danger"
                      : client.risk_level === "medium"
                        ? "warning"
                        : "success"
                  }
                  className="capitalize"
                >
                  {client.risk_level}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">Not assessed.</p>
              )}
            </Card>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Medical Information</CardTitle>
              </CardHeader>
              {client.medical_info ? (
                <dl className="divide-y divide-border">
                  <DetailRow label="Blood Type" value={client.medical_info.blood_type || "—"} />
                  <DetailRow label="Mobility" value={client.medical_info.mobility_status || "—"} />
                  <DetailRow
                    label="Cognitive Status"
                    value={client.medical_info.cognitive_status || "—"}
                  />
                  <DetailRow label="Hearing" value={client.medical_info.hearing_status || "—"} />
                  <DetailRow label="Vision" value={client.medical_info.vision_status || "—"} />
                  {client.medical_info.special_needs && (
                    <div className="py-2.5">
                      <dt className="mb-1 text-sm text-muted-foreground">Special Needs</dt>
                      <dd className="text-sm text-foreground">
                        {client.medical_info.special_needs}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No medical information on file.</p>
              )}
            </Card>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Allergies</CardTitle>
              </CardHeader>
              {client.allergies && client.allergies.length > 0 ? (
                <ul className="divide-y divide-border">
                  {client.allergies.map((allergy) => (
                    <li key={allergy.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{allergy.allergen}</p>
                        {allergy.reaction && (
                          <p className="text-xs text-muted-foreground">{allergy.reaction}</p>
                        )}
                      </div>
                      {allergy.severity && (
                        <Badge
                          variant={allergy.severity === "severe" ? "danger" : "warning"}
                          size="sm"
                          className="capitalize"
                        >
                          {allergy.severity}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No known allergies on file.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="care" className="space-y-6">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Assigned Employees</CardTitle>
              </CardHeader>
              {loadingAssignments ? (
                <Skeleton className="h-20 w-full" />
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employees assigned yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/admin/employees/${assignment.employee_id}`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {assignment.employee?.first_name} {assignment.employee?.last_name}
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
                          href={`/admin/employees/${assignment.employee_id}`}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle size="sm">Care Plans</CardTitle>
                <Link
                  href="/admin/care-plans/new"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Create Plan
                </Link>
              </CardHeader>
              {loadingCarePlans ? (
                <Skeleton className="h-20 w-full" />
              ) : carePlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No care plans yet.</p>
              ) : (
                <div className="space-y-4">
                  {activeCarePlans.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Active
                      </p>
                      <ul className="divide-y divide-border">
                        {activeCarePlans.map((plan) => (
                          <li
                            key={plan.id}
                            className="flex items-center justify-between gap-3 py-2.5"
                          >
                            <Link
                              href={`/admin/care-plans/${plan.id}`}
                              className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {plan.title}
                            </Link>
                            <StatusBadge status={plan.status} size="sm" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {completedCarePlans.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Completed
                      </p>
                      <ul className="divide-y divide-border">
                        {completedCarePlans.map((plan) => (
                          <li
                            key={plan.id}
                            className="flex items-center justify-between gap-3 py-2.5"
                          >
                            <Link
                              href={`/admin/care-plans/${plan.id}`}
                              className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {plan.title}
                            </Link>
                            <StatusBadge status={plan.status} size="sm" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Upcoming Reviews</CardTitle>
              </CardHeader>
              {loadingCarePlans ? (
                <Skeleton className="h-16 w-full" />
              ) : upcomingReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews scheduled.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {upcomingReviews.map((review) => (
                    <li key={review.id} className="flex items-center gap-3 py-2.5">
                      <CalendarClock
                        className={`${ICON_SIZE.sm} shrink-0 text-muted-foreground`}
                        strokeWidth={ICON_STROKE_WIDTH}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {review.carePlanTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.scheduled_date).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Visits</CardTitle>
              </CardHeader>
              {loadingVisits ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-muted-foreground">
                      Total visits{" "}
                      <span className="font-semibold text-foreground">{visits.length}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Last visit{" "}
                      <span className="font-semibold text-foreground">
                        {lastVisit
                          ? new Date(lastVisit.scheduled_date).toLocaleDateString("nl-NL")
                          : "—"}
                      </span>
                    </span>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Upcoming
                    </p>
                    {upcomingVisits.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming visits scheduled.</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {upcomingVisits.map((visit) => (
                          <VisitRow key={visit.id} visit={visit} />
                        ))}
                      </ul>
                    )}
                  </div>

                  {pastVisits.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Previous
                      </p>
                      <ul className="divide-y divide-border">
                        {pastVisits.slice(0, 10).map((visit) => (
                          <VisitRow key={visit.id} visit={visit} />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Card bordered padding="md">
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="mt-2 text-2xl font-bold text-info">
                  {loadingBilling ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    `€${Number(billingSummary?.outstanding_amount || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`
                  )}
                </p>
              </Card>
              <Card bordered padding="md">
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="mt-2 text-2xl font-bold text-danger">
                  {loadingBilling ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    `€${Number(billingSummary?.overdue_amount || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`
                  )}
                </p>
              </Card>
              <Card bordered padding="md">
                <p className="text-sm font-medium text-muted-foreground">Paid (this year)</p>
                <p className="mt-2 text-2xl font-bold text-success">
                  {loadingBilling ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    `€${Number(billingSummary?.paid_amount || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`
                  )}
                </p>
              </Card>
            </div>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Invoices</CardTitle>
              </CardHeader>
              {loadingBilling ? (
                <Skeleton className="h-20 w-full" />
              ) : clientInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices for this client yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {clientInvoices.map((invoice) => (
                    <li key={invoice.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/billing/invoices/${invoice.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(invoice.invoice_date).toLocaleDateString("nl-NL")} · €
                          {Number(invoice.total_amount).toFixed(2)}
                        </p>
                      </div>
                      <StatusBadge
                        status={invoice.status}
                        label={invoice.status?.replace(/_/g, " ")}
                        size="sm"
                      />
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
                  description="Uploaded documents for this client will appear here."
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
        title="Archive client"
        message={`${name} will be moved out of active selectors but remains searchable and stays linked to their visit, assignment, and care plan history. You can reactivate them at any time.`}
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

function VisitRow({ visit }: { visit: Visit }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <Link
          href={`/admin/employees/${visit.employee_id}`}
          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
        >
          {visit.employee
            ? `${visit.employee.first_name} ${visit.employee.last_name}`
            : "Unassigned"}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(visit.scheduled_date).toLocaleDateString("nl-NL")} · {visit.start_time} -{" "}
          {visit.end_time}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={visit.status} size="sm" />
        <Link
          href={`/admin/visits/${visit.id}`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          View
          <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
        </Link>
      </div>
    </li>
  );
}
