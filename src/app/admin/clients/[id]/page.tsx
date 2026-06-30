"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Client } from "@/types/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ClientForm } from "@/components/admin/ClientForm";
import { UpdateClientPayload } from "@/types/client";
import { Edit2, X } from "lucide-react";

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) throw new Error("Failed to fetch client");
        const data = await response.json();
        setClient(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load client";
        setError(message);
        console.error("Error fetching client:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        const response = await fetch(`/api/assignments/client/${clientId}`);
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
        const response = await fetch(`/api/visits/client/${clientId}?filter=upcoming`);
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

    fetchClient();
    fetchAssignments();
    fetchVisits();
  }, [clientId]);

  const handleUpdateSubmit = async (data: UpdateClientPayload) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update client");
      }

      const updatedClient = await response.json();
      setClient(updatedClient);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update client";
      setError(message);
      console.error("Error updating client:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getCaseStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "discharged":
        return "default";
      default:
        return "default";
    }
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
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

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client Not Found" />
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The client you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/clients")}>Back to Clients</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`${client.first_name} ${client.last_name}`}
          description={client.email || "No email"}
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
              <CardTitle>Edit Client</CardTitle>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ClientForm
              client={client}
              isLoading={isSaving}
              onSubmit={handleUpdateSubmit}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle size="sm">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Date of Birth
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {client.date_of_birth
                      ? new Date(client.date_of_birth).toLocaleDateString("nl-NL")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {client.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {client.phone || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Case Information */}
            <Card>
              <CardHeader>
                <CardTitle size="sm">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Case Status
                  </p>
                  <Badge variant={getCaseStatusColor(client.case_status)} className="mt-1">
                    {client.case_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Risk Level
                  </p>
                  {client.risk_level ? (
                    <Badge variant={getRiskLevelColor(client.risk_level)} className="mt-1">
                      {client.risk_level}
                    </Badge>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">-</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <Badge variant={client.is_active ? "success" : "default"} className="mt-1">
                    {client.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact */}
          {(client.emergency_contact_name || client.emergency_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.emergency_contact_name && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.emergency_contact_name}
                    </p>
                  </div>
                )}
                {client.emergency_contact_phone && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.emergency_contact_phone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Assigned Employees */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Assigned Employees</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <Skeleton className="h-20 w-full" />
              ) : assignments.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No employees assigned yet
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
                          href={`/admin/employees/${assignment.employee_id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {assignment.employee?.first_name} {assignment.employee?.last_name}
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
                          href={`/admin/employees/${assignment.employee_id}`}
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
              <div className="flex items-center justify-between">
                <CardTitle size="sm">Care Plans</CardTitle>
                <Link
                  href="/admin/care-plans/new"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Create Plan
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Loading care plans...</p>
                </div>
              </div>
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
                  No visits scheduled
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
                          href={`/admin/employees/${visit.employee_id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {visit.employee?.first_name} {visit.employee?.last_name}
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
              <CardTitle size="sm">Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No billing information
              </p>
            </CardContent>
          </Card>

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
                  {new Date(client.created_at).toLocaleString("nl-NL")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(client.updated_at).toLocaleString("nl-NL")}
                </p>
              </div>
              {client.deleted_at && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Archived At
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(client.deleted_at).toLocaleString("nl-NL")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
