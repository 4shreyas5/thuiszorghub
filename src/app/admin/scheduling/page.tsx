/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "date-fns";
import { Calendar, LayoutGrid, List } from "lucide-react";

export const dynamic = "force-dynamic";

type ViewType = "calendar" | "board" | "list";

interface SchedulingStats {
  todayVisits: number;
  tomorrowVisits: number;
  upcomingVisits: number;
  completedToday: number;
  cancelledToday: number;
}

export default function SchedulingPage() {
  const [view, setView] = useState<ViewType>("list");
  const [visits, setVisits] = useState<any[]>([]);
  const [stats, setStats] = useState<SchedulingStats>({
    todayVisits: 0,
    tomorrowVisits: 0,
    upcomingVisits: 0,
    completedToday: 0,
    cancelledToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter) params.append("status", statusFilter);
      if (dateFilter) params.append("dateFrom", dateFilter);

      const response = await fetch(`/api/visits?${params.toString()}`);
      const data = await response.json();
      setVisits(data.visits || []);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const todayVisits = data.visits?.filter((v: any) => v.scheduled_date === today && !["cancelled", "no_show"].includes(v.status)) || [];
      const tomorrowVisits = data.visits?.filter((v: any) => v.scheduled_date === tomorrow && !["cancelled", "no_show"].includes(v.status)) || [];
      const upcomingVisits = data.visits?.filter((v: any) => v.scheduled_date > tomorrow && !["cancelled", "no_show"].includes(v.status)) || [];
      const completedToday = data.visits?.filter((v: any) => v.scheduled_date === today && v.status === "completed") || [];
      const cancelledToday = data.visits?.filter((v: any) => v.scheduled_date === today && ["cancelled", "no_show"].includes(v.status)) || [];

      setStats({
        todayVisits: todayVisits.length,
        tomorrowVisits: tomorrowVisits.length,
        upcomingVisits: upcomingVisits.length,
        completedToday: completedToday.length,
        cancelledToday: cancelledToday.length,
      });
    } catch (error) {
      console.error("Error fetching visits:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, dateFilter]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling"
        description="Manage visits, availability, and employee schedules"
      />

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle size="sm">Today</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-blue-600">{stats.todayVisits}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Visits scheduled</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Tomorrow</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-purple-600">{stats.tomorrowVisits}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Visits scheduled</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-indigo-600">{stats.upcomingVisits}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Visits scheduled</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Completed today</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-red-600">{stats.cancelledToday}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Cancelled today</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            view === "calendar"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </button>
        <button
          onClick={() => setView("board")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            view === "board"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Board
        </button>
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            view === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <List className="w-4 h-4" />
          List
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search visits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading visits...</p>
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">
            {visits.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">No visits found</p>
            ) : (
              visits.map((visit: any) => (
                <div key={visit.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{visit.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{visit.client?.first_name} {visit.client?.last_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDate(new Date(visit.scheduled_date), "dd MMM yyyy")} â€¢ {visit.start_time} - {visit.end_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        visit.status === "assigned"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                          : visit.status === "scheduled"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : view === "calendar" ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              📅 Calendar view: Grouped by date
            </div>
            {visits.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p>No visits scheduled</p>
              </div>
            ) : (
              Object.entries(
                visits.reduce((acc: any, visit: any) => {
                  const date = visit.scheduled_date;
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(visit);
                  return acc;
                }, {})
              )
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([date, dateVisits]: any) => (
                  <div key={date} className="space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {new Date(date).toLocaleDateString("nl-NL", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <div className="space-y-2 ml-4">
                      {dateVisits.map((visit: any) => (
                        <div key={visit.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {visit.scheduled_time || "No time specified"}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{visit.client_name || "Client"}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{visit.employee_name || "Employee"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              👥 Scheduling board: Grouped by employee
            </div>
            {visits.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p>No visits assigned</p>
              </div>
            ) : (
              Object.entries(
                visits.reduce((acc: any, visit: any) => {
                  const employee = visit.employee_name || "Unassigned";
                  if (!acc[employee]) acc[employee] = [];
                  acc[employee].push(visit);
                  return acc;
                }, {})
              )
                .sort(([empA], [empB]) => empA.localeCompare(empB))
                .map(([employee, empVisits]: any) => (
                  <div key={employee} className="space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {employee}
                    </h3>
                    <div className="space-y-2 ml-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {empVisits.map((visit: any) => (
                        <div key={visit.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {visit.client_name || "Client"}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(visit.scheduled_date).toLocaleDateString("nl-NL")} {visit.scheduled_time || ""}
                          </div>
                          <div className="text-xs mt-1">
                            <span className={`px-2 py-1 rounded text-white text-xs ${
                              visit.status === "completed" ? "bg-green-600" :
                              visit.status === "cancelled" ? "bg-red-600" :
                              visit.status === "no_show" ? "bg-orange-600" :
                              "bg-blue-600"
                            }`}>
                              {visit.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

