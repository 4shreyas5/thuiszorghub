"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Plus, MoreHorizontal, Building2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
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

interface OrgUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Branch {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  country: string;
  manager_user_id?: string | null;
  manager?: OrgUser | null;
  is_active: boolean;
  created_at: string;
}

interface BranchForm {
  name: string;
  code: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  managerUserId: string;
}

const emptyForm: BranchForm = {
  name: "",
  code: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "NL",
  managerUserId: "",
};

function managerName(m?: OrgUser | null): string {
  if (!m) return "—";
  return `${m.first_name} ${m.last_name}`.trim() || m.email;
}

export default function BranchesPage() {
  const { user: authUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 50;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [detailsBranch, setDetailsBranch] = useState<Branch | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch(`/api/branches?page=${page}&limit=${limit}`);
      const result = await response.json();

      if (response.ok) {
        setBranches(result.data || []);
        setTotal(result.pagination?.total || 0);
      } else {
        setLoadError(result.error || `Failed to load branches (${response.status})`);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchOrgUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users?page=1&limit=100");
      if (response.ok) {
        const result = await response.json();
        setOrgUsers(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching users for manager selection:", error);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so these fetch triggers aren't synchronous setState calls in the effect body.
    queueMicrotask(() => {
      if (authUser) {
        fetchBranches();
        fetchOrgUsers();
      }
    });
  }, [authUser, fetchBranches, fetchOrgUsers]);

  const openCreate = () => {
    setEditingBranch(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      code: branch.code || "",
      email: branch.email || "",
      phone: branch.phone || "",
      addressLine1: branch.address_line_1 || "",
      addressLine2: branch.address_line_2 || "",
      city: branch.city || "",
      postalCode: branch.postal_code || "",
      country: branch.country || "NL",
      managerUserId: branch.manager_user_id || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Branch name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        code: form.code || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        addressLine1: form.addressLine1 || undefined,
        addressLine2: form.addressLine2 || undefined,
        city: form.city || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country || undefined,
        managerUserId: form.managerUserId || null,
      };

      const response = editingBranch
        ? await fetch(`/api/branches/${editingBranch.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/branches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const result = await response.json();
      if (response.ok) {
        setModalOpen(false);
        fetchBranches();
      } else {
        setFormError(result.error || "Failed to save branch");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save branch");
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (branch: Branch) => {
    try {
      if (branch.is_active) {
        await fetch(`/api/branches/${branch.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/branches/${branch.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
      }
      fetchBranches();
    } catch (error) {
      console.error("Error toggling branch status:", error);
    }
  };

  const visibleBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) =>
      [b.name, b.code, b.city, managerName(b.manager)].some((v) => v?.toLowerCase().includes(q))
    );
  }, [branches, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage the physical locations your organization operates from."
        actions={
          <>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search branches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
              />
            </div>
            <Button
              onClick={openCreate}
              icon={<Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
            >
              Create Branch
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
            title="Couldn't load branches"
            description={loadError}
            action={
              <Button variant="outline" onClick={fetchBranches}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : branches.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={Building2}
            title="No branches yet"
            description="Add your organization's first location to begin assigning caregivers, clients and visits."
            action={
              <Button
                onClick={openCreate}
                icon={<Plus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
              >
                Create Branch
              </Button>
            }
          />
        </Card>
      ) : visibleBranches.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={Search}
            title="No matching branches"
            description={`No branches match "${search}". Try a different search term.`}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Code</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
                <TableHeaderCell>Manager</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleBranches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium text-foreground">
                    <button
                      className="hover:text-primary hover:underline"
                      onClick={() => setDetailsBranch(branch)}
                    >
                      {branch.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{branch.code || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {branch.city}
                    {branch.postal_code ? `, ${branch.postal_code}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {managerName(branch.manager)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.is_active ? "success" : "default"}>
                      {branch.is_active ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Actions for ${branch.name}`}
                        >
                          <MoreHorizontal
                            className={ICON_SIZE.sm}
                            strokeWidth={ICON_STROKE_WIDTH}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setDetailsBranch(branch)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(branch)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toggleArchive(branch)}>
                          {branch.is_active ? "Archive" : "Reactivate"}
                        </DropdownMenuItem>
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
                {total} branch{total === 1 ? "" : "es"}
              </p>
              <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBranch ? "Edit Branch" : "Create Branch"}
        size="lg"
        actions={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingBranch ? "Save Changes" : "Create Branch"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Branch Name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <Input
            label="Address Line 1"
            value={form.addressLine1}
            onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
          />
          <Input
            label="Address Line 2"
            value={form.addressLine2}
            onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Postal Code"
              value={form.postalCode}
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
            />
            <Select
              label="Country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              options={[
                { value: "NL", label: "Netherlands" },
                { value: "BE", label: "Belgium" },
                { value: "DE", label: "Germany" },
              ]}
            />
          </div>
          <Select
            label="Branch Manager"
            placeholder="No manager assigned"
            value={form.managerUserId}
            onChange={(e) => setForm((f) => ({ ...f, managerUserId: e.target.value }))}
            options={orgUsers.map((u) => ({
              value: u.id,
              label: `${u.first_name} ${u.last_name}`.trim() || u.email,
            }))}
          />
        </div>
      </Modal>

      {/* Details modal */}
      <Modal
        isOpen={!!detailsBranch}
        onClose={() => setDetailsBranch(null)}
        title={detailsBranch?.name || "Branch Details"}
        actions={
          <Button variant="secondary" onClick={() => setDetailsBranch(null)}>
            Close
          </Button>
        }
      >
        {detailsBranch && (
          <dl className="divide-y divide-border text-sm">
            <DetailRow label="Code" value={detailsBranch.code || "—"} />
            <DetailRow label="Email" value={detailsBranch.email || "—"} />
            <DetailRow label="Phone" value={detailsBranch.phone || "—"} />
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="text-right text-foreground">
                {detailsBranch.address_line_1}
                {detailsBranch.address_line_2 ? `, ${detailsBranch.address_line_2}` : ""}
                <br />
                {detailsBranch.city}, {detailsBranch.postal_code}
                <br />
                {detailsBranch.country}
              </dd>
            </div>
            <DetailRow label="Manager" value={managerName(detailsBranch.manager)} />
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={detailsBranch.is_active ? "success" : "default"}>
                  {detailsBranch.is_active ? "Active" : "Archived"}
                </Badge>
              </dd>
            </div>
            <DetailRow
              label="Created"
              value={new Date(detailsBranch.created_at).toLocaleDateString()}
            />
          </dl>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
