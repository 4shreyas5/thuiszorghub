"use client";

import { useEffect, useState } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface VisitRow {
  scheduled_date: string;
  status: string;
}

interface ChartPoint {
  day: string;
  visits: number;
}

const MAX_VISITS = 4000; // hard cap on a single month's fetch

/**
 * Read-only month-to-date visit analytics. Sources rows directly from the
 * visits list endpoint (GET /api/visits) and aggregates client-side, so the
 * dashboard never triggers the report_audit_logs write that
 * /api/reports/operational performs. No historical/trend comparison is shown -
 * only the current month's real, counted data.
 *
 * Fetches in a single request instead of paging: `fields=minimal` (see
 * GET /api/visits) drops the client/employee/branch/care_plan joins server
 * side since only `scheduled_date`/`status` are read here, and `limit`
 * covers a full month in one round trip instead of the previous up-to-40
 * sequential page requests.
 */
export function VisitsChart() {
  const [rows, setRows] = useState<VisitRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    const dateFrom = format(startOfMonth(today), "yyyy-MM-dd");
    const dateTo = format(today, "yyyy-MM-dd");

    async function loadAll() {
      try {
        const res = await fetch(
          `/api/visits?dateFrom=${dateFrom}&dateTo=${dateTo}&sortBy=scheduled_date&sortOrder=asc&limit=${MAX_VISITS}&page=1&fields=minimal`
        );
        const batch: VisitRow[] = res.ok ? ((await res.json())?.visits ?? []) : [];
        if (!cancelled) setRows(batch);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = rows?.length ?? 0;
  const completed = rows?.filter((r) => r.status === "completed").length ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const points: ChartPoint[] = (() => {
    if (!rows) return [];
    const byDay: Record<string, number> = {};
    for (const row of rows) {
      byDay[row.scheduled_date] = (byDay[row.scheduled_date] || 0) + 1;
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, visits]) => ({ day: format(parseISO(date), "d MMM"), visits }));
  })();

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle size="sm">Visits This Month</CardTitle>
      </CardHeader>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No visits recorded yet this month"
          description="Once care begins, daily activity appears here."
          className="p-6"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <InlineStat label="Scheduled" value={String(total)} />
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <InlineStat label="Completed" value={String(completed)} />
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <InlineStat label="Completion rate" value={`${completionRate}%`} />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    color: "var(--popover-foreground)",
                    fontSize: "0.75rem",
                  }}
                />
                <Bar dataKey="visits" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-muted-foreground">
      {label} <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}
