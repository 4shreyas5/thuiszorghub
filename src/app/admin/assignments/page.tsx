 
"use client";

import { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2, ChevronDown } from "lucide-react";

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
  employee?: { first_name: string; last_name: string };
  client?: { first_name: string; last_name: string };
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("assigned_from");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchAssignments = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          status,
          sortBy,
          sortOrder,
        });

        const response = await fetch(`/api/assignments?${params}`);
        if (!response.ok) throw new Error("Failed to fetch assignments");

        const data = await response.json();
        setAssignments(data.assignments);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, status, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchAssignments(1);
  }, [status, sortBy, sortOrder, fetchAssignments]);

  useEffect(() => {
    if (pagination.page > 1) {
      fetchAssignments(pagination.page);
    }
  }, [pagination.page, fetchAssignments]);

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this assignment?")) return;

    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to archive assignment");

      await fetchAssignments();
    } catch (error) {
      console.error("Error archiving assignment:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const getStatusBadgeColor = (assignment: AssignmentRow) => {
    const today = new Date().toISOString().split("T")[0];
    const from = new Date(assignment.assigned_from).toISOString().split("T")[0];
    const until = assignment.assigned_until
      ? new Date(assignment.assigned_until).toISOString().split("T")[0]
      : null;

    if (from > today) return "warning";
    if (until && until < today) return "default";
    return "success";
  };

  const getStatusLabel = (assignment: AssignmentRow) => {
    const today = new Date().toISOString().split("T")[0];
    const from = new Date(assignment.assigned_from).toISOString().split("T")[0];
    const until = assignment.assigned_until
      ? new Date(assignment.assigned_until).toISOString().split("T")[0]
      : null;

    if (from > today) return "Pending";
    if (until && until < today) return "Ended";
    return "Active";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Manage employee and client assignments"
        action={{
          label: "+ New Assignment",
          href: "/admin/assignments/new",
        }}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border appearance-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Ended</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border appearance-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="assigned_from">Start Date</option>
              <option value="assigned_until">End Date</option>
              <option value="is_primary">Primary</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border appearance-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No assignments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Primary
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/employees/${assignment.employee_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {assignment.employee?.first_name} {assignment.employee?.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/clients/${assignment.client_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {assignment.client?.first_name} {assignment.client?.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={assignment.is_primary ? "primary" : "default"}>
                        {assignment.is_primary ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(assignment.assigned_from).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {assignment.assigned_until
                        ? new Date(assignment.assigned_until).toLocaleDateString("nl-NL")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getStatusBadgeColor(assignment)}>
                        {getStatusLabel(assignment)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <Link
                        href={`/admin/assignments/${assignment.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleArchive(assignment.id)}
                        className="text-red-600 hover:text-red-700 flex gap-1 items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} assignments
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              variant="secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {[...Array(pagination.pages)].map((_, i) => (
              <Button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                variant={pagination.page === i + 1 ? "primary" : "secondary"}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              variant="secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
