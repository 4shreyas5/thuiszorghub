"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isToday,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/shared/utils/cn";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

export const dynamic = "force-dynamic";

type ViewMode = "day" | "week" | "month";

interface VisitRow {
  id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  client?: { first_name: string; last_name: string };
  employee?: { first_name: string; last_name: string } | null;
}

interface Option {
  id: string;
  first_name: string;
  last_name: string;
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function visitChip(visit: VisitRow) {
  const employeeName = visit.employee
    ? `${visit.employee.first_name} ${visit.employee.last_name}`
    : "Unassigned";
  const clientName = visit.client
    ? `${visit.client.first_name} ${visit.client.last_name}`
    : "Unknown client";
  return (
    <Link
      key={visit.id}
      href={`/admin/visits/${visit.id}`}
      className="block rounded-md border border-border/60 bg-card px-2 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <p className="truncate font-medium text-foreground">
        {visit.start_time?.slice(0, 5)} · {clientName}
      </p>
      <p className="truncate text-muted-foreground">{employeeName}</p>
    </Link>
  );
}

export default function SchedulingPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [employees, setEmployees] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);

  const range = useMemo(() => {
    if (view === "day") return { from: anchorDate, to: anchorDate };
    if (view === "week") {
      return {
        from: startOfWeek(anchorDate, { weekStartsOn: 1 }),
        to: endOfWeek(anchorDate, { weekStartsOn: 1 }),
      };
    }
    // Month view pads to full weeks so the grid has no partial rows.
    return {
      from: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 }),
      to: endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 }),
    };
  }, [view, anchorDate]);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: format(range.from, "yyyy-MM-dd"),
        dateTo: format(range.to, "yyyy-MM-dd"),
        limit: "500",
        sortBy: "scheduled_date",
        sortOrder: "asc",
      });
      if (employeeId) params.append("employeeId", employeeId);
      if (clientId) params.append("clientId", clientId);

      const response = await fetch(`/api/visits?${params}`);
      const data = await response.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error("Error fetching scheduled visits:", error);
    } finally {
      setLoading(false);
    }
  }, [range, employeeId, clientId]);

  useEffect(() => {
    // Deferred to a microtask so the fetch trigger isn't a synchronous setState call in the effect body.
    queueMicrotask(() => {
      fetchVisits();
    });
  }, [fetchVisits]);

  useEffect(() => {
    fetch("/api/employees?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.employees && setEmployees(d.employees))
      .catch(() => {});
    fetch("/api/clients?page=1&limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.clients && setClients(d.clients))
      .catch(() => {});
  }, []);

  const visitsByDay = useMemo(() => {
    const map = new Map<string, VisitRow[]>();
    for (const visit of visits) {
      const key = visit.scheduled_date;
      const list = map.get(key) || [];
      list.push(visit);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    }
    return map;
  }, [visits]);

  const goPrev = () =>
    setAnchorDate((d) =>
      view === "day" ? subDays(d, 1) : view === "week" ? subWeeks(d, 1) : subMonths(d, 1)
    );
  const goNext = () =>
    setAnchorDate((d) =>
      view === "day" ? addDays(d, 1) : view === "week" ? addWeeks(d, 1) : addMonths(d, 1)
    );
  const goToday = () => setAnchorDate(new Date());

  const rangeLabel =
    view === "day"
      ? format(anchorDate, "EEEE, d MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(anchorDate, { weekStartsOn: 1 }), "d MMM")} – ${format(endOfWeek(anchorDate, { weekStartsOn: 1 }), "d MMM yyyy")}`
        : format(anchorDate, "MMMM yyyy");

  const weekDays = useMemo(() => eachDayOfInterval({ start: range.from, end: range.to }), [range]);
  const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
  const dayVisits = visitsByDay.get(dayKey(anchorDate)) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling"
        description="Day, week and month views of every visit."
        action={{ label: "New Visit", href: "/admin/visits/new" }}
      />

      <Card bordered padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} aria-label="Previous">
              <ChevronLeft className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} aria-label="Next">
              <ChevronRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
            </Button>
            <span className="ml-2 text-sm font-medium text-foreground">{rangeLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {VIEW_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={view === opt.value ? "primary" : "outline"}
                onClick={() => setView(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={[
              { value: "", label: "All employees" },
              ...employees.map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` })),
            ]}
          />
          <Select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={[
              { value: "", label: "All clients" },
              ...clients.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })),
            ]}
          />
        </div>
      </Card>

      {loading ? (
        <Card bordered padding="md" className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </Card>
      ) : view === "day" ? (
        <Card bordered padding="md">
          {dayVisits.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No visits scheduled"
              description="Nothing scheduled for this day yet."
            />
          ) : (
            // Time-ordered per employee, per day - this ordering is the
            // natural precursor for future route optimization (an
            // employee's day is already the sequence a route would need to
            // start from), but no distance/routing calculation exists here
            // or is implied - that's explicitly out of scope for this pass.
            <ul className="space-y-3 border-l-2 border-border pl-4">
              {dayVisits.map((visit) => (
                <li key={visit.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                  <Link
                    href={`/admin/visits/${visit.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {visit.start_time?.slice(0, 5)} - {visit.end_time?.slice(0, 5)} ·{" "}
                        {visit.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {visit.client
                          ? `${visit.client.first_name} ${visit.client.last_name}`
                          : "Unknown client"}{" "}
                        ·{" "}
                        {visit.employee
                          ? `${visit.employee.first_name} ${visit.employee.last_name}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <StatusBadge status={visit.status} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : view === "week" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((day) => {
            const list = visitsByDay.get(dayKey(day)) || [];
            return (
              <Card
                key={dayKey(day)}
                bordered
                padding="sm"
                className={cn("space-y-2", isToday(day) && "border-primary/50")}
              >
                <button
                  onClick={() => {
                    setAnchorDate(day);
                    setView("day");
                  }}
                  className="flex w-full items-baseline justify-between text-left"
                >
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      isToday(day) ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isToday(day) ? "text-primary" : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </button>
                <div className="space-y-1.5">
                  {list.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No visits</p>
                  ) : (
                    list.map((visit) => visitChip(visit))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card bordered padding="sm">
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="bg-muted/40 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border">
            {weekDays.map((day) => {
              const list = visitsByDay.get(dayKey(day)) || [];
              const visible = list.slice(0, 3);
              const overflow = list.length - visible.length;
              return (
                <button
                  key={dayKey(day)}
                  onClick={() => {
                    setAnchorDate(day);
                    setView("day");
                  }}
                  className={cn(
                    "min-h-24 space-y-1 bg-card p-1.5 text-left transition-colors hover:bg-accent/30",
                    !isSameMonth(day, anchorDate) && "opacity-40",
                    isToday(day) && "ring-1 ring-inset ring-primary/50"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday(day) ? "text-primary" : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="space-y-1">
                    {visible.map((visit) => (
                      <div
                        key={visit.id}
                        className="truncate rounded bg-accent/50 px-1.5 py-0.5 text-[11px] text-foreground"
                      >
                        {visit.start_time?.slice(0, 5)} {visit.client?.first_name || ""}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <p className="px-1.5 text-[11px] text-muted-foreground">+{overflow} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
