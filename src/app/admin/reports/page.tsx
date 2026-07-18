"use client";

import { useEffect, useState, useMemo } from "react";
import { subDays } from "date-fns";
import {
  Download,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Timer,
  Euro,
  Clock3,
  BarChart3,
  Users,
  FileText,
  ClipboardList,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import {
  useOperationalReport,
  useFinancialReport,
  useEmployeeReport,
  useClientReport,
  useCarePlanReport,
  useBranchReport,
} from "@/hooks/useReports";

type ReportTab = "operational" | "financial" | "employees" | "clients" | "careplans" | "branch";
type DateRange = "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth" | "custom";

interface ReportFilters {
  startDate: string;
  endDate: string;
  branchId?: string | undefined;
  employeeId?: string | undefined;
  clientId?: string | undefined;
}

interface EmployeeMetricItem {
  name: string;
  billableHours: number;
  totalRevenue: number;
  completedVisits: number;
}

interface ClientMetricItem {
  name: string;
  riskLevel: string;
  completedVisits: number;
  outstanding: number;
}

interface BranchMetricItem {
  branchName: string;
  employeeCount: number;
  clientCount: number;
  visitCount: number;
  totalRevenue: number;
  billableHours: number;
  averageHourlyRate: number;
}

interface Option {
  id: string;
  first_name: string;
  last_name: string;
}

interface Branch {
  id: string;
  name: string;
}

const TABS: { value: ReportTab; label: string }[] = [
  { value: "operational", label: "Operational" },
  { value: "financial", label: "Financial" },
  { value: "employees", label: "Employees" },
  { value: "clients", label: "Clients" },
  { value: "careplans", label: "Care Plans" },
  { value: "branch", label: "Branch" },
];

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom" },
];

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export default function ReportsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportTab>("operational");
  const [dateRange, setDateRange] = useState<DateRange>("thisMonth");
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [exporting, setExporting] = useState(false);

  const operationalReport = useOperationalReport(filters);
  const financialReport = useFinancialReport(filters);
  const employeeReport = useEmployeeReport(filters);
  const clientReport = useClientReport(filters);
  const carePlanReport = useCarePlanReport(filters);
  const branchReport = useBranchReport(filters);

  useEffect(() => {
    // Deferred to a microtask so the setFilters call isn't synchronous within the effect body.
    queueMicrotask(() => {
      if (dateRange === "custom") return;
      const now = new Date();
      let startDate = now;

      switch (dateRange) {
        case "today":
          startDate = now;
          break;
        case "yesterday":
          startDate = subDays(now, 1);
          break;
        case "last7":
          startDate = subDays(now, 7);
          break;
        case "last30":
          startDate = subDays(now, 30);
          break;
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
      }

      setFilters((prev) => ({
        ...prev,
        startDate: startDate.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
      }));
    });
  }, [dateRange]);

  useEffect(() => {
    fetch("/api/branches?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d?.branches || d;
        if (Array.isArray(list)) setBranches(list);
      })
      .catch(() => {});
    fetch("/api/employees?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.employees && setEmployees(d.employees))
      .catch(() => {});
    fetch("/api/clients?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.clients && setClients(d.clients))
      .catch(() => {});
  }, []);

  const activeReport = {
    operational: operationalReport,
    financial: financialReport,
    employees: employeeReport,
    clients: clientReport,
    careplans: carePlanReport,
    branch: branchReport,
  }[activeTab];

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      setExporting(true);
      const reportData = { data: activeReport.data };

      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: activeTab, format, filters, data: reportData }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Excel export has no real .xlsx-writing library behind it - see
      // src/app/api/reports/export/route.ts - so it's named .csv too rather
      // than lying about the file's actual format.
      const extension = format === "pdf" ? "pdf" : "csv";
      a.download = `${activeTab}-${new Date().toISOString().split("T")[0]}.${extension}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      addToast({ type: "error", message: "Failed to export report" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive reporting and analytics dashboard."
      />

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            options={DATE_RANGE_OPTIONS}
          />
          <Input
            label="From"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="To"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Branch"
            value={filters.branchId || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, branchId: e.target.value || undefined }))
            }
            options={[
              { value: "", label: "All branches" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <Select
            label="Employee"
            value={filters.employeeId || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, employeeId: e.target.value || undefined }))
            }
            options={[
              { value: "", label: "All employees" },
              ...employees.map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` })),
            ]}
          />
          <Select
            label="Client"
            value={filters.clientId || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, clientId: e.target.value || undefined }))
            }
            options={[
              { value: "", label: "All clients" },
              ...clients.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })),
            ]}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {activeTab === "operational" && operationalReport.data && (
          <>
            <KPICard
              title="Total Visits"
              value={operationalReport.data.totalScheduled}
              icon={CalendarDays}
            />
            <KPICard
              title="Completion %"
              value={`${operationalReport.data.completionRate.toFixed(1)}%`}
              icon={CheckCircle2}
            />
            <KPICard
              title="Completed"
              value={operationalReport.data.completed}
              icon={CheckCircle2}
            />
            <KPICard title="Cancelled" value={operationalReport.data.cancelled} icon={XCircle} />
            <KPICard
              title="Avg Duration"
              value={`${operationalReport.data.avgDuration.toFixed(0)}m`}
              icon={Timer}
            />
          </>
        )}
        {activeTab === "financial" && financialReport.data && (
          <>
            <KPICard
              title="Total Revenue"
              value={`€${financialReport.data.totalRevenue.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={Euro}
            />
            <KPICard
              title="Total Paid"
              value={`€${financialReport.data.totalPaid.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={CheckCircle2}
            />
            <KPICard
              title="Outstanding"
              value={`€${financialReport.data.totalOutstanding.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={Clock3}
            />
            <KPICard
              title="Overdue"
              value={`€${financialReport.data.overdueAmount.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={AlertTriangle}
            />
            <KPICard title="Invoices" value={financialReport.data.invoiceCount} icon={FileText} />
          </>
        )}
        {activeTab === "employees" && employeeReport.data && (
          <>
            <KPICard
              title="Active Employees"
              value={employeeReport.data.summary.activeEmployees}
              icon={Users}
            />
            <KPICard
              title="Billable Hours"
              value={employeeReport.data.summary.totalBillableHours.toFixed(0)}
              icon={Timer}
            />
            <KPICard
              title="Completed Visits"
              value={employeeReport.data.summary.totalCompletedVisits}
              icon={CheckCircle2}
            />
            <KPICard
              title="Avg Utilization"
              value={`${employeeReport.data.summary.avgUtilizationPercent.toFixed(1)}%`}
              icon={BarChart3}
            />
            <KPICard
              title="Total Revenue"
              value={`€${Object.values(employeeReport.data.employeeMetrics)
                .reduce(
                  (sum: number, e: unknown) => sum + ((e as EmployeeMetricItem).totalRevenue || 0),
                  0
                )
                .toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={Euro}
            />
          </>
        )}
        {activeTab === "clients" && clientReport.data && (
          <>
            <KPICard
              title="Active Clients"
              value={clientReport.data.summary.activeClients}
              icon={Users}
            />
            <KPICard
              title="Total Invoiced"
              value={`€${clientReport.data.summary.totalInvoiced.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={Euro}
            />
            <KPICard
              title="Total Outstanding"
              value={`€${clientReport.data.summary.totalOutstanding.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={Clock3}
            />
            <KPICard
              title="Completed Visits"
              value={clientReport.data.summary.completedVisits}
              icon={CheckCircle2}
            />
            <KPICard
              title="Active Care Plans"
              value={clientReport.data.summary.activePlans}
              icon={ClipboardList}
            />
          </>
        )}
        {activeTab === "careplans" && carePlanReport.data && (
          <>
            <KPICard
              title="Total Plans"
              value={carePlanReport.data.summary.totalPlans}
              icon={ClipboardList}
            />
            <KPICard
              title="Active Plans"
              value={carePlanReport.data.summary.activePlans}
              icon={FileText}
            />
            <KPICard
              title="Goals Completed"
              value={carePlanReport.data.summary.completedGoals}
              icon={Target}
            />
            <KPICard
              title="Tasks Completed"
              value={carePlanReport.data.summary.completedTasks}
              icon={CheckCircle2}
            />
            <KPICard
              title="Review Compliance"
              value={`${carePlanReport.data.summary.reviewCompliancePercent.toFixed(1)}%`}
              icon={BarChart3}
            />
          </>
        )}
        {activeTab === "branch" && branchReport.data && (
          <>
            <KPICard
              title="Branches"
              value={branchReport.data.summary.totalBranches}
              icon={Users}
            />
            <KPICard
              title="Total Revenue"
              value={`€${branchReport.data.summary.totalRevenue.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
              icon={Euro}
            />
            <KPICard
              title="Active Employees"
              value={branchReport.data.summary.totalEmployees}
              icon={Users}
            />
            <KPICard
              title="Active Clients"
              value={branchReport.data.summary.totalClients}
              icon={Users}
            />
            <KPICard
              title="Total Visits"
              value={branchReport.data.summary.totalVisits}
              icon={CalendarDays}
            />
          </>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              loading={exporting}
            >
              <Download className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              loading={exporting}
            >
              <Download className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              loading={exporting}
            >
              <Download className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
              PDF
            </Button>
          </div>

          {activeTab === "operational" && <OperationalContent report={operationalReport} />}
          {activeTab === "financial" && <FinancialContent report={financialReport} />}
          {activeTab === "employees" && <EmployeeContent report={employeeReport} />}
          {activeTab === "clients" && <ClientContent report={clientReport} />}
          {activeTab === "careplans" && <CarePlanContent report={carePlanReport} />}
          {activeTab === "branch" && <BranchContent report={branchReport} />}
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: typeof CalendarDays;
}) {
  return (
    <Card bordered padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <Icon className={ICON_SIZE.lg + " text-muted-foreground"} strokeWidth={ICON_STROKE_WIDTH} />
      </div>
    </Card>
  );
}

interface ReportState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function ReportStatus({ report, label }: { report: ReportState<unknown>; label: string }) {
  if (report.loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (report.error) {
    return (
      <EmptyState
        tone="error"
        icon={AlertTriangle}
        title={`Couldn't load ${label}`}
        description={report.error}
        action={
          <Button variant="outline" onClick={report.refetch}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!report.data) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No data available"
        description="No data matches the current filters."
      />
    );
  }
  return null;
}

function OperationalContent({
  report,
}: {
  report: ReportState<{
    visitsByDay: Record<string, number>;
    visitsByBranch: Record<string, number>;
    completed: number;
    cancelled: number;
    noShows: number;
  }>;
}) {
  const status = ReportStatus({ report, label: "the operational report" });
  if (status) return status;
  const data = report.data!;

  const chartData = Object.entries(data.visitsByDay || {})
    .map(([date, count]) => ({ date, visits: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card bordered padding="md">
          <CardHeader>
            <CardTitle size="sm">Visits Trend</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="visits" stroke="var(--chart-1)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card bordered padding="md">
          <CardHeader>
            <CardTitle size="sm">Status Distribution</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Completed", value: data.completed },
                  { name: "Cancelled", value: data.cancelled },
                  { name: "No Show", value: data.noShows },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                dataKey="value"
              >
                {CHART_COLORS.slice(0, 3).map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card bordered padding="md">
        <CardHeader>
          <CardTitle size="sm">By Branch</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={Object.entries(data.visitsByBranch || {}).map(([branch, count]) => ({
              branch,
              visits: count,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="branch" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip />
            <Bar dataKey="visits" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function FinancialContent({
  report,
}: {
  report: ReportState<{
    invoiceAging: Record<string, number>;
    statusDistribution: Record<string, number>;
  }>;
}) {
  const status = ReportStatus({ report, label: "the financial report" });
  if (status) return status;
  const data = report.data!;

  const agingData = Object.entries(data.invoiceAging || {}).map(([range, amount]) => ({
    range,
    amount,
  }));
  const distributionData = Object.entries(data.statusDistribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card bordered padding="md">
        <CardHeader>
          <CardTitle size="sm">Invoice Aging</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip formatter={(value) => `€${value}`} />
            <Bar dataKey="amount" fill="var(--danger)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card bordered padding="md">
        <CardHeader>
          <CardTitle size="sm">Status Distribution</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label
              outerRadius={80}
              dataKey="value"
            >
              {distributionData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function useInMemoryPage<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );
  return { page, setPage: (p: number) => setPage(p), pageCount, pageItems };
}

function EmployeeContent({
  report,
}: {
  report: ReportState<{ employeeMetrics: Record<string, unknown> }>;
}) {
  const status = ReportStatus({ report, label: "the employee report" });
  const metricsData = (report.data?.employeeMetrics as Record<string, unknown>) || {};
  const allRows = useMemo(
    () => Object.entries(metricsData).map(([, emp]) => emp as EmployeeMetricItem),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [report.data]
  );
  const sortedRows = useMemo(
    () => [...allRows].sort((a, b) => b.billableHours - a.billableHours),
    [allRows]
  );
  const { page, setPage, pageCount, pageItems } = useInMemoryPage(sortedRows);

  if (status) return status;

  const chartRows = sortedRows
    .slice(0, 10)
    .map((emp) => ({ name: emp.name, hours: emp.billableHours, revenue: emp.totalRevenue }));

  return (
    <div className="space-y-6">
      <Card bordered padding="md">
        <CardHeader>
          <CardTitle size="sm">Top Employees by Billable Hours</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="hours"
              fill="var(--chart-1)"
              name="Billable Hours"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="revenue"
              fill="var(--chart-3)"
              name="Revenue (€)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {allRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employee activity"
          description="No employees match the current filters."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell className="text-right">Billable Hours</TableHeaderCell>
                <TableHeaderCell className="text-right">Visits</TableHeaderCell>
                <TableHeaderCell className="text-right">Revenue</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((emp) => (
                <TableRow key={emp.name}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell align="right">{emp.billableHours}</TableCell>
                  <TableCell align="right">{emp.completedVisits}</TableCell>
                  <TableCell align="right">€{emp.totalRevenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pageCount > 1 && (
            <div className="flex justify-end">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClientContent({
  report,
}: {
  report: ReportState<{
    clientMetrics: Record<string, unknown>;
    summary: { riskDistribution: Record<string, number> };
  }>;
}) {
  const status = ReportStatus({ report, label: "the client report" });
  const clientMetricsData = (report.data?.clientMetrics as Record<string, unknown>) || {};
  const riskDistribution = report.data?.summary?.riskDistribution || {};
  const allRows = useMemo(
    () => Object.entries(clientMetricsData).map(([, client]) => client as ClientMetricItem),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [report.data]
  );
  const { page, setPage, pageCount, pageItems } = useInMemoryPage(allRows);

  if (status) return status;

  const riskData = Object.entries(riskDistribution).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <Card bordered padding="md">
        <CardHeader>
          <CardTitle size="sm">Risk Level Distribution</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label
              outerRadius={80}
              dataKey="value"
            >
              {riskData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {allRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No client activity"
          description="No clients match the current filters."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell className="text-center">Risk</TableHeaderCell>
                <TableHeaderCell className="text-right">Visits</TableHeaderCell>
                <TableHeaderCell className="text-right">Outstanding</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((client) => (
                <TableRow key={client.name}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell align="center" className="capitalize">
                    {client.riskLevel}
                  </TableCell>
                  <TableCell align="right">{client.completedVisits}</TableCell>
                  <TableCell align="right">€{client.outstanding.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pageCount > 1 && (
            <div className="flex justify-end">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CarePlanContent({
  report,
}: {
  report: ReportState<{
    summary: {
      statusDistribution: Record<string, number>;
      completedGoals: number;
      totalGoals: number;
      activePlans: number;
      totalTasks: number;
      reviewCompliancePercent: number;
    };
  }>;
}) {
  const status = ReportStatus({ report, label: "the care plan report" });
  if (status) return status;
  const summaryData = report.data!.summary;
  const statusData = Object.entries(summaryData.statusDistribution || {}).map(
    ([status, count]) => ({ status, count })
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card bordered padding="md">
          <CardHeader>
            <CardTitle size="sm">Status Distribution</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="status" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card bordered padding="md">
          <CardHeader>
            <CardTitle size="sm">Goals Progress</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
            <div className="h-4 w-full rounded-full bg-muted">
              <div
                className="h-4 rounded-full bg-success transition-all"
                style={{
                  width: `${(summaryData.completedGoals / (summaryData.totalGoals || 1)) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryData.completedGoals} of {summaryData.totalGoals} completed
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatBox label="Active Plans" value={summaryData.activePlans} />
        <StatBox label="Total Goals" value={summaryData.totalGoals} />
        <StatBox label="Total Tasks" value={summaryData.totalTasks} />
        <StatBox
          label="Compliance"
          value={`${(summaryData.reviewCompliancePercent || 0).toFixed(1)}%`}
        />
      </div>
    </div>
  );
}

function BranchContent({
  report,
}: {
  report: ReportState<{ branchMetrics: Record<string, unknown> }>;
}) {
  const status = ReportStatus({ report, label: "the branch report" });
  const metricsData = (report.data?.branchMetrics as Record<string, unknown>) || {};
  const allRows = useMemo(
    () => Object.entries(metricsData).map(([, branch]) => branch as BranchMetricItem),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [report.data]
  );
  const sortedRows = useMemo(
    () => [...allRows].sort((a, b) => b.totalRevenue - a.totalRevenue),
    [allRows]
  );

  if (status) return status;

  const revenueData = sortedRows.map((b) => ({ name: b.branchName, revenue: b.totalRevenue }));

  return (
    <div className="space-y-6">
      <Card bordered padding="md">
        <CardHeader>
          <CardTitle size="sm">Revenue by Branch</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip formatter={(value) => `€${value}`} />
            <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {allRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No branch activity"
          description="No branches match the current filters."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow hover={false}>
              <TableHeaderCell>Branch</TableHeaderCell>
              <TableHeaderCell className="text-right">Employees</TableHeaderCell>
              <TableHeaderCell className="text-right">Clients</TableHeaderCell>
              <TableHeaderCell className="text-right">Visits</TableHeaderCell>
              <TableHeaderCell className="text-right">Revenue</TableHeaderCell>
              <TableHeaderCell className="text-right">Billable Hours</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((branch) => (
              <TableRow key={branch.branchName}>
                <TableCell>{branch.branchName}</TableCell>
                <TableCell align="right">{branch.employeeCount}</TableCell>
                <TableCell align="right">{branch.clientCount}</TableCell>
                <TableCell align="right">{branch.visitCount}</TableCell>
                <TableCell align="right">€{branch.totalRevenue.toFixed(2)}</TableCell>
                <TableCell align="right">{branch.billableHours.toFixed(1)}h</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Card bordered padding="md" className="text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}
