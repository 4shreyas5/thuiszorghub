'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { useSession } from '@/hooks/useSession';

interface Timesheet {
  id: string;
  visitDate: string;
  billableHours: number;
  nightHours: number;
  weekendHours: number;
  holidayHours: number;
  hourlyRate: number;
  isBilled: boolean;
  employee?: {
    first_name: string;
    last_name: string;
  };
  client?: {
    first_name: string;
    last_name: string;
  };
  visit?: {
    title: string;
    visit_type: string;
  };
}

export default function TimesheetsPage() {
  const { isAuthenticated, isLoading } = useSession();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    isBilled: '',
    startDate: '',
    endDate: '',
  });

  const limit = 20;

  const fetchTimesheets = useCallback(async () => {
    try {
      const offset = (page - 1) * limit;
      const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (filter.isBilled) {
        query.append('isBilled', filter.isBilled === 'true' ? 'true' : 'false');
      }
      if (filter.startDate) {
        query.append('startDate', filter.startDate);
      }
      if (filter.endDate) {
        query.append('endDate', filter.endDate);
      }

      const response = await fetch(`/api/billing/timesheets?${query}`);
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchTimesheets();
    }
  }, [isAuthenticated, isLoading, fetchTimesheets]);

  const totalBillableHours = timesheets.reduce((sum, ts) => sum + ts.billableHours, 0);
  const totalRevenue = timesheets.reduce(
    (sum, ts) => sum + ts.billableHours * ts.hourlyRate,
    0
  );

  if (isLoading || loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const unbilledCount = timesheets.filter((ts) => !ts.isBilled).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheets"
        description="Track billable hours and employee time entries"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Billable Hours</p>
          <p className="text-3xl font-bold text-gray-900">
            {totalBillableHours.toFixed(1)}h
          </p>
          <p className="text-xs text-gray-500 mt-2">{timesheets.length} entries</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Estimated Revenue</p>
          <p className="text-3xl font-bold text-green-600">
            €{totalRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Unbilled</p>
          <p className="text-3xl font-bold text-orange-600">{unbilledCount}</p>
          <p className="text-xs text-gray-500 mt-2">entries waiting to invoice</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Status
            </label>
            <select
              value={filter.isBilled}
              onChange={(e) => {
                setFilter({ ...filter, isBilled: e.target.value });
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All</option>
              <option value="false">Unbilled</option>
              <option value="true">Billed</option>
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

      {/* Timesheets Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Client
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Billable Hours
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Rate
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                Billed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No timesheets found
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(ts.visitDate).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ts.employee
                      ? `${ts.employee.first_name} ${ts.employee.last_name}`
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ts.client
                      ? `${ts.client.first_name} ${ts.client.last_name}`
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {ts.billableHours.toFixed(2)}h
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    €{ts.hourlyRate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    €{(ts.billableHours * ts.hourlyRate).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ts.isBilled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {ts.isBilled ? 'Yes' : 'No'}
                    </span>
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
          {Math.min(page * limit, total)} of {total} timesheets
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
