"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText, AlertTriangle, MoreHorizontal, Eye, Download } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
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
import { useDebounce } from "@/hooks/useDebounce";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  invoice_date: string;
  due_date: string;
  client?: { first_name: string; last_name: string } | null;
}

interface Option {
  id: string;
  first_name: string;
  last_name: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Option[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  const fetchInvoices = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setLoadError(null);
        const offset = (targetPage - 1) * limit;
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (status) params.append("status", status);
        if (clientId) params.append("clientId", clientId);

        const response = await fetch(`/api/billing/invoices?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch invoices");

        setInvoices(data.data || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, status, clientId]
  );

  useEffect(() => {
    // Deferred to a microtask so these setState/fetch calls aren't synchronous within the effect body.
    queueMicrotask(() => {
      setPage(1);
      fetchInvoices(1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, clientId]);

  useEffect(() => {
    queueMicrotask(() => {
      if (page > 1) fetchInvoices(page);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetch("/api/clients?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.clients && setClients(d.clients))
      .catch(() => {});
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const hasFilters = !!(search || status || clientId);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage all invoices and billing documents." />

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />}
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
          <Select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={[
              { value: "", label: "All clients" },
              ...clients.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })),
            ]}
          />
        </div>
      </Card>

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
            title="Couldn't load invoices"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchInvoices(page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : invoices.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={hasFilters ? Search : FileText}
            title={hasFilters ? "No matching invoices" : "No invoices yet"}
            description={
              hasFilters
                ? "Try a different search term or clearing a filter."
                : "Invoices are generated automatically from completed visits, or created via the API."
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Invoice #</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Invoice Date</TableHeaderCell>
                <TableHeaderCell>Due Date</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      href={`/admin/billing/invoices/${invoice.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.client
                      ? `${invoice.client.first_name} ${invoice.client.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    €
                    {Number(invoice.total_amount || 0).toLocaleString("nl-NL", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={invoice.status}
                      label={invoice.status?.replace(/_/g, " ")}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.invoice_date).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.due_date).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="Actions"
                        >
                          <MoreHorizontal
                            className={ICON_SIZE.sm}
                            strokeWidth={ICON_STROKE_WIDTH}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => router.push(`/admin/billing/invoices/${invoice.id}`)}
                        >
                          <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            window.open(`/api/billing/invoices/${invoice.id}/pdf`, "_blank")
                          }
                        >
                          <Download className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total} invoice{total === 1 ? "" : "s"}
              </p>
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
