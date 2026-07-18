"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Client } from "@/types/client";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { InitialsAvatar } from "@/components/ui/Avatar";
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

interface Branch {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const CASE_STATUS_OPTIONS = [
  { value: "", label: "All case statuses" },
  { value: "active", label: "Active Case" },
  { value: "inactive", label: "Inactive" },
  { value: "discharged", label: "Discharged" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Sort: Newest" },
  { value: "first_name", label: "Sort: First Name" },
  { value: "last_name", label: "Sort: Last Name" },
];

function clientCode(id: string): string {
  return `CLI-${id.slice(0, 8).toUpperCase()}`;
}

function assignedEmployeeLabel(client: Client): string {
  const active = client.assignments || [];
  if (active.length === 0) return "—";
  const primary = active.find((a) => a.is_primary) || active[0];
  const name = primary.employee
    ? `${primary.employee.first_name} ${primary.employee.last_name}`
    : "Unknown";
  return active.length > 1 ? `${name} +${active.length - 1}` : name;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [caseStatus, setCaseStatus] = useState("");
  const [branch, setBranch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [branches, setBranches] = useState<Branch[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  const fetchClients = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setLoadError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search: debouncedSearch,
          status,
          caseStatus,
          branch,
          sortBy,
          sortOrder,
        });

        const response = await fetch(`/api/clients?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch clients");

        setClients(data.clients);
        setPagination(data.pagination);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load clients");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, debouncedSearch, status, caseStatus, branch, sortBy, sortOrder]
  );

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchClients(1);
    });
  }, [debouncedSearch, status, caseStatus, branch, sortBy, sortOrder, fetchClients]);

  useEffect(() => {
    queueMicrotask(() => {
      if (pagination.page > 1) {
        fetchClients(pagination.page);
      }
    });
  }, [pagination.page, fetchClients]);

  useEffect(() => {
    fetch("/api/branches?page=1&limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.data) setBranches(result.data);
      })
      .catch(() => {
        /* branch filter just stays empty - not fatal to the page */
      });
  }, []);

  const setStatusFor = async (client: Client, newStatus: "active" | "archived") => {
    try {
      const response =
        newStatus === "archived"
          ? await fetch(`/api/clients/${client.id}`, { method: "DELETE" })
          : await fetch(`/api/clients/${client.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });

      if (!response.ok) throw new Error("Failed to update client status");
      await fetchClients(pagination.page);
    } catch (error) {
      console.error("Error updating client status:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const hasFilters = !!(search || status || caseStatus || branch);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage the people receiving care."
        action={{ label: "New Client", href: "/admin/clients/new" }}
      />

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by name, email, or phone..."
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
            value={caseStatus}
            onChange={(e) => setCaseStatus(e.target.value)}
            options={CASE_STATUS_OPTIONS}
          />
          <Select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            options={[
              { value: "", label: "All branches" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
        <div className="flex justify-end gap-3">
          <div className="w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={SORT_OPTIONS}
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
            title="Couldn't load clients"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchClients(pagination.page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : clients.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={hasFilters ? Search : Users}
            title={hasFilters ? "No matching clients" : "No clients yet"}
            description={
              hasFilters
                ? "Try a different search term or clearing a filter."
                : "Add your first client to start coordinating their care."
            }
            action={
              !hasFilters && (
                <Button asChild>
                  <Link href="/admin/clients/new">New Client</Link>
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
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Client ID</TableHeaderCell>
                <TableHeaderCell>Branch</TableHeaderCell>
                <TableHeaderCell>Assigned Employee(s)</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Last Updated</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => {
                const name = `${client.first_name} ${client.last_name}`;
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        <InitialsAvatar name={name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {client.email || "No email"}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{clientCode(client.id)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.branch?.name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignedEmployeeLabel(client)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge
                          status={client.status}
                          label={client.status}
                          className="capitalize"
                          size="sm"
                        />
                        {client.risk_level === "high" && (
                          <Badge variant="danger" size="sm" className="capitalize">
                            high risk
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(client.updated_at).toLocaleDateString("nl-NL")}
                    </TableCell>
                    <TableCell align="right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Actions for ${name}`}
                          >
                            <MoreHorizontal
                              className={ICON_SIZE.sm}
                              strokeWidth={ICON_STROKE_WIDTH}
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => router.push(`/admin/clients/${client.id}`)}
                          >
                            <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => router.push(`/admin/clients/${client.id}?edit=true`)}
                          >
                            <Pencil className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            Edit
                          </DropdownMenuItem>
                          {client.status === "archived" ? (
                            <DropdownMenuItem onSelect={() => setStatusFor(client, "active")}>
                              <RotateCcw className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setStatusFor(client, "archived")}>
                              <Archive className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pagination.total} client{pagination.total === 1 ? "" : "s"}
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
