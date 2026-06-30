"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Employee } from "@/types/employee";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { UpdateEmployeePayload } from "@/types/employee";
import { Edit2, X } from "lucide-react";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/employees/${employeeId}`);
        if (!response.ok) throw new Error("Failed to fetch employee");
        const data = await response.json();
        setEmployee(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load employee";
        setError(message);
        console.error("Error fetching employee:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        const response = await fetch(`/api/assignments/employee/${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setAssignments(data || []);
        }
      } catch (err) {
        console.error("Error fetching assignments:", err);
      } finally {
        setLoadingAssignments(false);
      }
    };

    const fetchVisits = async () => {
      try {
        setLoadingVisits(true);
        const response = await fetch(`/api/visits/employee/${employeeId}?filter=upcoming`);
        if (response.ok) {
          const data = await response.json();
          setVisits(data || []);
        }
      } catch (err) {
        console.error("Error fetching visits:", err);
      } finally {
        setLoadingVisits(false);
      }
    };

    fetchEmployee();
    fetchAssignments();
    fetchVisits();
  }, [employeeId]);

  const handleUpdateSubmit = async (data: UpdateEmployeePayload) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update employee");
      }

      const updatedEmployee = await response.json();
      setEmployee(updatedEmployee);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update employee";
      setError(message);
      console.error("Error updating employee:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Not Found" />
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The employee you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/employees")}>Back to Employees</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`${employee.first_name} ${employee.last_name}`}
          description={employee.email}
        />
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="secondary"
            className="flex gap-2 items-center"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {isEditing ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit Employee</CardTitle>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <EmployeeForm
              employee={employee}
              isLoading={isSaving}
              onSubmit={handleUpdateSubmit}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle size="sm">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {employee.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {employee.phone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <Badge variant={employee.is_active ? "success" : "default"} className="mt-1">
                    {employee.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Employment Type
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {employee.employment_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Start Date
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(employee.start_date).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                {employee.end_date && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(employee.end_date).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                )}
                {employee.hourly_rate && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Hourly Rate
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      €{employee.hourly_rate.toFixed(2)}/hour
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bio */}
          {employee.bio && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300">{employee.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Created At
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(employee.createdAt).toLocaleString("nl-NL")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(employee.updatedAt).toLocaleString("nl-NL")}
                </p>
              </div>
              {employee.deleted_at && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Deleted At
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(employee.deleted_at).toLocaleString("nl-NL")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Clients */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Assigned Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <Skeleton className="h-20 w-full" />
              ) : assignments.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No clients assigned yet
                </p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <Link
                          href={`/admin/clients/${assignment.client_id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {assignment.client?.first_name} {assignment.client?.last_name}
                        </Link>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(assignment.assigned_from).toLocaleDateString("nl-NL")}
                          {assignment.assigned_until
                            ? ` - ${new Date(assignment.assigned_until).toLocaleDateString("nl-NL")}`
                            : " - Ongoing"}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {assignment.is_primary && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                        <Link
                          href={`/admin/clients/${assignment.client_id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="sm">Upcoming Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVisits ? (
                <Skeleton className="h-20 w-full" />
              ) : visits.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No upcoming visits scheduled
                </p>
              ) : (
                <div className="space-y-3">
                  {visits.map((visit: any) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <Link
                          href={`/admin/clients/${visit.client_id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {visit.client?.first_name} {visit.client?.last_name}
                        </Link>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(visit.scheduled_date).toLocaleDateString("nl-NL")} • {visit.start_time} - {visit.end_time}
                        </p>
                      </div>
                      <Link
                        href={`/admin/visits/${visit.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No recent activity
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
