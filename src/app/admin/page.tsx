"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Users,
  UserRound,
  HeartHandshake,
  ClipboardList,
  CalendarDays,
  Building2,
  CalendarPlus,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/core/context/auth-context";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import { KpiStrip, type KpiStripItem } from "@/components/admin/dashboard/KpiStrip";
import { TodaySchedule } from "@/components/admin/dashboard/TodaySchedule";
import { AlertsPanel } from "@/components/admin/dashboard/AlertsPanel";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";
import { VisitsChart } from "@/components/admin/dashboard/VisitsChart";
import { QuickActionsGrid } from "@/components/admin/dashboard/QuickActionsGrid";
import type { VisitsDashboardSummary } from "@/components/admin/dashboard/types";

interface KpiTotals {
  clients: number | null;
  employees: number | null;
  activeAssignments: number | null;
  activeCarePlans: number | null;
  branches: number | null;
}

const EMPTY_TOTALS: KpiTotals = {
  clients: null,
  employees: null,
  activeAssignments: null,
  activeCarePlans: null,
  branches: null,
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

async function fetchTotal(url: string, key: "pagination"): Promise<number | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.[key]?.total ?? null;
  } catch {
    return null;
  }
}

export default function AdminDashboard() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { organizationName } = useOrganization();
  const [totals, setTotals] = useState<KpiTotals>(EMPTY_TOTALS);
  const [summary, setSummary] = useState<VisitsDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const hasOrg = !!authUser?.organizationId;

  useEffect(() => {
    if (!hasOrg) return;

    let cancelled = false;

    Promise.all([
      fetchTotal("/api/clients?page=1&limit=1", "pagination"),
      fetchTotal("/api/employees?page=1&limit=1", "pagination"),
      fetchTotal("/api/assignments?page=1&limit=1&status=active", "pagination"),
      fetchTotal("/api/care-plans?page=1&limit=1&status=active", "pagination"),
      fetchTotal("/api/branches?page=1&limit=1", "pagination"),
      fetch("/api/visits/dashboard")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ]).then(
      ([clients, employees, activeAssignments, activeCarePlans, branches, visitsDashboard]) => {
        if (cancelled) return;
        setTotals({ clients, employees, activeAssignments, activeCarePlans, branches });
        setSummary(visitsDashboard?.summary ?? null);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [hasOrg]);

  const firstName = authUser?.firstName || "there";
  const today = format(new Date(), "EEEE, d MMMM yyyy");

  const kpiItems: KpiStripItem[] = [
    {
      key: "clients",
      title: "Clients",
      value: totals.clients,
      icon: UserRound,
      href: "/admin/clients",
    },
    {
      key: "employees",
      title: "Employees",
      value: totals.employees,
      icon: Users,
      href: "/admin/employees",
    },
    {
      key: "assignments",
      title: "Assignments",
      value: totals.activeAssignments,
      icon: HeartHandshake,
      href: "/admin/assignments",
    },
    {
      key: "carePlans",
      title: "Care Plans",
      value: totals.activeCarePlans,
      icon: ClipboardList,
      href: "/admin/care-plans",
    },
    {
      key: "visits",
      title: "Today's Visits",
      value: summary?.total_visits ?? (loading ? null : 0),
      icon: CalendarDays,
      href: "/admin/scheduling",
    },
    {
      key: "branches",
      title: "Branches",
      value: totals.branches,
      icon: Building2,
      href: "/admin/branches",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header ---------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          {organizationName && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{organizationName}</p>
          )}
        </div>
        {hasOrg && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/clients/new">
                <UserPlus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                New Client
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/visits/new">
                <CalendarPlus className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                Schedule Visit
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Organization setup gate ----------------------------------------- */}
      {!authLoading && authUser && !hasOrg && (
        <Card bordered padding="lg" className="border-warning/40 bg-warning/5 text-center">
          <h3 className="text-lg font-semibold text-foreground">Organization Setup Required</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Complete your organization setup to unlock the dashboard and start managing your
            homecare operations.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/onboarding">Go to Setup</Link>
            </Button>
          </div>
        </Card>
      )}

      {hasOrg && (
        <>
          {/* KPI strip - always visible, light context ----------------------- */}
          <KpiStrip items={kpiItems} loading={loading} />

          {/* Hero: today's schedule dominant, alerts always visible --------- */}
          <section
            aria-label="Today's operations"
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            <div className="lg:col-span-2">
              <TodaySchedule summary={summary} loading={loading} />
            </div>
            <AlertsPanel summary={summary} loading={loading} />
          </section>

          {/* Secondary: activity -------------------------------------------- */}
          <ActivityFeed />

          {/* Analytics (lighter) + quick actions ----------------------------- */}
          <section
            aria-label="Analytics and quick actions"
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            <div className="lg:col-span-2">
              <VisitsChart />
            </div>
            <QuickActionsGrid />
          </section>
        </>
      )}
    </div>
  );
}
