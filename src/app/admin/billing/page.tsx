'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { useSession } from '@/hooks/useSession';

interface FinancialMetrics {
  revenueToday: number;
  revenueThisMonth: number;
  outstandingAmount: number;
  overdueAmount: number;
  paidAmount: number;
  billableHours: number;
}

export default function BillingPage() {
  const { isAuthenticated, isLoading } = useSession();
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    revenueToday: 0,
    revenueThisMonth: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    paidAmount: 0,
    billableHours: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleGenerateInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to generate invoices');
      await fetchMetrics();
      alert('Invoices generated successfully!');
    } catch (error) {
      console.error('Error generating invoices:', error);
      alert('Failed to generate invoices');
    }
  };

  const handleGenerateTimesheets = async () => {
    try {
      const response = await fetch('/api/billing/timesheets/from-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to generate timesheets');
      alert('Timesheets generated successfully!');
    } catch (error) {
      console.error('Error generating timesheets:', error);
      alert('Failed to generate timesheets');
    }
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/summary?period=month');
      if (!response.ok) throw new Error('Failed to fetch billing summary');
      const data = await response.json();
      setMetrics({
        revenueToday: data.summary.revenue_today,
        revenueThisMonth: data.summary.revenue_this_month,
        outstandingAmount: data.summary.outstanding_amount,
        overdueAmount: data.summary.overdue_amount,
        paidAmount: data.summary.paid_amount,
        billableHours: data.summary.billable_hours_month,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics({
        revenueToday: 0,
        revenueThisMonth: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        paidAmount: 0,
        billableHours: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchMetrics();
    }
  }, [isAuthenticated, isLoading, fetchMetrics]);

  if (isLoading || loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Financial Management"
        description="Manage invoices, payments, and financial reporting"
      />

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Revenue Today"
          value={`€${metrics.revenueToday.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          icon="💰"
          color="bg-green-50"
        />
        <MetricCard
          title="Revenue This Month"
          value={`€${metrics.revenueThisMonth.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          icon="📊"
          color="bg-blue-50"
        />
        <MetricCard
          title="Outstanding Amount"
          value={`€${metrics.outstandingAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          icon="⏳"
          color="bg-yellow-50"
        />
        <MetricCard
          title="Overdue Amount"
          value={`€${metrics.overdueAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          icon="⚠️"
          color="bg-red-50"
        />
        <MetricCard
          title="Paid Amount"
          value={`€${metrics.paidAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          icon="✓"
          color="bg-emerald-50"
        />
        <MetricCard
          title="Billable Hours"
          value={`${metrics.billableHours.toLocaleString('nl-NL')}`}
          icon="⏱️"
          color="bg-purple-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/admin/billing/invoices"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Invoices
          </a>
          <a
            href="/admin/billing/payments"
            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Record Payment
          </a>
          <button
            onClick={handleGenerateInvoices}
            className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Auto-Generate Invoices
          </button>
          <button
            onClick={handleGenerateTimesheets}
            className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Generate Timesheets
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <div className="space-y-3">
            <StatusRow label="Draft Invoices" count={12} color="gray" />
            <StatusRow label="Pending Invoices" count={8} color="yellow" />
            <StatusRow label="Paid Invoices" count={156} color="green" />
            <StatusRow label="Overdue Invoices" count={3} color="red" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
          <div className="space-y-3">
            <RevenueRow client="Amsterdam Care Center" amount={8500} />
            <RevenueRow client="Rotterdam Homecare" amount={6200} />
            <RevenueRow client="Utrecht Medical Services" amount={5100} />
            <RevenueRow client="Den Haag Health" amount={4300} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function StatusRow({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClass = {
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  }[color];

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        {count}
      </span>
    </div>
  );
}

function RevenueRow({ client, amount }: { client: string; amount: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{client}</span>
      <span className="text-gray-900 font-semibold">€{amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
    </div>
  );
}
