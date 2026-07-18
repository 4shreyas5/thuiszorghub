"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  PlayCircle,
  Clock3,
  AlertTriangle,
  ArrowRight,
  CalendarPlus,
  CalendarDays,
  UserX,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { InitialsAvatar } from "@/components/ui/Avatar";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import type { VisitsDashboardSummary } from "./types";

interface VisitRow {
  id: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  client: { id: string; first_name: string; last_name: string } | null;
  employee: { id: string; first_name: string; last_name: string } | null;
}

const STATS = [
  { key: "completed_visits", label: "Completed", icon: CheckCircle2, tint: "text-success" },
  { key: "in_progress_visits", label: "In progress", icon: PlayCircle, tint: "text-info" },
  { key: "pending_visits", label: "Pending", icon: Clock3, tint: "text-warning" },
  { key: "overdue_visits", label: "Overdue", icon: AlertTriangle, tint: "text-danger" },
] as const;

interface TodayScheduleProps {
  summary: VisitsDashboardSummary | null;
  loading: boolean;
}

/**
 * The dashboard's primary hero: today's operational stats plus the next
 * visits, under one header - the page's single most important surface
 * ("how is my organization today"), sized and weighted to dominate the
 * layout rather than compete equally with everything else.
 */
export function TodaySchedule({ summary, loading }: TodayScheduleProps) {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().split("T")[0];

    fetch(`/api/visits?dateFrom=${today}&sortBy=scheduled_date&sortOrder=asc&limit=5&page=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (!cancelled && result?.visits) setVisits(result.visits);
      })
      .catch(() => {
        /* rendered as empty state below */
      })
      .finally(() => {
        if (!cancelled) setVisitsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card bordered padding="lg" className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle size="md">Today&apos;s Schedule</CardTitle>
          {!loading && summary && summary.total_visits > 0 && (
            <Badge variant="primary" size="sm">
              {summary.completion_rate}% complete
            </Badge>
          )}
        </div>
        <Link
          href="/admin/scheduling"
          className="flex items-center gap-1 rounded text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View schedule
          <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
        </Link>
      </CardHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.key} className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={cn(ICON_SIZE.sm, stat.tint)} strokeWidth={ICON_STROKE_WIDTH} />
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-10" />
            ) : (
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {summary ? summary[stat.key] : "—"}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Up next
        </p>

        {visitsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-9 w-9" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" className="w-1/2" />
                  <Skeleton variant="text" className="w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : visits.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No visits scheduled yet"
            description="Once care begins, you'll see who's being visited and when."
            action={
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/visits/new">
                  <CalendarPlus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                  Schedule Visit
                </Link>
              </Button>
            }
            className="p-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {visits.map((visit) => {
              const clientName = visit.client
                ? `${visit.client.first_name} ${visit.client.last_name}`
                : "Unknown client";
              const employeeName = visit.employee
                ? `${visit.employee.first_name} ${visit.employee.last_name}`
                : null;
              return (
                <li key={visit.id}>
                  <Link
                    href={`/admin/visits/${visit.id}`}
                    className="flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <InitialsAvatar name={clientName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{clientName}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        {format(parseISO(visit.scheduled_date), "EEE d MMM")}
                        {visit.start_time ? ` · ${visit.start_time.slice(0, 5)}` : ""}
                        {" · "}
                        {employeeName ?? (
                          <span className="inline-flex items-center gap-1 font-medium text-warning-foreground">
                            <UserX className="h-3 w-3 shrink-0" strokeWidth={ICON_STROKE_WIDTH} />
                            Unassigned
                          </span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={visit.status} size="sm" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
