"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, X, Archive, RotateCcw, Clock3, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Assignment } from "@/types/assignment";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AssignmentForm } from "@/components/admin/AssignmentForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { UpdateAssignmentPayload } from "@/types/assignment";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface AuditLogEntry {
  id: string;
  action: string;
  created_at: string;
  users: { first_name: string; last_name: string; email: string } | null;
}

interface RelatedAssignment {
  id: string;
  assigned_from: string;
  assigned_until: string | null;
  is_primary: boolean;
  employee?: { first_name: string; last_name: string };
  client?: { first_name: string; last_name: string };
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function assignmentStatus(a: Assignment): "active" | "inactive" | "archived" | "pending" {
  if (a.is_deleted) return "archived";
  const today = new Date().toISOString().split("T")[0];
  if (a.assigned_from > today) return "pending";
  if (a.assigned_until && a.assigned_until < today) return "inactive";
  return "active";
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [clientHistory, setClientHistory] = useState<RelatedAssignment[]>([]);
  const [employeeHistory, setEmployeeHistory] = useState<RelatedAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [isEditing, setIsEditing] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("edit") === "true"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const fetchAssignment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (!response.ok) throw new Error("Failed to fetch assignment");
      const data: Assignment = await response.json();
      setAssignment(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignment");
      return null;
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchAssignment().then((data) => {
        if (!data) return;

        const fetchHistory = async () => {
          try {
            setLoadingHistory(true);
            const [clientRes, employeeRes] = await Promise.all([
              fetch(`/api/assignments/client/${data.client_id}`),
              fetch(`/api/assignments/employee/${data.employee_id}`),
            ]);
            const clientRows: RelatedAssignment[] = clientRes.ok ? await clientRes.json() : [];
            const employeeRows: RelatedAssignment[] = employeeRes.ok
              ? await employeeRes.json()
              : [];
            setClientHistory(clientRows.filter((r) => r.id !== assignmentId));
            setEmployeeHistory(employeeRows.filter((r) => r.id !== assignmentId));
          } finally {
            setLoadingHistory(false);
          }
        };
        fetchHistory();
      });
    });

