"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ClipboardList,
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

export const dynamic = "force-dynamic";

interface CarePlanRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  start_date: string;
  review_date?: string;
  client?: { id: string; first_name: string; last_name: string };
  primary_caregiver?: { id: string; first_name: string; last_name: string };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Option {
  id: string;
  first_name: string;
  last_name: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function CarePlansPage() {
  const router = useRouter();
  const [carePlans, setCarePlans] = useState<CarePlanRow[]>([]);
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
  const [priority, setPriority] = useState("");
  const [clientId, setClientId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [clients, setClients] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  const fetchCarePlans = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setLoadError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search: debouncedSearch,
          status,
          priority,
          client_id: clientId,
          employeeId,
        });

        const response = await fetch(`/api/care-plans?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch care plans");

        setCarePlans(data.care_plans);
        setPagination(data.pagination);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load care plans");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, debouncedSearch, status, priority, clientId, employeeId]
  );

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchCarePlans(1);
    });
  }, [debouncedSearch, status, priority, clientId, employeeId, fetchCarePlans]);

  useEffect(() => {
    queueMicrotask(() => {
      if (pagination.page > 1) {
        fetchCarePlans(pagination.page);
      }
    });
  }, [pagination.page, fetchCarePlans]);

  useEffect(() => {
    fetch("/api/clients?page=1&limit=200")
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.clients) setClients(result.clients);
      })
      .catch(() => {});
    fetch("/api/employees?page=1&limit=200")
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.employees) setEmployees(result.employees);
      })
      .catch(() => {});
  }, []);

  const setStatusFor = async (plan: CarePlanRow, newStatus: "active" | "archived") => {
    try {
      const response =
        newStatus === "archived"
          ? await fetch(`/api/care-plans/${plan.id}`, { method: "DELETE" })
          : await fetch(`/api/care-plans/${plan.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });

      if (!response.ok) throw new Error("Failed to update care plan status");
      await fetchCarePlans(pagination.page);
    } catch (error) {
      console.error("Error updating care plan status:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const hasFilters = !!(search || status || priority || clientId || employeeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Care Plans"
        description="Coordinate goals, tasks and reviews for each client's care."
        action={{ label: "New Care Plan", href: "/admin/care-plans/new" }}
      />

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by title..."
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
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={PRIORITY_OPTIONS}
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
        <div className="flex justify-end">
          <div className="w-56">
            <Select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={[
                { value: "", label: "All caregivers" },
                ...employees.map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` })),
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
            title="Couldn't load care plans"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchCarePlans(pagination.page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : carePlans.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={hasFilters ? Search : ClipboardList}
            title={hasFilters ? "No matching care plans" : "No care plans yet"}
            description={
              hasFilters
                ? "Try a different search term or clearing a filter."
                : "Create a care plan to start tracking a client's goals, tasks and reviews."
            }
            action={
              !hasFilters && (
                <Button asChild>
                  <Link href="/admin/care-plans/new">New Care Plan</Link>
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
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Primary Caregiver</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Priority</TableHeaderCell>
                <TableHeaderCell>Review Date</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carePlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Link
                      href={`/admin/care-plans/${plan.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {plan.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.client ? (
                      <Link
                        href={`/admin/clients/${plan.client.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {plan.client.first_name} {plan.client.last_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.primary_caregiver
                      ? `${plan.primary_caregiver.first_name} ${plan.primary_caregiver.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={plan.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        plan.priority === "urgent" || plan.priority === "high"
                          ? "danger"
                          : "default"
                      }
                      size="sm"
                      className="capitalize"
                    >
                      {plan.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.review_date
                      ? new Date(plan.review_date).toLocaleDateString("nl-NL")
                      : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Actions for ${plan.title}`}
                        >
                          <MoreHorizontal
                            className={ICON_SIZE.sm}
                            strokeWidth={ICON_STROKE_WIDTH}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => router.push(`/admin/care-plans/${plan.id}`)}
                        >
                          <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => router.push(`/admin/care-plans/${plan.id}?edit=true`)}
                        >
                          <Pencil className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          Edit
                        </DropdownMenuItem>
                        {plan.status === "archived" ? (
                          <DropdownMenuItem onSelect={() => setStatusFor(plan, "active")}>
                            <RotateCcw className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            Activate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setStatusFor(plan, "archived")}>
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
                {pagination.total} care plan{pagination.total === 1 ? "" : "s"}
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
