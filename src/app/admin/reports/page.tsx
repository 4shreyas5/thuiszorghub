'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { useSession } from '@/hooks/useSession';
import {
  useOperationalReport,
  useFinancialReport,
  useEmployeeReport,
  useClientReport,
  useCarePlanReport,
} from '@/hooks/useReports';
import { subDays } from 'date-fns';
import { Download } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type ReportTab = 'operational' | 'financial' | 'employees' | 'clients' | 'careplans';
type DateRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

interface ReportFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
  employeeId?: string;
  clientId?: string;
  visitType?: string;
  status?: string;
  insuranceProvider?: string;
  municipality?: string;
  riskLevel?: string;
}

export default function ReportsPage() {
  const { isLoading } = useSession();
  const [activeTab, setActiveTab] = useState<ReportTab>('operational');
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch all reports
  const operationalReport = useOperationalReport(filters);
  const financialReport = useFinancialReport(filters);
  const employeeReport = useEmployeeReport(filters);
  const clientReport = useClientReport(filters);
  const carePlanReport = useCarePlanReport(filters);

  useEffect(() => {
    const now = new Date();
    let startDate = now;

    switch (dateRange) {
      case 'today':
        startDate = now;
        break;
      case 'yesterday':
        startDate = subDays(now, 1);
        break;
      case 'last7':
        startDate = subDays(now, 7);
        break;
      case 'last30':
        startDate = subDays(now, 30);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
    }

    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    }));
  }, [dateRange]);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      let reportData;

      switch (activeTab) {
        case 'operational':
          reportData = { data: operationalReport.data };
          break;
        case 'financial':
          reportData = { data: financialReport.data };
          break;
        case 'employees':
          reportData = { data: employeeReport.data };
          break;
        case 'clients':
          reportData = { data: clientReport.data };
          break;
        case 'careplans':
          reportData = { data: carePlanReport.data };
          break;
        default:
          return;
      }

      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: activeTab,
          format,
          filters,
          data: reportData,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive reporting and analytics dashboard"
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {activeTab === 'operational' && operationalReport.data && (
          <>
            <KPICard
              title="Total Visits"
              value={operationalReport.data.totalScheduled}
              icon="📅"
            />
            <KPICard
              title="Completion %"
              value={`${operationalReport.data.completionRate.toFixed(1)}%`}
              icon="✓"
            />
            <KPICard
              title="Completed"
              value={operationalReport.data.completed}
              icon="👤"
            />
            <KPICard
              title="Cancelled"
              value={operationalReport.data.cancelled}
              icon="❌"
            />
            <KPICard
              title="Avg Duration"
              value={`${operationalReport.data.avgDuration.toFixed(0)}m`}
              icon="⏱️"
            />
          </>
        )}

        {activeTab === 'financial' && financialReport.data && (
          <>
            <KPICard
              title="Total Revenue"
              value={`€${financialReport.data.totalRevenue.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon="💰"
            />
            <KPICard
              title="Total Paid"
              value={`€${financialReport.data.totalPaid.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon="✓"
            />
            <KPICard
              title="Outstanding"
              value={`€${financialReport.data.totalOutstanding.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon="⏳"
            />
            <KPICard
              title="Overdue"
              value={`€${financialReport.data.overdueAmount.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon="⚠️"
            />
            <KPICard
              title="Invoices"
              value={financialReport.data.invoiceCount}
              icon="📄"
            />
          </>
        )}

        {activeTab === 'employees' && employeeReport.data && (
          <>
            <KPICard
              title="Active Employees"
              value={employeeReport.data.summary.activeEmployees}
              icon="👥"
            />
            <KPICard
              title="Billable Hours"
              value={employeeReport.data.summary.totalBillableHours.toFixed(0)}
              icon="⏱️"
            />
            <KPICard
              title="Completed Visits"
              value={employeeReport.data.summary.totalCompletedVisits}
              icon="✓"
            />
            <KPICard
              title="Avg Utilization"
              value={`${employeeReport.data.summary.avgUtilizationPercent.toFixed(1)}%`}
              icon="📊"
            />
            <KPICard
              title="Total Revenue"
              value={`€${Object.values(employeeReport.data.employeeMetrics).reduce((sum: number, e: any) => sum + (e.totalRevenue || 0), 0).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon="💰"
            />
          </>
        )}

        {activeTab === 'clients' && clientReport.data && (
          <>
            <KPICard
              title="Active Clients"
              value={clientReport.data.summary.activeClients}
              icon="👤"
            />
            <KPICard
              title="Total Invoiced"
              value={`€${clientReport.data.summary.totalInvoiced.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon="💰"
            />
            <KPICard
              title="Total Outstanding"
              value={`€${clientReport.data.summary.totalOutstanding.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`}
              icon="⏳"
            />
            <KPICard
              title="Completed Visits"
              value={clientReport.data.summary.completedVisits}
              icon="✓"
            />
            <KPICard
              title="Active Care Plans"
              value={clientReport.data.summary.activePlans}
              icon="📋"
            />
          </>
        )}

        {activeTab === 'careplans' && carePlanReport.data && (
          <>
            <KPICard
              title="Total Plans"
              value={carePlanReport.data.summary.totalPlans}
              icon="📋"
            />
            <KPICard
              title="Active Plans"
              value={carePlanReport.data.summary.activePlans}
              icon="📖"
            />
            <KPICard
              title="Goals Completed"
              value={carePlanReport.data.summary.completedGoals}
              icon="🎯"
            />
            <KPICard
              title="Tasks Completed"
              value={carePlanReport.data.summary.completedTasks}
              icon="✓"
            />
            <KPICard
              title="Review Compliance"
              value={`${carePlanReport.data.summary.reviewCompliancePercent.toFixed(1)}%`}
              icon="📊"
            />
          </>
        )}
      </div>

      {/* Tabs and Content */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 flex">
          {(['operational', 'financial', 'employees', 'clients', 'careplans'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Export Buttons */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              disabled={activeTab === 'operational' && operationalReport.loading || activeTab === 'financial' && financialReport.loading || activeTab === 'employees' && employeeReport.loading || activeTab === 'clients' && clientReport.loading || activeTab === 'careplans' && carePlanReport.loading}
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              disabled={activeTab === 'operational' && operationalReport.loading || activeTab === 'financial' && financialReport.loading || activeTab === 'employees' && employeeReport.loading || activeTab === 'clients' && clientReport.loading || activeTab === 'careplans' && carePlanReport.loading}
            >
              <Download size={16} />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              disabled={activeTab === 'operational' && operationalReport.loading || activeTab === 'financial' && financialReport.loading || activeTab === 'employees' && employeeReport.loading || activeTab === 'clients' && clientReport.loading || activeTab === 'careplans' && carePlanReport.loading}
            >
              <Download size={16} />
              PDF
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'operational' && <OperationalContent data={operationalReport.data} loading={operationalReport.loading} />}
          {activeTab === 'financial' && <FinancialContent data={financialReport.data} loading={financialReport.loading} />}
          {activeTab === 'employees' && <EmployeeContent data={employeeReport.data} loading={employeeReport.loading} />}
          {activeTab === 'clients' && <ClientContent data={clientReport.data} loading={clientReport.loading} />}
          {activeTab === 'careplans' && <CarePlanContent data={carePlanReport.data} loading={carePlanReport.loading} />}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-2xl mt-2">{icon}</p>
    </div>
  );
}

function OperationalContent({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!data) return <div>No data available</div>;

  const chartData = Object.entries(data.visitsByDay || {})
    .map(([date, count]) => ({ date, visits: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Visits Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="visits" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completed', value: data.completed },
                  { name: 'Cancelled', value: data.cancelled },
                  { name: 'No Show', value: data.noShows },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">By Branch</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(data.visitsByBranch || {}).map(([branch, count]) => ({ branch, visits: count }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="branch" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="visits" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FinancialContent({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!data) return <div>No data available</div>;

  const agingData = Object.entries(data.invoiceAging || {})
    .map(([range, amount]) => ({ range, amount }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Invoice Aging</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value}`} />
              <Bar dataKey="amount" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(data.statusDistribution || {}).map(([status, count]) => ({ name: status, value: count }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#3b82f6" />
                <Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EmployeeContent({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!data) return <div>No data available</div>;

  const employeeData = Object.entries(data.employeeMetrics || {})
    .map(([, emp]: [string, any]) => ({ name: emp.name, hours: emp.billableHours, revenue: emp.totalRevenue }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Top Employees by Billable Hours</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={employeeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="hours" fill="#3b82f6" name="Billable Hours" />
            <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue (€)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-gray-700">Name</th>
              <th className="px-4 py-2 text-right text-gray-700">Billable Hours</th>
              <th className="px-4 py-2 text-right text-gray-700">Visits</th>
              <th className="px-4 py-2 text-right text-gray-700">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.employeeMetrics || {}).map(([, emp]: [string, any]) => (
              <tr key={emp.name} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{emp.name}</td>
                <td className="px-4 py-2 text-right">{emp.billableHours}</td>
                <td className="px-4 py-2 text-right">{emp.completedVisits}</td>
                <td className="px-4 py-2 text-right">€{emp.totalRevenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClientContent({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Risk Level Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={Object.entries(data.summary.riskDistribution || {}).map(([level, count]) => ({ name: level, value: count }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-gray-700">Client</th>
              <th className="px-4 py-2 text-center text-gray-700">Risk</th>
              <th className="px-4 py-2 text-right text-gray-700">Visits</th>
              <th className="px-4 py-2 text-right text-gray-700">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.clientMetrics || {}).map(([, client]: [string, any]) => (
              <tr key={client.name} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{client.name}</td>
                <td className="px-4 py-2 text-center">{client.riskLevel}</td>
                <td className="px-4 py-2 text-right">{client.completedVisits}</td>
                <td className="px-4 py-2 text-right">€{client.outstanding.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CarePlanContent({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!data) return <div>No data available</div>;

  const statusData = Object.entries(data.summary.statusDistribution || {})
    .map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Goals Progress</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{
                    width: `${(data.summary.completedGoals / (data.summary.totalGoals || 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.completedGoals} of {data.summary.totalGoals} completed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Active Plans" value={data.summary.activePlans} />
        <StatBox label="Total Goals" value={data.summary.totalGoals} />
        <StatBox label="Total Tasks" value={data.summary.totalTasks} />
        <StatBox label="Compliance" value={`${data.summary.reviewCompliancePercent.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