    const fetchAuditLogs = async () => {
      try {
        setLoadingAudit(true);
        const response = await fetch(
          `/api/audit-logs?entityType=assignments&entityId=${assignmentId}&limit=20`
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
  }, [assignmentId, fetchAssignment]);

  const handleUpdateSubmit = async (data: UpdateAssignmentPayload) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update assignment");

      setAssignment(result);
      setIsEditing(false);
      addToast({ type: "success", message: "Assignment updated" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update assignment";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to archive assignment");
      await fetchAssignment();
      addToast({ type: "success", message: "Assignment archived" });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to archive assignment",
      });
    } finally {
      setStatusActionLoading(false);
      setConfirmArchive(false);
    }
  };

  const handleActivate = async () => {
    try {
      setStatusActionLoading(true);
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_deleted: false }),
      });
      if (!response.ok) throw new Error("Failed to activate assignment");
      setAssignment(await response.json());
      addToast({ type: "success", message: "Assignment is active again" });
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to activate assignment",
      });
    } finally {
      setStatusActionLoading(false);
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

  if (!assignment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignment Not Found" />
        <Card bordered padding="lg" className="text-center">
          <p className="mb-4 text-muted-foreground">
            The assignment you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/assignments")}>Back to Assignments</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {assignment.employee?.first_name} {assignment.employee?.last_name} →{" "}
              {assignment.client?.first_name} {assignment.client?.last_name}
            </h1>
            <StatusBadge status={assignmentStatus(assignment)} size="sm" />
            {assignment.is_primary && (
              <Badge variant="primary" size="sm">
                Primary
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(assignment.assigned_from).toLocaleDateString("nl-NL")} –{" "}
            {assignment.assigned_until
              ? new Date(assignment.assigned_until).toLocaleDateString("nl-NL")
              : "Ongoing"}
          </p>
        </div>
        {!isEditing && (
          <div className="flex shrink-0 gap-2">
            {assignment.is_deleted ? (
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
            <CardTitle size="sm">Edit Assignment</CardTitle>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cancel editing"
            >
              <X className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
            </button>
          </CardHeader>
          <AssignmentForm
            assignment={assignment}
            isLoading={isSaving}
            onSubmit={handleUpdateSubmit}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Employee</CardTitle>
              </CardHeader>
              <dl className="divide-y divide-border">
                <DetailRow
                  label="Name"
                  value={
                    <Link
                      href={`/admin/employees/${assignment.employee_id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {assignment.employee?.first_name} {assignment.employee?.last_name}
                    </Link>
                  }
                />
                <DetailRow
                  label="Status"
                  value={assignment.employee?.is_active ? "Active" : "Inactive"}
                />
              </dl>
            </Card>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Client</CardTitle>
              </CardHeader>
              <dl className="divide-y divide-border">
                <DetailRow
                  label="Name"
                  value={
                    <Link
                      href={`/admin/clients/${assignment.client_id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {assignment.client?.first_name} {assignment.client?.last_name}
                    </Link>
                  }
                />
                <DetailRow
                  label="Status"
                  value={assignment.client?.is_active ? "Active" : "Inactive"}
                />
              </dl>
            </Card>
          </div>

          <Card bordered padding="md">
            <CardHeader>
              <CardTitle size="sm">Assignment Details</CardTitle>
            </CardHeader>
            <dl className="divide-y divide-border">
              <DetailRow label="Branch" value={assignment.branch?.name || "—"} />
              <DetailRow
                label="Start Date"
                value={new Date(assignment.assigned_from).toLocaleDateString("nl-NL")}
              />
              <DetailRow
                label="End Date"
                value={
                  assignment.assigned_until
                    ? new Date(assignment.assigned_until).toLocaleDateString("nl-NL")
                    : "Ongoing"
                }
              />
              <DetailRow label="Primary Assignment" value={assignment.is_primary ? "Yes" : "No"} />
            </dl>
          </Card>

          {assignment.notes && (
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Notes</CardTitle>
              </CardHeader>
              <p className="text-sm text-muted-foreground">{assignment.notes}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Client Timeline</CardTitle>
              </CardHeader>
              {loadingHistory ? (
                <Skeleton className="h-16 w-full" />
              ) : clientHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No other assignments for this client.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {clientHistory.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {h.employee ? `${h.employee.first_name} ${h.employee.last_name}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.assigned_from).toLocaleDateString("nl-NL")} –{" "}
                          {h.assigned_until
                            ? new Date(h.assigned_until).toLocaleDateString("nl-NL")
                            : "Ongoing"}
                        </p>
                      </div>
                      <Link
                        href={`/admin/assignments/${h.id}`}
                        className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Open
                        <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card bordered padding="md">
              <CardHeader>
                <CardTitle size="sm">Employee Timeline</CardTitle>
              </CardHeader>
              {loadingHistory ? (
                <Skeleton className="h-16 w-full" />
              ) : employeeHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No other assignments for this employee.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {employeeHistory.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {h.client ? `${h.client.first_name} ${h.client.last_name}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.assigned_from).toLocaleDateString("nl-NL")} –{" "}
                          {h.assigned_until
                            ? new Date(h.assigned_until).toLocaleDateString("nl-NL")
                            : "Ongoing"}
                        </p>
                      </div>
                      <Link
                        href={`/admin/assignments/${h.id}`}
                        className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Open
                        <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card bordered padding="md">
            <CardHeader>
              <CardTitle size="sm">Assignment History</CardTitle>
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

          <Card bordered padding="md">
            <CardHeader>
              <CardTitle size="sm">System Information</CardTitle>
            </CardHeader>
            <dl className="divide-y divide-border">
              <DetailRow
                label="Created"
                value={new Date(assignment.created_at).toLocaleString("nl-NL")}
              />
              <DetailRow
                label="Last Updated"
                value={new Date(assignment.updated_at).toLocaleString("nl-NL")}
              />
              {assignment.deleted_at && (
                <DetailRow
                  label="Archived"
                  value={new Date(assignment.deleted_at).toLocaleString("nl-NL")}
                />
              )}
            </dl>
          </Card>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmArchive}
        title="Archive assignment"
        message="This assignment will be moved out of active selectors but stays linked to the client's and employee's history. You can reactivate it at any time."
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
