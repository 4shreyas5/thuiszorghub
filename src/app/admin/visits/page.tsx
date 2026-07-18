"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  CalendarDays,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Pencil,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
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

interface VisitRow {
  id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  client?: { first_name: string; last_name: string };
  employee?: { first_name: string; last_name: string } | null;
}

interface Option {
  id: string;
  first_name: string;
  last_name: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export default function VisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<VisitRow[]>([]);
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
  const [employeeId, setEmployeeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employees, setEmployees] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  const fetchVisits = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setLoadError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search: debouncedSearch,
          status,
          employeeId,
          clientId,
          dateFrom,
          dateTo,
        });

        const response = await fetch(`/api/visits?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch visits");

        setVisits(data.visits);
        setPagination(data.pagination);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load visits");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, debouncedSearch, status, employeeId, clientId, dateFrom, dateTo]
  );

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchVisits(1);
    });
  }, [debouncedSearch, status, employeeId, clientId, dateFrom, dateTo, fetchVisits]);

  useEffect(() => {
    queueMicrotask(() => {
      if (pagination.page > 1) {
        fetchVisits(pagination.page);
      }
    });
  }, [pagination.page, fetchVisits]);

  useEffect(() => {
    fetch("/api/employees?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.employees && setEmployees(d.employees))
      .catch(() => {});
    fetch("/api/clients?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.clients && setClients(d.clients))
      .catch(() => {});
  }, []);

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/visits/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!response.ok) throw new Error("Failed to cancel visit");
      await fetchVisits(pagination.page);
    } catch (error) {
      console.error("Error cancelling visit:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const hasFilters = !!(search || status || employeeId || clientId || dateFrom || dateTo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visits"
        description="Every scheduled, in-progress and completed visit."
        action={{ label: "New Visit", href: "/admin/visits/new" }}
      />

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by visit title..."
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
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={[
              { value: "", label: "All employees" },
              ...employees.map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` })),
            ]}
          />
          <Select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={[
              { value: "", label: "All clients" },
              ...clients.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })),
            ]}
          />
        </div>
        <div className="flex flex-wrap items-end justify-end gap-3">
          <div className="w-44">
            <Input
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Input
              label="To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
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
            title="Couldn't load visits"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchVisits(pagination.page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : visits.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={hasFilters ? Search : CalendarDays}
            title={hasFilters ? "No matching visits" : "No visits yet"}
            description={
              hasFilters
                ? "Try a different search term or clearing a filter."
                : "Schedule your first visit to start coordinating care."
            }
            action={
              !hasFilters && (
                <Button asChild>
                  <Link href="/admin/visits/new">New Visit</Link>
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
                <TableHeaderCell>Visit</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    <Link
                      href={`/admin/visits/${visit.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {visit.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {visit.client ? `${visit.client.first_name} ${visit.client.last_name}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {visit.employee
                      ? `${visit.employee.first_name} ${visit.employee.last_name}`
                      : "Unassigned"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(visit.scheduled_date).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {visit.start_time?.slice(0, 5)} - {visit.end_time?.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={visit.status} size="sm" />
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
                        <DropdownMenuItem onSelect={() => router.push(`/admin/visits/${visit.id}`)}>
                          <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => router.push(`/admin/visits/${visit.id}?edit=true`)}
                        >
                          <Pencil className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          Edit
                        </DropdownMenuItem>
                        {visit.status !== "completed" && visit.status !== "cancelled" && (
                          <DropdownMenuItem onSelect={() => handleCancel(visit.id)}>
                            <XCircle className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            Cancel
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
                {pagination.total} visit{pagination.total === 1 ? "" : "s"}
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
