"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Plus, MoreHorizontal, Users as UsersIcon, AlertTriangle, X } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
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
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface Branch {
  id: string;
  name: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  invitationStatus?: "pending" | "accepted";
  branch_id?: string | null;
  is_active: boolean;
  created_at: string;
  branches?: { id: string; name: string } | null;
  user_roles?: Array<{ id: string; roles: Role }>;
}

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
  branchId: string;
  roleIds: string[];
}

function displayName(u: User): string {
  return `${u.first_name || ""} ${u.last_name || ""}`.trim();
}

export default function UsersPage() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 50;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteBranchId, setInviteBranchId] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: "",
    lastName: "",
    phone: "",
    branchId: "",
    roleIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [removingUser, setRemovingUser] = useState<User | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
      const result = await response.json();

      if (response.ok) {
        setUsers(result.data || []);
        setTotal(result.pagination?.total || 0);
      } else {
        setLoadError(result.error || `Failed to load users (${response.status})`);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchLookups = useCallback(async () => {
    try {
      const [branchesRes, rolesRes] = await Promise.all([
        fetch("/api/branches?page=1&limit=100"),
        fetch("/api/roles?page=1&limit=100"),
      ]);
      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(data.data || []);
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching lookups:", error);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so these fetch triggers aren't synchronous setState calls in the effect body.
    queueMicrotask(() => {
      if (authUser) {
        fetchUsers();
        fetchLookups();
      }
    });
  }, [authUser, fetchUsers, fetchLookups]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          branchId: inviteBranchId || undefined,
          roleId: inviteRoleId || undefined,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setInviteOpen(false);
        setInviteEmail("");
        setInviteFirstName("");
        setInviteLastName("");
        setInviteBranchId("");
        setInviteRoleId("");
        setBanner(
          result.isExistingAccount
            ? "This email already had an account - they've been added to the organization immediately (no invite email sent, they can just log in)."
            : 'Invitation email sent. They\'ll appear here as "Pending" until they accept.'
        );
        setTimeout(() => setBanner(null), 8000);
        fetchUsers();
      } else {
        setInviteError(result.error || "Failed to invite user");
      }
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const openEdit = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditError(null);
    setEditForm({
      firstName: targetUser.first_name || "",
      lastName: targetUser.last_name || "",
      phone: targetUser.phone || "",
      branchId: targetUser.branch_id || "",
      roleIds: (targetUser.user_roles || []).map((ur) => ur.roles.id),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    setEditError(null);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          branchId: editForm.branchId || null,
          roleIds: editForm.roleIds,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        setEditError(result.error || "Failed to update user");
      }
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async (targetUser: User) => {
    try {
      const response = await fetch(`/api/users/${targetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !targetUser.is_active }),
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error toggling suspend:", error);
    }
  };

  const handleRemove = async () => {
    if (!removingUser) return;
    setRemoving(true);
    try {
      const response = await fetch(`/api/users/${removingUser.id}`, { method: "DELETE" });
      if (response.ok) {
        setRemovingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error removing user:", error);
    } finally {
      setRemoving(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setEditForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((r) => r !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [displayName(u), u.email, u.branches?.name].some((v) => v?.toLowerCase().includes(q))
    );
  }, [users, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Invite teammates and manage their branch, roles and access."
        actions={
          <>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
              />
            </div>
            <Button
              onClick={() => setInviteOpen(true)}
              icon={<Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
            >
              Invite User
            </Button>
          </>
        }
      />

      {banner && (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/10 p-3 text-sm text-info">
          <span className="flex-1">{banner}</span>
          <button
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
            className="shrink-0 hover:opacity-70"
          >
            <X className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
          </button>
        </div>
      )}

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
            title="Couldn't load users"
            description={loadError}
            action={
              <Button variant="outline" onClick={fetchUsers}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : users.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={UsersIcon}
            title="No users yet"
            description="Invite your first colleague to start coordinating care together."
            action={
              <Button
                onClick={() => setInviteOpen(true)}
                icon={<Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
              >
                Invite User
              </Button>
            }
          />
        </Card>
      ) : visibleUsers.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={Search}
            title="No matching users"
            description={`No users match "${search}".`}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Branch</TableHeaderCell>
                <TableHeaderCell>Roles</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Invitation</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleUsers.map((u) => {
                const name = displayName(u);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={name || u.email} size="sm" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium text-foreground">
                            {name || <span className="text-muted-foreground">(no name yet)</span>}
                            {u.id === authUser?.id && (
                              <Badge variant="primary" size="sm">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.branches?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {u.user_roles && u.user_roles.length > 0 ? (
                          u.user_roles.map((ur) => (
                            <Badge key={ur.id} variant="info" size="sm">
                              {ur.roles.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "success" : "danger"}>
                        {u.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={u.invitationStatus === "pending" ? "invited" : "accepted"}
                        label={u.invitationStatus === "pending" ? "Pending" : "Accepted"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Actions for ${name || u.email}`}
                          >
                            <MoreHorizontal
                              className={ICON_SIZE.sm}
                              strokeWidth={ICON_STROKE_WIDTH}
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(u)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => toggleSuspend(u)}>
                            {u.is_active ? "Suspend" : "Activate"}
                          </DropdownMenuItem>
                          {u.id !== authUser?.id && (
                            <DropdownMenuItem destructive onSelect={() => setRemovingUser(u)}>
                              Remove
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total} user{total === 1 ? "" : "s"}
              </p>
              <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Invite User modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite User"
        actions={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} loading={inviting}>
              Send Invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {inviteError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {inviteError}
            </div>
          )}
          <Input
            label="Email"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              value={inviteFirstName}
              onChange={(e) => setInviteFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              value={inviteLastName}
              onChange={(e) => setInviteLastName(e.target.value)}
            />
          </div>
          <Select
            label="Branch"
            placeholder="No branch"
            value={inviteBranchId}
            onChange={(e) => setInviteBranchId(e.target.value)}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select
            label="Role"
            placeholder="No role"
            value={inviteRoleId}
            onChange={(e) => setInviteRoleId(e.target.value)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </div>
      </Modal>

      {/* Edit User modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {editError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Select
            label="Branch"
            placeholder="No branch"
            value={editForm.branchId}
            onChange={(e) => setEditForm((f) => ({ ...f, branchId: e.target.value }))}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Roles</label>
            <div className="max-h-40 space-y-2.5 overflow-y-auto rounded-lg border border-border p-3">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${r.id}`}
                    checked={editForm.roleIds.includes(r.id)}
                    onCheckedChange={() => toggleRole(r.id)}
                  />
                  <label
                    htmlFor={`role-${r.id}`}
                    className="cursor-pointer text-sm text-foreground"
                  >
                    {r.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        isOpen={!!removingUser}
        onClose={() => setRemovingUser(null)}
        title="Remove User"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setRemovingUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} loading={removing}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Remove{" "}
          <strong className="text-foreground">
            {removingUser?.first_name} {removingUser?.last_name || removingUser?.email}
          </strong>{" "}
          from the organization? They will lose access immediately.
        </p>
      </Modal>
    </div>
  );
}
