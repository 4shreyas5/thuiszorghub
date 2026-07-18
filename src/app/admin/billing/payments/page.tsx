"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, AlertTriangle, MoreHorizontal, Eye } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
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
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  invoice?: {
    id: string;
    invoice_number: string;
    client?: { first_name: string; last_name: string } | null;
  } | null;
}

const METHOD_OPTIONS = [
  { value: "", label: "All methods" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "sepa", label: "SEPA" },
  { value: "manual_entry", label: "Manual Entry" },
];

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [method, setMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const limit = 20;

  const fetchPayments = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setLoadError(null);
        const offset = (targetPage - 1) * limit;
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
        if (method) params.append("paymentMethod", method);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const response = await fetch(`/api/billing/payments?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch payments");

        setPayments(data.data || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load payments");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [method, startDate, endDate]
  );

  useEffect(() => {
    // Deferred to a microtask so these setState/fetch calls aren't synchronous within the effect body.
    queueMicrotask(() => {
      setPage(1);
      fetchPayments(1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, startDate, endDate]);

  useEffect(() => {
    queueMicrotask(() => {
      if (page > 1) fetchPayments(page);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const hasFilters = !!(method || startDate || endDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Records"
        description="Track all payment transactions and history."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card bordered padding="md">
          <p className="text-sm font-medium text-muted-foreground mb-2">Page Total</p>
          <p className="text-3xl font-bold text-foreground">
            €{totalAmount.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {payments.length} transactions on this page
          </p>
        </Card>
        <Card bordered padding="md">
          <p className="text-sm font-medium text-muted-foreground mb-2">Average Payment</p>
          <p className="text-3xl font-bold text-foreground">
            €
            {(payments.length > 0 ? totalAmount / payments.length : 0).toLocaleString("nl-NL", {
              minimumFractionDigits: 2,
            })}
          </p>
        </Card>
      </div>

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={METHOD_OPTIONS}
          />
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
            title="Couldn't load payments"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchPayments(page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : payments.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={Wallet}
            title={hasFilters ? "No matching payments" : "No payments yet"}
            description={
              hasFilters
                ? "Try clearing a filter."
                : "Payments recorded against invoices will appear here."
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Invoice</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Method</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Reference</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link
                      href={`/admin/billing/invoices/${payment.invoice?.id || ""}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {payment.invoice?.invoice_number || "N/A"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.invoice?.client
                      ? `${payment.invoice.client.first_name} ${payment.invoice.client.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    €{Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {payment.payment_method.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.reference_number || "—"}
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
                          onSelect={() =>
                            payment.invoice?.id &&
                            router.push(`/admin/billing/invoices/${payment.invoice.id}`)
                          }
                        >
                          <Eye className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                          View Invoice
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
                {total} payment{total === 1 ? "" : "s"}
              </p>
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
