"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  vat_amount: number;
  vat_percentage: number;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  status: string;
  notes: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  client: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  branch: { name: string } | null;
}

interface AuditEntry {
  id: string;
  action: string;
  created_at: string;
  user?: { first_name: string; last_name: string } | null;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "sepa", label: "SEPA" },
  { value: "manual_entry", label: "Manual Entry" },
];

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { addToast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [now] = useState(() => Date.now());

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch(`/api/billing/invoices/${invoiceId}`);
      if (!response.ok) throw new Error("Failed to fetch invoice");
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchInvoice();
    });
  }, [fetchInvoice]);

  useEffect(() => {
    fetch(`/api/audit-logs?entityType=invoices&entityId=${invoiceId}&limit=20`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.data && setAuditEntries(d.data))
      .catch(() => {});
  }, [invoiceId]);

  const applyStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          changedReason: "Status changed from admin panel",
        }),
      });
      if (!response.ok) throw new Error("Failed to update invoice status");
      setInvoice({ ...invoice, status: newStatus });
      addToast({ type: "success", message: "Invoice status updated" });
    } catch {
      addToast({ type: "error", message: "Failed to update invoice status" });
    } finally {
      setUpdatingStatus(false);
      setPendingStatus(null);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "cancelled") {
      setPendingStatus(newStatus);
      return;
    }
    applyStatusChange(newStatus);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      setRecordingPayment(true);
      const response = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: parseFloat(paymentAmount),
          paymentDate: new Date(),
          paymentMethod,
          referenceNumber: paymentRef || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to record payment");
      }

      setPaymentAmount("");
      setPaymentRef("");
      setShowPaymentForm(false);
      addToast({ type: "success", message: "Payment recorded" });
      await fetchInvoice();
    } catch (error) {
      addToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to record payment",
      });
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoice" description="Loading invoice details..." />
        <Card bordered padding="md" className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (loadError || !invoice) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoice" description="" />
        <Card bordered padding="md">
          <EmptyState
            tone={loadError ? "error" : undefined}
            icon={AlertTriangle}
            title={loadError ? "Couldn't load invoice" : "Invoice not found"}
            description={loadError || "This invoice may have been removed."}
            action={
              loadError ? (
                <Button variant="outline" onClick={fetchInvoice}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        </Card>
      </div>
    );
  }

  const clientName = invoice.client
    ? `${invoice.client.first_name} ${invoice.client.last_name}`
    : "Unknown client";
  const isOverdue = invoice.status === "overdue";
  const daysOverdue = isOverdue
    ? Math.floor((now - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={`Invoice ${invoice.invoice_number}`} description={`For ${clientName}`} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/api/billing/invoices/${invoice.id}/pdf`, "_blank")}
          >
            <Download className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            Download PDF
          </Button>
          <Link
            href="/admin/billing/invoices"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            Back to Invoices
          </Link>
        </div>
      </div>

      <Card bordered padding="md">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Invoice Date</p>
            <p className="text-lg font-semibold text-foreground">
              {new Date(invoice.invoice_date).toLocaleDateString("nl-NL")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Due Date</p>
            <p className="text-lg font-semibold text-foreground">
              {new Date(invoice.due_date).toLocaleDateString("nl-NL")}
            </p>
            {isOverdue && <p className="text-sm text-danger mt-1">{daysOverdue} days overdue</p>}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <div className="flex items-center gap-2">
              <StatusBadge
                status={invoice.status}
                label={invoice.status.replace(/_/g, " ")}
                size="sm"
              />
              <Select
                value={invoice.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={STATUS_OPTIONS}
                disabled={updatingStatus}
                className="w-40"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client Name</p>
                  <p className="font-medium text-foreground">{clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{invoice.client?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{invoice.client?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <p className="font-medium text-foreground">{invoice.branch?.name || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.items.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No line items" description="This invoice has no line items." />
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow hover={false}>
                      <TableHeaderCell>Description</TableHeaderCell>
                      <TableHeaderCell className="text-right">Qty</TableHeaderCell>
                      <TableHeaderCell className="text-right">Rate</TableHeaderCell>
                      <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{Number(item.quantity).toFixed(2)}</TableCell>
                        <TableCell align="right">€{Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell align="right" className="font-medium text-foreground">
                          €{Number(item.total_amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {auditEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {auditEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-foreground capitalize">
                        {entry.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("nl-NL")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  €{Number(invoice.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({invoice.vat_percentage}%)</span>
                <span className="font-medium text-foreground">
                  €{Number(invoice.vat_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  €{Number(invoice.total_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between rounded bg-success/10 px-3 py-2">
                <span className="font-semibold text-success">Paid</span>
                <span className="font-bold text-success">
                  €{Number(invoice.paid_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between rounded bg-info/10 px-3 py-2">
                <span className="font-semibold text-info">Outstanding</span>
                <span className="font-bold text-info">
                  €{Number(invoice.remaining_balance).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {invoice.remaining_balance > 0 && (
            <Button className="w-full" onClick={() => setShowPaymentForm((v) => !v)}>
              {showPaymentForm ? "Cancel" : "Record Payment"}
            </Button>
          )}

          {showPaymentForm && (
            <Card>
              <CardHeader>
                <CardTitle>Record Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <Input
                    label={`Amount (max €${Number(invoice.remaining_balance).toFixed(2)})`}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={invoice.remaining_balance}
                    step="0.01"
                    required
                  />
                  <Select
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={PAYMENT_METHODS}
                  />
                  <Input
                    label="Reference (optional)"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Reference number"
                  />
                  <Button type="submit" className="w-full" loading={recordingPayment}>
                    Record Payment
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          €{Number(payment.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString("nl-NL")} ·{" "}
                          {payment.payment_method.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingStatus !== null}
        title="Cancel invoice?"
        message="This marks the invoice as cancelled. It will stay visible in the invoice list but will no longer count toward outstanding revenue."
        confirmLabel="Cancel Invoice"
        variant="danger"
        isLoading={updatingStatus}
        onConfirm={() => pendingStatus && applyStatusChange(pendingStatus)}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
