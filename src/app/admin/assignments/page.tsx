"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Link2,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { useDebounce } from "@/hooks/useDebounce";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type AssignmentRow = {
  id: string;
  employee_id: string;
  client_id: string;
  assigned_from: string;
  assigned_until: string | null;
  is_primary: boolean;
  is_deleted: boolean;
  employee?: { first_name: string; last_name: string };
  client?: { first_name: string; last_name: string };
  branch?: { id: string; name: string };
};

interface Option {
  id: string;
  first_name: string;
  last_name: string;
}

interface Branch {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Ended" },
  { value: "archived", label: "Archived" },
];

function assignmentStatus(row: AssignmentRow): "active" | "inactive" | "archived" | "pending" {
  if (row.is_deleted) return "archived";
  const today = new Date().toISOString().split("T")[0];
  if (row.assigned_from > today) return "pending";
  if (row.assigned_until && row.assigned_until < today) return "inactive";
  return "active";
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [sortBy, setSortBy] = useState("assigned_from");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  const fetchAssignments = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setLoadError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search: debouncedSearch,
          status,
          branch,
          employeeId,
          clientId,
          sortBy,
          sortOrder,
        });

        const response = await fetch(`/api/assignments?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch assignments");

        setAssignments(data.assignments);
        setPagination(data.pagination);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load assignments");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, debouncedSearch, status, branch, employeeId, clientId, sortBy, sortOrder]
  );

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchAssignments(1);
    });
  }, [debouncedSearch, status, branch, employeeId, clientId, sortBy, sortOrder, fetchAssignments]);

  useEffect(() => {
    queueMicrotask(() => {
      if (pagination.page > 1) {
        fetchAssignments(pagination.page);
      }
    });
  }, [pagination.page, fetchAssignments]);

  useEffect(() => {
    fetch("/api/branches?page=1&limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.data && setBranches(d.data))
      .catch(() => {});
    fetch("/api/employees?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.employees && setEmployees(d.employees))
      .catch(() => {});
    fetch("/api/clients?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.clients && setClients(d.clients))
      .catch(() => {});
  }, []);

  const setStatusFor = async (row: AssignmentRow, action: "archive" | "activate") => {
    try {
      const response =
        action === "archive"
          ? await fetch(`/api/assignments/${row.id}`, { method: "DELETE" })
          : await fetch(`/api/assignments/${row.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_deleted: false }),
            });
      if (!response.ok) throw new Error("Failed to update assignment");
      await fetchAssignments(pagination.page);
    } catch (error) {
      console.error("Error updating assignment status:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const hasFilters = !!(search || status !== "all" || branch || employeeId || clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Which caregivers are assigned to which clients."
        action={{ label: "New Assignment", href: "/admin/assignments/new" }}
      />

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by employee or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
            />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
          <Select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            options={[
              { value: "", label: "All branches" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={[
              { value: "", label: "All employees" },
              ...employees.map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` })),
            ]}
          />
        </div>
        <div className="flex justify-end gap-3">
          <div className="w-56">
            <Select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              options={[
                { value: "", label: "All clients" },
                ...clients.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })),
              ]}
            />
          </div>
          <div className="w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: "assigned_from", label: "Sort: Start Date" },
                { value: "assigned_until", label: "Sort: End Date" },
                { value: "is_primary", label: "Sort: Primary" },
              ]}
            />
          </div>
          <div className="w-36">
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              options={[
                { value: "asc", label: "Ascending" },
                { value: "desc", label: "Descending" },
              ]}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card bordered padding="md" className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : loadError ? (
        <Card bordered padding="md">
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Couldn't load assignments"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchAssignments(pagination.page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : assignments.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={hasFilters ? Search : Link2}
            title={hasFilters ? "No matching assignments" : "No assignments yet"}
            description={
              hasFilters
                ? "Try a different search term or clearing a filter."
                : "Assign a caregiver to a client to start coordinating their care."
            }
            action={
              !hasFilters && (
                <Button asChild>
                  <Link href="/admin/assignments/new">New Assignment</Link>
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Branch</TableHeaderCell>
                <TableHeaderCell>Primary</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Start Date</TableHeaderCell>
                <TableHeaderCell>End Date</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/admin/employees/${row.employee_id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/clients/${row.client_id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {row.client ? `${row.client.first_name} ${row.client.last_name}` : "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.branch?.name || "—"}</TableCell>
                  <TableCell>
                    {row.is_primary ? (
                      <Badge variant="primary" size="sm">
                        Primary
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={assignmentStatus(row)} size="sm" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(row.assigned_from).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.assigned_until
                      ? new Date(row.assigned_until).toLocaleDateString("nl-NL")
                      : "Ongoing"}
                  </TableCell>
                  <TableCell align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="Actions"
                        >
                          <MoreHorizontal
                            className={ICON_SIZE.sm}
                            strokeWidth={ICON_STROKE_WIDTH}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => router.push(`/admin/assignments/${row.id}`)}
                        >
                          <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => router.push(`/admin/assignments/${row.id}?edit=true`)}
                        >
                          <Pencil className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          Edit
                        </DropdownMenuItem>
                        {row.is_deleted ? (
                          <DropdownMenuItem onSelect={() => setStatusFor(row, "activate")}>
                            <RotateCcw className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            Activate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setStatusFor(row, "archive")}>
                            <Archive className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pagination.total} assignment{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination
                page={pagination.page}
                pageCount={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
