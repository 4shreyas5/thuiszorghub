"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Euro,
  TrendingUp,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Timer,
  FileText,
  Wallet,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface FinancialMetrics {
  revenueToday: number;
  revenueThisMonth: number;
  outstandingAmount: number;
  overdueAmount: number;
  paidAmount: number;
  billableHours: number;
}

interface StatusCounts {
  draft: number;
  pending: number;
  paid: number;
  overdue: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  client?: { first_name: string; last_name: string } | null;
}

const EMPTY_METRICS: FinancialMetrics = {
  revenueToday: 0,
  revenueThisMonth: 0,
  outstandingAmount: 0,
  overdueAmount: 0,
  paidAmount: 0,
  billableHours: 0,
};

export default function BillingPage() {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<FinancialMetrics>(EMPTY_METRICS);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    draft: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [generatingTimesheets, setGeneratingTimesheets] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, draftRes, pendingRes, paidRes, overdueRes, recentRes] = await Promise.all([
        fetch("/api/billing/summary?period=month"),
        fetch("/api/billing/invoices?status=draft&limit=1"),
        fetch("/api/billing/invoices?status=pending&limit=1"),
        fetch("/api/billing/invoices?status=paid&limit=1"),
        fetch("/api/billing/invoices?status=overdue&limit=1"),
        fetch("/api/billing/invoices?limit=5"),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setMetrics({
          revenueToday: data.summary.revenue_today,
          revenueThisMonth: data.summary.revenue_this_month,
          outstandingAmount: data.summary.outstanding_amount,
          overdueAmount: data.summary.overdue_amount,
          paidAmount: data.summary.paid_amount,
          billableHours: data.summary.billable_hours_month,
        });
      } else {
        setMetrics(EMPTY_METRICS);
      }

      const counts = { draft: 0, pending: 0, paid: 0, overdue: 0 };
      for (const [key, res] of [
        ["draft", draftRes],
        ["pending", pendingRes],
        ["paid", paidRes],
        ["overdue", overdueRes],
      ] as const) {
        if (res.ok) {
          const data = await res.json();
          counts[key] = data.pagination?.total || 0;
        }
      }
      setStatusCounts(counts);

      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentInvoices(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching billing overview:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchAll();
    });
  }, [fetchAll]);

  const handleGenerateInvoices = async () => {
    try {
      setGeneratingInvoices(true);
      const response = await fetch("/api/billing/invoices/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to generate invoices");
      addToast({ type: "success", message: "Invoices generated from completed visits" });
      await fetchAll();
    } catch {
      addToast({ type: "error", message: "Failed to generate invoices" });
    } finally {
      setGeneratingInvoices(false);
    }
  };

  const handleGenerateTimesheets = async () => {
    try {
      setGeneratingTimesheets(true);
      const response = await fetch("/api/billing/timesheets/from-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to generate timesheets");
      addToast({ type: "success", message: "Timesheets generated from completed visits" });
    } catch {
      addToast({ type: "error", message: "Failed to generate timesheets" });
    } finally {
      setGeneratingTimesheets(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Billing & Financial Management"
          description="Manage invoices, payments, and financial reporting."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    { title: "Revenue Today", value: metrics.revenueToday, icon: Euro },
    { title: "Revenue This Month", value: metrics.revenueThisMonth, icon: TrendingUp },
    { title: "Outstanding Amount", value: metrics.outstandingAmount, icon: Clock3 },
    { title: "Overdue Amount", value: metrics.overdueAmount, icon: AlertTriangle },
    { title: "Paid Amount", value: metrics.paidAmount, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Financial Management"
        description="Manage invoices, payments, and financial reporting."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => (
          <Card key={card.title} bordered padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  €{card.value.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <card.icon
                className={ICON_SIZE.lg + " text-muted-foreground"}
                strokeWidth={ICON_STROKE_WIDTH}
              />
            </div>
          </Card>
        ))}
        <Card bordered padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billable Hours (month)</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {metrics.billableHours.toLocaleString("nl-NL")}
              </p>
            </div>
            <Timer
              className={ICON_SIZE.lg + " text-muted-foreground"}
              strokeWidth={ICON_STROKE_WIDTH}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Button asChild variant="outline">
              <Link href="/admin/billing/invoices">
                <FileText className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                View Invoices
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/billing/payments">
                <Wallet className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                View Payments
              </Link>
            </Button>
            <Button onClick={handleGenerateInvoices} loading={generatingInvoices}>
              <Sparkles className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              Auto-Generate Invoices
            </Button>
            <Button
              variant="secondary"
              onClick={handleGenerateTimesheets}
              loading={generatingTimesheets}
            >
              <RefreshCw className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              Generate Timesheets
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Draft Invoices</span>
              <StatusBadge status="draft" size="sm" label={String(statusCounts.draft)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Pending Invoices</span>
              <StatusBadge status="pending" size="sm" label={String(statusCounts.pending)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Paid Invoices</span>
              <StatusBadge status="paid" size="sm" label={String(statusCounts.paid)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Overdue Invoices</span>
              <StatusBadge status="overdue" size="sm" label={String(statusCounts.overdue)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/admin/billing/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-accent/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.client
                          ? `${invoice.client.first_name} ${invoice.client.last_name}`
                          : "Unknown client"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      €
                      {Number(invoice.total_amount || 0).toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
