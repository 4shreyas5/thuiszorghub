"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  PlusCircle,
  PencilLine,
  Trash2,
  CircleDot,
  History,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  users: { first_name: string; last_name: string; email: string } | null;
}

function actionPresentation(action: string): { icon: LucideIcon; tint: string } {
  const normalized = action.toLowerCase();
  if (normalized.includes("create") || normalized.includes("insert")) {
    return { icon: PlusCircle, tint: "bg-success/10 text-success" };
  }
  if (normalized.includes("delete") || normalized.includes("archive")) {
    return { icon: Trash2, tint: "bg-danger/10 text-danger" };
  }
  if (normalized.includes("update") || normalized.includes("edit")) {
    return { icon: PencilLine, tint: "bg-info/10 text-info" };
  }
  return { icon: CircleDot, tint: "bg-muted text-muted-foreground" };
}

function humanize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ActivityFeed() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/audit-logs?page=1&limit=8")
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (!cancelled && result?.data) setLogs(result.data);
      })
      .catch(() => {
        /* rendered as empty state below */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card bordered padding="md" className="flex h-full flex-col">
      <CardHeader className="mb-2 flex flex-row items-center justify-between pb-4">
        <CardTitle size="sm">Recent Activity</CardTitle>
        <Link
          href="/admin/audit-logs"
          className="flex items-center gap-1 rounded text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Audit log
          <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
        </Link>
      </CardHeader>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circular" className="h-8 w-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="w-2/3" />
                <Skeleton variant="text" className="w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Actions across your organization will appear here as care begins."
          className="flex-1 p-6"
        />
      ) : (
        <ul className="space-y-1">
          {logs.map((log) => {
            const { icon: Icon, tint } = actionPresentation(log.action);
            const actorName = log.users
              ? `${log.users.first_name} ${log.users.last_name}`.trim() || log.users.email
              : "System";
            return (
              <li key={log.id} className="flex items-start gap-3 rounded-md px-1 py-2">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    tint
                  )}
                >
                  <Icon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{actorName}</span>{" "}
                    <span className="text-muted-foreground">
                      {humanize(log.action).toLowerCase()} · {humanize(log.entity_type)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
