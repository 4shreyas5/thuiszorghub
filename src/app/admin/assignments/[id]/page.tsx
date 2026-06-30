"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Assignment } from "@/types/assignment";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AssignmentForm } from "@/components/admin/AssignmentForm";
import { UpdateAssignmentPayload } from "@/types/assignment";
import { Edit2, X } from "lucide-react";

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/assignments/${assignmentId}`);
        if (!response.ok) throw new Error("Failed to fetch assignment");
        const data = await response.json();
        setAssignment(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load assignment";
        setError(message);
        console.error("Error fetching assignment:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleUpdateSubmit = async (data: UpdateAssignmentPayload) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update assignment");
      }

      const updatedAssignment = await response.json();
      setAssignment(updatedAssignment);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update assignment";
      setError(message);
      console.error("Error updating assignment:", err);
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

  if (!assignment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignment Not Found" />
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The assignment you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/admin/assignments")}>Back to Assignments</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`${assignment.employee?.first_name} ${assignment.employee?.last_name} → ${assignment.client?.first_name} ${assignment.client?.last_name}`}
          description={`Assignment from ${new Date(assignment.assigned_from).toLocaleDateString("nl-NL")} to ${
            assignment.assigned_until
              ? new Date(assignment.assigned_until).toLocaleDateString("nl-NL")
              : "ongoing"
          }`}
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
              <CardTitle>Edit Assignment</CardTitle>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <AssignmentForm
              assignment={assignment}
              isLoading={isSaving}
              onSubmit={handleUpdateSubmit}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle size="sm">Employee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.employee?.first_name} {assignment.employee?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.employee?.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.client?.first_name} {assignment.client?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.client?.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Start Date
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(assignment.assigned_from).toLocaleDateString("nl-NL")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  End Date
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.assigned_until
                    ? new Date(assignment.assigned_until).toLocaleDateString("nl-NL")
                    : "Ongoing"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Primary Assignment
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.is_primary ? "Yes" : "No"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {assignment.notes && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300">{assignment.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
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
                  {new Date(assignment.created_at).toLocaleString("nl-NL")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(assignment.updated_at).toLocaleString("nl-NL")}
                </p>
              </div>
              {assignment.deleted_at && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Archived At
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(assignment.deleted_at).toLocaleString("nl-NL")}
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
