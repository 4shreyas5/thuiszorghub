"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Skeleton } from "@/components/ui/Skeleton";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  archivedEmployees: number;
  totalClients: number;
  totalAssignments: number;
  activeAssignments: number;
  totalVisits: number;
  todayVisits: number;
  totalCarePlans: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    archivedEmployees: 0,
    totalClients: 0,
    totalAssignments: 0,
    activeAssignments: 0,
    totalVisits: 0,
    todayVisits: 0,
    totalCarePlans: 0,
  });
  const [loading, setLoading] = useState(true);
  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Admin" }];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const [employeesRes, clientsRes, assignmentsRes, assignmentsActiveRes, visitsRes, visitsTodayRes, carePlansRes] = await Promise.all([
          fetch("/api/employees?page=1&limit=1"),
          fetch("/api/clients?page=1&limit=1"),
          fetch("/api/assignments?page=1&limit=1&status=all"),
          fetch("/api/assignments?page=1&limit=1&status=active"),
          fetch("/api/visits?page=1&limit=1"),
          fetch(`/api/visits?page=1&limit=1&dateFrom=${today}&dateTo=${today}`),
          fetch("/api/care-plans?page=1&limit=1"),
        ]);

        const employeesData = employeesRes.ok ? await employeesRes.json() : null;
        const clientsData = clientsRes.ok ? await clientsRes.json() : null;
        const assignmentsData = assignmentsRes.ok ? await assignmentsRes.json() : null;
        const assignmentsActiveData = assignmentsActiveRes.ok ? await assignmentsActiveRes.json() : null;
        const visitsData = visitsRes.ok ? await visitsRes.json() : null;
        const visitsTodayData = visitsTodayRes.ok ? await visitsTodayRes.json() : null;
        const carePlansData = carePlansRes.ok ? await carePlansRes.json() : null;

        setStats({
          totalEmployees: employeesData?.pagination?.total || 0,
          activeEmployees: 0,
          archivedEmployees: 0,
          totalClients: clientsData?.pagination?.total || 0,
          totalAssignments: assignmentsData?.pagination?.total || 0,
          activeAssignments: assignmentsActiveData?.pagination?.total || 0,
          totalVisits: visitsData?.pagination?.total || 0,
          todayVisits: visitsTodayData?.pagination?.total || 0,
          totalCarePlans: carePlansData?.pagination?.total || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome to ThuisZorgHub Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle size="sm">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-blue-600">{stats.totalVisits}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Scheduled visits</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-green-600">{stats.totalEmployees}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total team members</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-purple-600">{stats.totalClients}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active clients</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Care Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-orange-600">{stats.totalCarePlans}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active plans</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalAssignments}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total assignments</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-pink-600">{stats.activeAssignments}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Currently active</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Today's Visits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-cyan-600">{stats.todayVisits}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Scheduled for today</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Begin managing your homecare operations. Navigate to Employees, Clients, or Care Plans to get started with managing your organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
