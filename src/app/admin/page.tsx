"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function AdminDashboard() {
  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Admin" }];

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
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Scheduled visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Care Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active plans</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Begin managing your homecare operations. The admin interface is ready for integration
            with your data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
