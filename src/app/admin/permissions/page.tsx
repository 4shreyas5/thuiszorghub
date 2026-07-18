"use client";

import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

interface Permission {
  id: string;
  module: string;
  action: string;
  code: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  is_system: boolean;
  role_permissions?: Array<{ permissions: { id: string } }>;
}

export default function PermissionsPage() {
  const { user: authUser } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null); // `${roleId}:${permissionId}` currently saving

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [permsRes, rolesRes] = await Promise.all([
        fetch("/api/permissions?page=1&limit=200"),
        fetch("/api/roles?page=1&limit=100"),
      ]);
      const permsResult = await permsRes.json();
      const rolesResult = await rolesRes.json();

      if (!permsRes.ok) throw new Error(permsResult.error || "Failed to load permissions");
      if (!rolesRes.ok) throw new Error(rolesResult.error || "Failed to load roles");

      setPermissions(permsResult.data || []);
      setRoles(rolesResult.data || []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load permission matrix");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      if (authUser) fetchData();
    });
  }, [authUser, fetchData]);

  const roleHasPermission = (role: Role, permissionId: string) =>
    (role.role_permissions || []).some((rp) => rp.permissions.id === permissionId);

  const togglePermission = async (role: Role, permission: Permission) => {
    const key = `${role.id}:${permission.id}`;
    const currentlyHas = roleHasPermission(role, permission.id);
    setPending(key);

    // Optimistic update
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== role.id) return r;
        const nextPerms = currentlyHas
          ? (r.role_permissions || []).filter((rp) => rp.permissions.id !== permission.id)
          : [...(r.role_permissions || []), { permissions: { id: permission.id } }];
        return { ...r, role_permissions: nextPerms };
      })
    );

    try {
      if (currentlyHas) {
        await fetch(`/api/roles/${role.id}/permissions?permissionId=${permission.id}`, {
          method: "DELETE",
        });
      } else {
        await fetch(`/api/roles/${role.id}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionId: permission.id }),
        });
      }
    } catch (error) {
      console.error("Error toggling permission:", error);
      fetchData(); // revert optimistic update by refetching truth
    } finally {
      setPending(null);
    }
  };

  const permissionsByModule = useMemo(
    () =>
      permissions.reduce<Record<string, Permission[]>>((acc, p) => {
        (acc[p.module] ||= []).push(p);
        return acc;
      }, {}),
    [permissions]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Control which roles can perform which actions. Changes save instantly."
      />

      {loading ? (
        <Card bordered padding="md" className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : loadError ? (
        <Card bordered padding="md">
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Couldn't load permission matrix"
            description={loadError}
            action={
              <Button variant="outline" onClick={fetchData}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : roles.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={ShieldCheck}
            title="No roles to configure"
            description="Create a role first, then assign permissions to it here."
            action={
              <Button variant="outline" asChild>
                <a href="/admin/roles">Go to Roles</a>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-card">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                  Permission
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="whitespace-nowrap px-4 py-3 text-center font-medium text-foreground"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {role.name}
                      <Badge variant={role.is_system ? "primary" : "default"} size="sm">
                        {role.is_system ? "System" : "Custom"}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionsByModule).map(([mod, perms]) => (
                <Fragment key={mod}>
                  <tr className="bg-muted/50">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {mod}
                    </td>
                  </tr>
                  {perms.map((permission) => (
                    <tr
                      key={permission.id}
                      className="border-t border-border transition-colors hover:bg-accent/50"
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground">{permission.action}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {permission.code}
                        </div>
                      </td>
                      {roles.map((role) => {
                        const key = `${role.id}:${permission.id}`;
                        return (
                          <td key={role.id} className="px-4 py-2.5 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={roleHasPermission(role, permission.id)}
                                disabled={pending === key}
                                onCheckedChange={() => togglePermission(role, permission)}
                                aria-label={`${role.name}: ${permission.code}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
