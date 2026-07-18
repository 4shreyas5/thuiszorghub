"use client";

import { useState, useCallback, useEffect } from "react";
import { Clock3, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";

interface Timesheet {
  id: string;
  visit_date: string;
  billable_hours: number;
  hourly_rate: number;
  is_billed: boolean;
  employee?: { first_name: string; last_name: string } | null;
  client?: { first_name: string; last_name: string } | null;
}

const BILLED_OPTIONS = [
  { value: "", label: "All" },
  { value: "false", label: "Unbilled" },
  { value: "true", label: "Billed" },
];

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isBilled, setIsBilled] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const limit = 20;

  const fetchTimesheets = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setLoadError(null);
        const offset = (targetPage - 1) * limit;
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
        if (isBilled) params.append("isBilled", isBilled);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const response = await fetch(`/api/billing/timesheets?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch timesheets");

        setTimesheets(data.data || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load timesheets");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isBilled, startDate, endDate]
  );

  useEffect(() => {
    // Deferred to a microtask so these setState/fetch calls aren't synchronous within the effect body.
    queueMicrotask(() => {
      setPage(1);
      fetchTimesheets(1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBilled, startDate, endDate]);

  useEffect(() => {
    queueMicrotask(() => {
      if (page > 1) fetchTimesheets(page);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const totalBillableHours = timesheets.reduce(
    (sum, ts) => sum + Number(ts.billable_hours || 0),
    0
  );
  const totalRevenue = timesheets.reduce(
    (sum, ts) => sum + Number(ts.billable_hours || 0) * Number(ts.hourly_rate || 0),
    0
  );
  const unbilledCount = timesheets.filter((ts) => !ts.is_billed).length;
  const hasFilters = !!(isBilled || startDate || endDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheets"
        description="Track billable hours and employee time entries."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card bordered padding="md">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Billable Hours</p>
          <p className="text-3xl font-bold text-foreground">{totalBillableHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground mt-2">
            {timesheets.length} entries on this page
          </p>
        </Card>
        <Card bordered padding="md">
          <p className="text-sm font-medium text-muted-foreground mb-2">Estimated Revenue</p>
          <p className="text-3xl font-bold text-success">
            €{totalRevenue.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card bordered padding="md">
          <p className="text-sm font-medium text-muted-foreground mb-2">Unbilled</p>
          <p className="text-3xl font-bold text-warning-foreground">{unbilledCount}</p>
          <p className="text-xs text-muted-foreground mt-2">entries waiting to invoice</p>
        </Card>
      </div>

      <Card bordered padding="md" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            value={isBilled}
            onChange={(e) => setIsBilled(e.target.value)}
            options={BILLED_OPTIONS}
          />
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <Card bordered padding="md" className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : loadError ? (
        <Card bordered padding="md">
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Couldn't load timesheets"
            description={loadError}
            action={
              <Button variant="outline" onClick={() => fetchTimesheets(page)}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : timesheets.length === 0 ? (
        <Card bordered padding="md">
          <EmptyState
            icon={Clock3}
            title={hasFilters ? "No matching timesheets" : "No timesheets yet"}
            description={
              hasFilters
                ? "Try clearing a filter."
                : "Timesheets are generated from completed visits via the Billing overview page."
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHead>
              <TableRow hover={false}>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell className="text-right">Billable Hours</TableHeaderCell>
                <TableHeaderCell className="text-right">Rate</TableHeaderCell>
                <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                <TableHeaderCell className="text-center">Billed</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timesheets.map((ts) => (
                <TableRow key={ts.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(ts.visit_date).toLocaleDateString("nl-NL")}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {ts.employee ? `${ts.employee.first_name} ${ts.employee.last_name}` : "N/A"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {ts.client ? `${ts.client.first_name} ${ts.client.last_name}` : "N/A"}
                  </TableCell>
                  <TableCell align="right">{Number(ts.billable_hours || 0).toFixed(2)}h</TableCell>
                  <TableCell align="right">€{Number(ts.hourly_rate || 0).toFixed(2)}</TableCell>
                  <TableCell align="right" className="font-medium text-foreground">
                    €{(Number(ts.billable_hours || 0) * Number(ts.hourly_rate || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Badge variant={ts.is_billed ? "success" : "warning"} size="sm">
                      {ts.is_billed ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total} timesheet{total === 1 ? "" : "s"}
              </p>
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
