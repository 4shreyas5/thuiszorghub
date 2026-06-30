/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { CarePlanForm } from "@/components/admin/CarePlanForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Edit2, X, Plus, Trash2 } from "lucide-react";
import { formatDate } from "date-fns";
import { CarePlan } from "@/types/care-plan";

type TabType = "overview" | "goals" | "tasks" | "reviews" | "documents";

export default function CarePlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const carePlanId = params.id as string;

  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/care-plans/${carePlanId}/goals`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data || []);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/care-plans/${carePlanId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data || []);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/care-plans/${carePlanId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const fetchCarePlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/care-plans/${carePlanId}`);
      if (!response.ok) throw new Error("Care plan not found");
      const data = await response.json();
      setCarePlan(data);

      await Promise.all([
        fetchGoals(),
        fetchTasks(),
        fetchReviews(),
      ]);
    } catch (err) {
      console.error("Error fetching care plan:", err);
      setError(err instanceof Error ? err.message : "Failed to load care plan");
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    fetchCarePlan();
  }, [carePlanId]);

  const handleUpdateSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/care-plans/${carePlanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update care plan");
      }

      const updated = await response.json();
      setCarePlan(updated);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update care plan";
      setError(message);
      console.error("Error updating care plan:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      const response = await fetch(`/api/care-plans/goals/${goalId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setGoals(goals.filter((g) => g.id !== goalId));
      }
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const response = await fetch(`/api/care-plans/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const response = await fetch(`/api/care-plans/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
      }
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!carePlan) {
    return (
      <div className="space-y-6">
        <PageHeader title="Care Plan Not Found" />
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">The care plan you are looking for does not exist.</p>
          <Button onClick={() => router.push("/admin/care-plans")}>Back to Care Plans</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string): "primary" | "default" | "success" | "warning" | "danger" | "info" => {
    const colors: Record<string, "primary" | "default" | "success" | "warning" | "danger" | "info"> = {
      draft: "default",
      active: "success",
      on_hold: "warning",
      completed: "success",
      archived: "default",
    };
    return colors[status] || "default";
  };

  const getPriorityColor = (priority: string): "primary" | "default" | "success" | "warning" | "danger" | "info" => {
    const colors: Record<string, "primary" | "default" | "success" | "warning" | "danger" | "info"> = {
      low: "default",
      normal: "primary",
      high: "warning",
      urgent: "danger",
    };
    return colors[priority] || "default";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={carePlan.title} description={carePlan.client ? `${carePlan.client.first_name} ${carePlan.client.last_name}` : ""} />
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
              <CardTitle>Edit Care Plan</CardTitle>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <CarePlanForm
              carePlan={carePlan}
              isLoading={isSaving}
              onSubmit={handleUpdateSubmit}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 px-6 overflow-x-auto">
              {(["overview", "goals", "tasks", "reviews", "documents"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</p>
                    <Link
                      href={`/admin/clients/${carePlan.client_id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {carePlan.client?.first_name} {carePlan.client?.last_name}
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Primary Caregiver */}
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Primary Caregiver</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</p>
                    {carePlan.primary_caregiver ? (
                      <Link
                        href={`/admin/employees/${carePlan.primary_caregiver_id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {carePlan.primary_caregiver.first_name} {carePlan.primary_caregiver.last_name}
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-300">Not assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Plan Information */}
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Plan Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <Badge variant={getStatusColor(carePlan.status)} className="mt-1">
                      {carePlan.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Priority</p>
                    <Badge variant={getPriorityColor(carePlan.priority)} className="mt-1">
                      {carePlan.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(new Date(carePlan.start_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  {carePlan.review_date && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Review Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(new Date(carePlan.review_date), "dd MMM yyyy")}
                      </p>
                    </div>
                  )}
                  {carePlan.end_date && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">End Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(new Date(carePlan.end_date), "dd MMM yyyy")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              {carePlan.description && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle size="sm">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{carePlan.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Assessment Notes */}
              {carePlan.assessment_notes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle size="sm">Assessment Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{carePlan.assessment_notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === "goals" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Goals ({goals.length})</CardTitle>
                  <Link
                    href={`/admin/care-plans/${carePlanId}/goals/new`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Goal
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No goals yet</p>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{goal.goal_statement}</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                              <p>Priority: <span className="font-medium capitalize">{goal.priority}</span></p>
                              {goal.target_date && <p>Target: {formatDate(new Date(goal.target_date), "dd MMM yyyy")}</p>}
                              <p>Progress: {goal.completion_percentage}%</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tasks ({tasks.length})</CardTitle>
                  <Link
                    href={`/admin/care-plans/${carePlanId}/tasks/new`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No tasks yet</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{task.task_title}</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                              <p>Type: <span className="capitalize">{task.task_type}</span></p>
                              <p>Time: <span className="capitalize">{task.time_category}</span></p>
                              {task.estimated_duration_minutes && <p>Duration: {task.estimated_duration_minutes} minutes</p>}
                              {task.assigned_employee && (
                                <p>Assigned to: {task.assigned_employee.first_name} {task.assigned_employee.last_name}</p>
                              )}
                              {task.frequency && <p>Frequency: {task.frequency}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reviews ({reviews.length})</CardTitle>
                  <Link
                    href={`/admin/care-plans/${carePlanId}/reviews/new`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule Review
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No reviews scheduled</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatDate(new Date(review.scheduled_date), "dd MMM yyyy")}
                              </p>
                              <Badge variant={review.status === "completed" ? "success" : "primary"}>
                                {review.status}
                              </Badge>
                            </div>
                            {review.outcome && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Outcome</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{review.outcome}</p>
                              </div>
                            )}
                            {review.recommendations && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Recommendations</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{review.recommendations}</p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">Document management coming soon</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
