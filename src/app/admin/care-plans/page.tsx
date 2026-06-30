 
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "date-fns";

export const dynamic = "force-dynamic";

interface CarePlanRow {
  id: string;
  client_id: string;
  title: string;
  status: string;
  priority: string;
  start_date: string;
  review_date?: string;
  primary_caregiver_id?: string;
  client?: {
    first_name: string;
    last_name: string;
  };
  primary_caregiver?: {
    first_name: string;
    last_name: string;
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-800 dark:text-gray-100" },
  active: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-100" },
  on_hold: { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-800 dark:text-orange-100" },
  completed: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-800 dark:text-green-100" },
  archived: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-800 dark:text-gray-100" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-800 dark:text-gray-100" },
  normal: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-100" },
  high: { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-800 dark:text-orange-100" },
  urgent: { bg: "bg-red-100 dark:bg-red-900", text: "text-red-800 dark:text-red-100" },
};

export default function CarePlansPage() {
  const router = useRouter();
  const [carePlans, setCarePlans] = useState<CarePlanRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const fetchCarePlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);

      const response = await fetch(`/api/care-plans?${params.toString()}`);
      const data = await response.json();
      setCarePlans(data.care_plans || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching care plans:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, priority]);

   
  useEffect(() => {
    fetchCarePlans();
  }, [fetchCarePlans]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this care plan?")) return;

    try {
      const response = await fetch(`/api/care-plans/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCarePlans(carePlans.filter((cp) => cp.id !== id));
      }
    } catch (error) {
      console.error("Error deleting care plan:", error);
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Care Plans" description="Manage care plans for clients" />
        <Button onClick={() => router.push("/admin/care-plans/new")} className="flex gap-2">
          <Plus className="w-4 h-4" />
          New Care Plan
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by title or client name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setPriority("");
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : carePlans.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No care plans found</p>
            <Button onClick={() => router.push("/admin/care-plans/new")}>Create First Care Plan</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Primary Caregiver
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Review Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {carePlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <Link
                          href={`/admin/care-plans/${plan.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {plan.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {plan.client ? `${plan.client.first_name} ${plan.client.last_name}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {plan.primary_caregiver
                          ? `${plan.primary_caregiver.first_name} ${plan.primary_caregiver.last_name}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            STATUS_COLORS[plan.status as keyof typeof STATUS_COLORS]?.bg || "bg-gray-100"
                          } ${
                            STATUS_COLORS[plan.status as keyof typeof STATUS_COLORS]?.text || "text-gray-800"
                          }`}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            PRIORITY_COLORS[plan.priority as keyof typeof PRIORITY_COLORS]?.bg || "bg-gray-100"
                          } ${
                            PRIORITY_COLORS[plan.priority as keyof typeof PRIORITY_COLORS]?.text || "text-gray-800"
                          }`}
                        >
                          {plan.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(new Date(plan.start_date), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {plan.review_date ? formatDate(new Date(plan.review_date), "dd MMM yyyy") : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <Link
                          href={`/admin/care-plans/${plan.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Page {page} of {pages} ({total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(5, pages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg ${
                          page === pageNum
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
