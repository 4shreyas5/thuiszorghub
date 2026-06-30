'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { useSession } from '@/hooks/useSession';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  branchId: string;
  invoiceDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  vatAmount: number;
  vatPercentage: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: string;
  notes: string;
  items: InvoiceItem[];
  payments: Payment[];
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  branch: {
    id: string;
    name: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  rateType: string;
  vatPercentage: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  visitId: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  status: string;
  notes: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { isAuthenticated, isLoading } = useSession();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [statusDropdown, setStatusDropdown] = useState('');

  const fetchInvoice = useCallback(async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const data = await response.json();
      setInvoice(data);
      setStatusDropdown(data.status);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchInvoice();
    }
  }, [isAuthenticated, isLoading, fetchInvoice]);

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;

    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          changedReason: 'Status changed from admin panel',
        }),
      });

      if (!response.ok) throw new Error('Failed to update invoice');
      setStatusDropdown(newStatus);
      setInvoice({ ...invoice, status: newStatus });
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      const response = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: parseFloat(paymentAmount),
          paymentDate: new Date(),
          paymentMethod,
          referenceNumber: paymentRef,
        }),
      });

      if (!response.ok) throw new Error('Failed to record payment');

      setPaymentAmount('');
      setPaymentRef('');
      setShowPaymentForm(false);
      await fetchInvoice();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  if (isLoading || loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoice Not Found" description="The invoice could not be found" />
      </div>
    );
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

  const clientName = `${invoice.client.first_name} ${invoice.client.last_name}`;
  const daysOverdue =
    invoice.status === 'overdue'
      ? Math.floor(
          (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <PageHeader
            title={`Invoice ${invoice.invoiceNumber}`}
            description={`For ${clientName}`}
          />
        </div>
        <Link
          href="/admin/billing/invoices"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Invoices
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Invoice Date</h3>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(invoice.invoiceDate).toLocaleDateString('nl-NL')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Due Date</h3>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(invoice.dueDate).toLocaleDateString('nl-NL')}
            </p>
            {daysOverdue > 0 && (
              <p className="text-sm text-red-600 mt-1">{daysOverdue} days overdue</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Status</h3>
            <select
              value={statusDropdown}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${
                statusColors[statusDropdown] || 'bg-gray-100 text-gray-800'
              }`}
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Client Name</p>
                <p className="font-medium text-gray-900">{clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{invoice.client.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{invoice.client.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-medium text-gray-900">{invoice.branch.name}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {item.quantity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      €{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      €{item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">
                  €{invoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({invoice.vatPercentage}%)</span>
                <span className="text-gray-900 font-medium">
                  €{invoice.vatAmount.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  €{invoice.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between bg-green-50 px-3 py-2 rounded">
                <span className="font-semibold text-green-900">Paid</span>
                <span className="font-bold text-green-900">
                  €{invoice.paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between bg-blue-50 px-3 py-2 rounded">
                <span className="font-semibold text-blue-900">Outstanding</span>
                <span className="font-bold text-blue-900">
                  €{invoice.remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Record Payment Button */}
          {invoice.remainingBalance > 0 && (
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              {showPaymentForm ? 'Cancel' : 'Record Payment'}
            </button>
          )}

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Record Payment</h3>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Max €{invoice.remainingBalance.toFixed(2)})
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={invoice.remainingBalance}
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="sepa">SEPA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Reference number"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Record Payment
                </button>
              </form>
            </div>
          )}

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center text-sm border-b pb-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        €{payment.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString('nl-NL')} •{' '}
                        {payment.paymentMethod}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
