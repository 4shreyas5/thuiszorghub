"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, unknown>;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  archive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  download: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function AuditLogsPage() {
  const { user: authUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [actions, setActions] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (selectedAction) params.append("action", selectedAction);
      if (selectedEntity) params.append("entityType", selectedEntity);

      const response = await fetch(`/api/audit-logs?${params}`);
      const result = await response.json();

      if (response.ok) {
        setLogs(result.data);
        setTotal(result.pagination.total);

        const uniqueActions = [
          ...new Set(result.data.map((l: AuditLog) => l.action)),
        ].sort() as string[];
        const uniqueEntities = [
          ...new Set(result.data.map((l: AuditLog) => l.entity_type)),
        ].sort() as string[];
        setActions(uniqueActions);
        setEntities(uniqueEntities);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedAction, selectedEntity]);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      if (authUser) {
        fetchLogs();
      }
    });
  }, [authUser, fetchLogs]);

  if (!authUser) {
    return <div className="p-4">Loading...</div>;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="View system activity and changes" />

      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entity Type
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All Entities</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {log.users.first_name} {log.users.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{log.users.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {log.entity_type}
                        {log.entity_id && (
                          <div className="text-xs text-gray-500 font-mono">{log.entity_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
