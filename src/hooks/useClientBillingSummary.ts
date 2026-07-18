import { useEffect, useState, useCallback, useRef } from "react";

interface InvoiceData {
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  status: "draft" | "sent" | "paid" | "overdue" | "pending" | "partially_paid" | "cancelled";
}

interface ClientBillingSummary {
  clientId: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  invoicesDraft: number;
  invoicesSent: number;
  invoicesPaid: number;
  invoicesOverdue: number;
}

export function useClientBillingSummary(clientId: string) {
  const [summary, setSummary] = useState<ClientBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        clientId,
        limit: "1000",
        offset: "0",
      });

      const response = await globalThis.fetch(`/api/billing/invoices?${query}`);

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      const invoices: InvoiceData[] = data.data || [];

      let totalInvoiced = 0;
      let totalPaid = 0;
      let totalOutstanding = 0;
      let invoicesDraft = 0;
      let invoicesSent = 0;
      let invoicesPaid = 0;
      let invoicesOverdue = 0;

      invoices.forEach((inv: InvoiceData) => {
        totalInvoiced += inv.total_amount;
        totalPaid += inv.paid_amount;
        totalOutstanding += inv.remaining_balance;

        if (inv.status === "draft") invoicesDraft++;
        if (inv.status === "sent") invoicesSent++;
        if (inv.status === "paid") invoicesPaid++;
        if (inv.status === "overdue") invoicesOverdue++;
      });

      setSummary({
        clientId,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        invoiceCount: invoices.length,
        invoicesDraft,
        invoicesSent,
        invoicesPaid,
        invoicesOverdue,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchInvoices();
    }
  }, [fetchInvoices]);

  return { summary, loading, error, refetch: fetchInvoices };
}
