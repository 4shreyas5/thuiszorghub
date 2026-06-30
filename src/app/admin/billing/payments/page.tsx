'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { useSession } from '@/hooks/useSession';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  referenceNumber: string;
  invoice?: {
    invoice_number: string;
    client?: {
      name: string;
    };
  };
}

export default function PaymentsPage() {
  const { isAuthenticated, isLoading } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    method: '',
    startDate: '',
    endDate: '',
  });

  const limit = 15;

  const fetchPayments = useCallback(async () => {
    try {
      const offset = (page - 1) * limit;
      const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (filter.method) {
        query.append('paymentMethod', filter.method);
      }
      if (filter.startDate) {
        query.append('startDate', filter.startDate);
      }
      if (filter.endDate) {
        query.append('endDate', filter.endDate);
      }

      const response = await fetch(`/api/billing/payments?${query}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchPayments();
    }
  }, [isAuthenticated, isLoading, fetchPayments]);

  const methodColors: Record<string, string> = {
    bank_transfer: 'bg-blue-100 text-blue-800',
    cash: 'bg-green-100 text-green-800',
    card: 'bg-purple-100 text-purple-800',
    sepa: 'bg-orange-100 text-orange-800',
    manual_entry: 'bg-gray-100 text-gray-800',
  };

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  if (isLoading || loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Records"
        description="Track all payment transactions and history"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Payments</p>
          <p className="text-3xl font-bold text-gray-900">
            €{totalPayments.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-2">{payments.length} transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Average Payment</p>
          <p className="text-3xl font-bold text-gray-900">
            €
            {payments.length > 0
              ? (totalPayments / payments.length).toLocaleString('nl-NL', {
                  minimumFractionDigits: 2,
                })
              : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Page Total</p>
          <p className="text-3xl font-bold text-blue-600">
            €
            {(
              payments.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
            ).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={filter.method}
              onChange={(e) => {
                setFilter({ ...filter, method: e.target.value });
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="sepa">SEPA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => {
                setFilter({ ...filter, startDate: e.target.value });
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => {
                setFilter({ ...filter, endDate: e.target.value });
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Method
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/billing/invoices/${(payment.invoice as any)?.id || '#'}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {(payment.invoice as any)?.invoice_number || 'N/A'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    €{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        methodColors[payment.paymentMethod] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {payment.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(payment.paymentDate).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {payment.referenceNumber || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-gray-400 hover:text-gray-600">⋯</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="text-sm text-gray-600">
          Showing {Math.min((page - 1) * limit + 1, total)} to{' '}
          {Math.min(page * limit, total)} of {total} payments
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page * limit >= total}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
