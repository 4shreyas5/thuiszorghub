"use client";

import { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Client } from "@/types/client";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Trash2, ChevronDown } from "lucide-react";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [caseStatus, setCaseStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const debouncedSearch = useDebounce(search, 500);

  const fetchClients = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search: debouncedSearch,
          status,
          caseStatus,
          sortBy,
          sortOrder,
        });

        const response = await fetch(`/api/clients?${params}`);
        if (!response.ok) throw new Error("Failed to fetch clients");

        const data = await response.json();
        setClients(data.clients);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, debouncedSearch, status, caseStatus, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchClients(1);
  }, [debouncedSearch, status, caseStatus, sortBy, sortOrder, fetchClients]);

  useEffect(() => {
    if (pagination.page > 1) {
      fetchClients(pagination.page);
    }
  }, [pagination.page, fetchClients]);

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this client?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to archive client");

      await fetchClients();
    } catch (error) {
      console.error("Error archiving client:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const getCaseStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "discharged":
        return "default";
      default:
        return "default";
    }
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client base"
        action={{
          label: "+ New Client",
          href: "/admin/clients/new",
        }}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border appearance-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={caseStatus}
              onChange={(e) => setCaseStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border appearance-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="">All Case Status</option>
              <option value="active">Active Case</option>
              <option value="inactive">Inactive Case</option>
              <option value="discharged">Discharged</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border appearance-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="first_name">First Name</option>
              <option value="last_name">Last Name</option>
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
        ) : clients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No clients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Case Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Risk Level
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
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {client.first_name} {client.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {client.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {client.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getCaseStatusColor(client.case_status)}>
                        {client.case_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {client.risk_level ? (
                        <Badge variant={getRiskLevelColor(client.risk_level)}>
                          {client.risk_level}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={client.is_active ? "success" : "default"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleArchive(client.id)}
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
            {pagination.total} clients
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
