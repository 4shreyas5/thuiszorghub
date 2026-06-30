 
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

type VisitRow = {
  id: string;
  client_id: string;
  employee_id: string | null;
  branch_id: string;
  title: string;
  visit_type: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  priority: string;
  estimated_duration_minutes?: number;
  client?: { first_name: string; last_name: string };
  employee?: { first_name: string; last_name: string };
  branch?: { name: string };
};

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("scheduled_date");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchVisits = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          sortBy,
          sortOrder,
        });

        if (status) {
          params.append("status", status);
        }

        const response = await fetch(`/api/visits?${params}`);
        if (!response.ok) throw new Error("Failed to fetch visits");

        const data = await response.json();
        setVisits(data.visits);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching visits:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, status, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchVisits(1);
  }, [status, sortBy, sortOrder, fetchVisits]);

  useEffect(() => {
    if (pagination.page > 1) {
      fetchVisits(pagination.page);
    }
  }, [pagination.page, fetchVisits]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this visit?")) return;

    try {
      const response = await fetch(`/api/visits/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to cancel visit");

      await fetchVisits();
    } catch (error) {
      console.error("Error cancelling visit:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "confirmed":
        return "success";
      case "in_progress":
        return "warning";
      case "completed":
        return "primary";
      case "cancelled":
        return "danger";
      case "no_show":
        return "danger";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "default";
      case "normal":
        return "primary";
      case "high":
        return "warning";
      case "urgent":
        return "danger";
      default:
        return "default";
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleDateString("nl-NL");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visits"
        description="Manage and schedule care visits"
        action={{
          label: "+ New Visit",
          href: "/admin/visits/new",
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
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border appearance-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="scheduled_date">Date</option>
              <option value="start_time">Time</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
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
        ) : visits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No visits found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Priority
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
                {visits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatTime(visit.scheduled_date)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {visit.start_time} - {visit.end_time}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/clients/${visit.client_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {visit.client?.first_name} {visit.client?.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {visit.employee ? (
                        <Link
                          href={`/admin/employees/${visit.employee_id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {visit.employee.first_name} {visit.employee.last_name}
                        </Link>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {visit.visit_type?.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {visit.estimated_duration_minutes
                        ? `${visit.estimated_duration_minutes}m`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getPriorityColor(visit.priority)}>
                        {visit.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getStatusColor(visit.status)}>
                        {visit.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <Link
                        href={`/admin/visits/${visit.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(visit.id)}
                        className="text-red-600 hover:text-red-700 flex gap-1 items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
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
            {pagination.total} visits
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
