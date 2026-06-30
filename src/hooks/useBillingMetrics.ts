import { useEffect, useState, useCallback } from 'react';

interface FinancialMetrics {
  revenueToday: number;
  revenueThisMonth: number;
  outstandingAmount: number;
  overdueAmount: number;
  paidAmount: number;
  billableHours: number;
  invoicesDraft: number;
  invoicesSent: number;
  invoicesPaid: number;
}

export function useBillingMetrics(period: 'day' | 'month' | 'year' = 'month') {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await globalThis.fetch(`/api/billing/summary?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to fetch billing metrics');
      }

      const data = await response.json();
      setMetrics({
        revenueToday: data.summary.revenue_today,
        revenueThisMonth: data.summary.revenue_this_month,
        outstandingAmount: data.summary.outstanding_amount,
        overdueAmount: data.summary.overdue_amount,
        paidAmount: data.summary.paid_amount,
        billableHours: data.summary.billable_hours_month,
        invoicesDraft: data.summary.invoices_draft || 0,
        invoicesSent: data.summary.invoices_sent || 0,
        invoicesPaid: data.summary.invoices_paid || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
