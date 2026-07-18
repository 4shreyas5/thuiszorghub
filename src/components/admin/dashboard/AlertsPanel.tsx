"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock3,
  CheckCircle2,
  CalendarClock,
  UserX,
  LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import type { VisitsDashboardSummary } from "./types";

interface AlertsPanelProps {
  summary: VisitsDashboardSummary | null;
  loading: boolean;
}

function AlertRow({
  icon: Icon,
  tone,
  title,
  detail,
  href,
}: {
  icon: LucideIcon;
  tone: "danger" | "warning" | "success" | "muted";
  title: string;
  detail: string;
  href?: string;
}) {
  const toneClasses = {
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/10 text-success",
    muted: "bg-muted text-muted-foreground",
  }[tone];

  const content = (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/60">
      <div
        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", toneClasses)}
      >
        <Icon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }
  return content;
}

export function AlertsPanel({ summary, loading }: AlertsPanelProps) {
  const hasOverdue = !loading && !!summary && summary.overdue_visits > 0;
  const hasPending = !loading && !!summary && summary.pending_visits > 0;
  const accentClass = hasOverdue
    ? "border-l-danger"
    : hasPending
      ? "border-l-warning"
      : "border-l-border";

  return (
    <Card bordered padding="md" className={cn("h-full border-l-4", accentClass)}>
      <CardHeader className="flex flex-row items-center gap-2">
        <CardTitle size="sm">Alerts</CardTitle>
        {hasOverdue && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-danger-foreground">
            {summary!.overdue_visits}
          </span>
        )}
      </CardHeader>

      {loading ? (
        <div className="space-y-3 p-1">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-1">
          {summary && summary.overdue_visits > 0 ? (
            <AlertRow
              icon={AlertTriangle}
              tone="danger"
              title={`${summary.overdue_visits} overdue visit${summary.overdue_visits === 1 ? "" : "s"}`}
              detail="Scheduled before today and not yet completed or cancelled."
              href="/admin/scheduling"
            />
          ) : (
            <AlertRow
              icon={CheckCircle2}
              tone="success"
              title="No overdue visits"
              detail="Every past visit is completed, cancelled or marked no-show."
            />
          )}

          {summary && summary.pending_visits > 0 ? (
            <AlertRow
              icon={Clock3}
              tone="warning"
              title={`${summary.pending_visits} visit${summary.pending_visits === 1 ? "" : "s"} pending today`}
              detail="Scheduled or confirmed but not started yet."
              href="/admin/scheduling"
            />
          ) : (
            <AlertRow
              icon={CheckCircle2}
              tone="success"
              title="No pending visits today"
              detail="Today's schedule has no visits waiting to start."
            />
          )}

          <AlertRow
            icon={CalendarClock}
            tone="muted"
            title="Expiring care plans"
            detail="Not available yet - the care plans API doesn't expose end-date filtering. Review dates are visible on each plan."
          />
          <AlertRow
            icon={UserX}
            tone="muted"
            title="Unassigned clients"
            detail="Not available yet - no API exposes clients without an active assignment."
          />
        </div>
      )}
    </Card>
  );
}
