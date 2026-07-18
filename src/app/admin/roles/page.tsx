"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Plus, MoreHorizontal, ShieldCheck, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
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
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

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
  description?: string;
  is_system: boolean;
  created_at: string;
  role_permissions?: Array<{ id: string; permissions: Permission }>;
}

export default function RolesPage() {
  const { user: authUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 50;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch(`/api/roles?page=${page}&limit=${limit}`);
      const result = await response.json();

      if (response.ok) {
        setRoles(result.data || []);
        setTotal(result.pagination?.total || 0);
      } else {
        setLoadError(result.error || `Failed to load roles (${response.status})`);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch("/api/permissions?page=1&limit=200");
      if (response.ok) {
        const result = await response.json();
        setPermissions(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so these fetch triggers aren't synchronous setState calls in the effect body.
    queueMicrotask(() => {
      if (authUser) {
        fetchRoles();
        fetchPermissions();
      }
    });
  }, [authUser, fetchRoles, fetchPermissions]);

  const openCreate = () => {
    setEditingRole(null);
    setName("");
    setDescription("");
    setSelectedPermissionIds([]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setSelectedPermissionIds((role.role_permissions || []).map((rp) => rp.permissions.id));
    setFormError(null);
    setModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError("Role name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = { name, description, permissionIds: selectedPermissionIds };
      const response = editingRole
        ? await fetch(`/api/roles/${editingRole.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const result = await response.json();
      if (response.ok) {
        setModalOpen(false);
        fetchRoles();
      } else {
        setFormError(result.error || "Failed to save role");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/roles/${deletingRole.id}`, { method: "DELETE" });
      if (response.ok) {
        setDeletingRole(null);
        fetchRoles();
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    } finally {
      setDeleting(false);
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

  const visibleRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => [r.name, r.description].some((v) => v?.toLowerCase().includes(q)));
  }, [roles, search]);

  const isReadOnly = !!editingRole?.is_system;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Define roles and the permissions granted to the users who hold them."
        actions={
          <>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
              />
            </div>
            <Button
              onClick={openCreate}
              icon={<Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
            >
              Create Role
            </Button>
          </>
        }
      />

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
            title="Couldn't load roles"
            description={loadError}
            action={
              <Button variant="outline" onClick={fetchRoles}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : roles.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={ShieldCheck}
            title="No roles yet"
            description="Define your first role to control what your care team can see and do."
            action={
              <Button
                onClick={openCreate}
                icon={<Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
              >
                Create Role
              </Button>
            }
          />
        </Card>
      ) : visibleRoles.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={Search}
            title="No matching roles"
            description={`No roles match "${search}".`}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Permissions</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium text-foreground">{role.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {role.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {role.role_permissions && role.role_permissions.length > 0 ? (
                        <>
                          {role.role_permissions.slice(0, 3).map((rp) => (
                            <Badge key={rp.id} variant="info" size="sm">
                              {rp.permissions.action}
                            </Badge>
                          ))}
                          {role.role_permissions.length > 3 && (
                            <Badge variant="default" size="sm">
                              +{role.role_permissions.length - 3}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_system ? "primary" : "default"}>
                      {role.is_system ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Actions for ${role.name}`}
                        >
                          <MoreHorizontal
                            className={ICON_SIZE.sm}
                            strokeWidth={ICON_STROKE_WIDTH}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(role)}>
                          {role.is_system ? "View" : "Edit"}
                        </DropdownMenuItem>
                        {!role.is_system && (
                          <DropdownMenuItem destructive onSelect={() => setDeletingRole(role)}>
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total} role{total === 1 ? "" : "s"}
              </p>
              <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? (editingRole.is_system ? "View Role" : "Edit Role") : "Create Role"}
        size="lg"
        actions={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button onClick={handleSave} loading={saving}>
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {formError}
            </div>
          )}
          {isReadOnly && (
            <div className="rounded-md border border-info/30 bg-info/10 p-3 text-sm text-info">
              This is a built-in system role. Its name and permissions can be viewed but not
              modified.
            </div>
          )}
          <Input
            label="Role Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isReadOnly}
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isReadOnly}
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">Permissions</label>
              <span className="text-xs text-muted-foreground">
                {selectedPermissionIds.length} selected
              </span>
            </div>
            <div className="max-h-72 space-y-5 overflow-y-auto rounded-lg border border-border p-4">
              {Object.entries(permissionsByModule).map(([mod, perms]) => (
                <div key={mod}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {mod}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {perms.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`perm-${p.id}`}
                          checked={selectedPermissionIds.includes(p.id)}
                          disabled={isReadOnly}
                          onCheckedChange={() => togglePermission(p.id)}
                        />
                        <label
                          htmlFor={`perm-${p.id}`}
                          className="cursor-pointer text-sm text-foreground"
                        >
                          {p.action}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        title="Delete Role"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeletingRole(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Delete the role <strong className="text-foreground">{deletingRole?.name}</strong>? Users
          assigned this role will lose the permissions it grants.
        </p>
      </Modal>
    </div>
  );
}
