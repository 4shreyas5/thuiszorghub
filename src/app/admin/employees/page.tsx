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
import { Employee } from "@/types/employee";
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
  { value: "on_leave", label: "On Leave" },
  { value: "archived", label: "Archived" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "All employment types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "casual", label: "Casual" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Sort: Newest" },
  { value: "first_name", label: "Sort: First Name" },
  { value: "last_name", label: "Sort: Last Name" },
  { value: "start_date", label: "Sort: Start Date" },
];

function employeeCode(id: string): string {
  return `EMP-${id.slice(0, 8).toUpperCase()}`;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
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
  const [branch, setBranch] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [branches, setBranches] = useState<Branch[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  const fetchEmployees = useCallback(
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
          employment_type: employmentType,
          sortBy,
          sortOrder,
        });

        const response = await fetch(`/api/employees?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch employees");

        setEmployees(data.employees);
        setPagination(data.pagination);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load employees");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, debouncedSearch, status, branch, employmentType, sortBy, sortOrder]
  );

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchEmployees(1);
    });
  }, [debouncedSearch, status, branch, employmentType, sortBy, sortOrder, fetchEmployees]);

  useEffect(() => {
    queueMicrotask(() => {
      if (pagination.page > 1) {
        fetchEmployees(pagination.page);
      }
    });
  }, [pagination.page, fetchEmployees]);

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

  const setStatusFor = async (employee: Employee, newStatus: "active" | "archived") => {
    try {
      const response =
        newStatus === "archived"
          ? await fetch(`/api/employees/${employee.id}`, { method: "DELETE" })
          : await fetch(`/api/employees/${employee.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });

      if (!response.ok) throw new Error("Failed to update employee status");
      await fetchEmployees(pagination.page);
    } catch (error) {
      console.error("Error updating employee status:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage your caregivers and office staff."
        action={{ label: "New Employee", href: "/admin/employees/new" }}
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
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            options={[
              { value: "", label: "All branches" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <Select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            options={EMPLOYMENT_TYPE_OPTIONS}
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
            title="Couldn't load employees"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchEmployees(pagination.page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : employees.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={search || status || branch || employmentType ? Search : Users}
            title={
              search || status || branch || employmentType
                ? "No matching employees"
                : "No employees yet"
            }
            description={
              search || status || branch || employmentType
                ? "Try a different search term or clearing a filter."
                : "Add your first caregiver or office staff member to get started."
            }
            action={
              !(search || status || branch || employmentType) && (
                <Button asChild>
                  <Link href="/admin/employees/new">New Employee</Link>
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
                <TableHeaderCell>Employee ID</TableHeaderCell>
                <TableHeaderCell>Branch</TableHeaderCell>
                <TableHeaderCell>Employment Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Last Updated</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => {
                const name = `${employee.first_name} ${employee.last_name}`;
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Link
                        href={`/admin/employees/${employee.id}`}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        <InitialsAvatar name={name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employeeCode(employee.id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.branch?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="info" className="capitalize">
                        {employee.employment_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={employee.status}
                        label={employee.status?.replace("_", " ")}
                        className="capitalize"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(employee.updated_at).toLocaleDateString("nl-NL")}
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
                            onSelect={() => router.push(`/admin/employees/${employee.id}`)}
                          >
                            <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(`/admin/employees/${employee.id}?edit=true`)
                            }
                          >
                            <Pencil className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                            Edit
                          </DropdownMenuItem>
                          {employee.status === "archived" ? (
                            <DropdownMenuItem onSelect={() => setStatusFor(employee, "active")}>
                              <RotateCcw className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setStatusFor(employee, "archived")}>
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
                {pagination.total} employee{pagination.total === 1 ? "" : "s"}
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
