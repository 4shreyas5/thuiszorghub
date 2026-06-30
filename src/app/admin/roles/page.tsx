"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface Role {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  role_permissions?: Array<{
    permissions: {
      id: string;
      module: string;
      action: string;
      code: string;
    };
  }>;
}

export default function RolesPage() {
  const { user: authUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/roles?page=${page}&limit=${limit}`);
      const result = await response.json();

      if (response.ok) {
        setRoles(result.data);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (authUser) {
      fetchRoles();
    }
  }, [authUser, fetchRoles]);

  if (!authUser) {
    return <div className="p-4">Loading...</div>;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Manage user roles and their permissions" />

      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No roles found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Permissions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{role.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{role.description || "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {role.role_permissions && role.role_permissions.length > 0 ? (
                            role.role_permissions.slice(0, 3).map((rp) => (
                              <Badge key={rp.permissions.id} variant="info" className="text-xs">
                                {rp.permissions.action}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                          {role.role_permissions && role.role_permissions.length > 3 && (
                            <Badge variant="info" className="text-xs">
                              +{role.role_permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={role.is_system ? "primary" : "info"}>
                          {role.is_system ? "System" : "Custom"}
                        </Badge>
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
