'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { useSession } from '@/hooks/useSession';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  totalAmount: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
}

export default function InvoicesPage() {
  const { isAuthenticated, isLoading } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = 10;

  const fetchInvoices = useCallback(async () => {
    try {
      const offset = (page - 1) * limit;
      const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/billing/invoices?${query}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchInvoices();
    }
  }, [isAuthenticated, isLoading, fetchInvoices]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isLoading || loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    sent: 'bg-cyan-100 text-cyan-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-300 text-gray-900',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage all invoices and billing documents"
      />

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by invoice number..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    €{invoice.totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[invoice.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {invoice.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(invoice.invoiceDate).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(invoice.dueDate).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/billing/invoices/${invoice.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </Link>
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
          Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} invoices
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
