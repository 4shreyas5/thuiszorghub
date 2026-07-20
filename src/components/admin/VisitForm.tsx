"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createVisitSchema, updateVisitSchema } from "@/core/validation/visit";
import { Visit, CreateVisitPayload, UpdateVisitPayload, VisitType } from "@/types/visit";
import type { VisitConflict } from "@/core/scheduling/conflicts";
import { Button } from "@/components/ui/Button";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface VisitFormProps {
  visit?: Visit;
  isLoading?: boolean;
  onSubmit: (data: CreateVisitPayload | UpdateVisitPayload) => Promise<void>;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface Branch {
  id: string;
  name: string;
}

const VISIT_TYPES: { value: VisitType; label: string }[] = [
  { value: "personal_care", label: "Personal Care" },
  { value: "medication", label: "Medication" },
  { value: "companionship", label: "Companionship" },
  { value: "nursing", label: "Nursing" },
  { value: "cleaning", label: "Cleaning" },
  { value: "household", label: "Household" },
  { value: "assessment", label: "Assessment" },
  { value: "custom", label: "Custom" },
];

const PRIORITIES = ["low", "normal", "high", "urgent"];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An error occurred";
}

export function VisitForm({ visit, isLoading = false, onSubmit }: VisitFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const schema = visit ? updateVisitSchema : createVisitSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: visit
      ? {
          client_id: visit.client_id || "",
          employee_id: visit.employee_id || "",
          branch_id: visit.branch_id || "",
          care_plan_id: visit.care_plan_id || "",
          title: visit.title || "",
          visit_type: visit.visit_type || "personal_care",
          description: visit.description || "",
          scheduled_date: visit.scheduled_date || "",
          start_time: visit.start_time || "",
          end_time: visit.end_time || "",
          estimated_duration_minutes: visit.estimated_duration_minutes || 0,
          priority: visit.priority || "normal",
          notes: visit.notes || "",
        }
      : {},
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, employeesRes, branchesRes] = await Promise.all([
          fetch("/api/clients?page=1&limit=100"),
          fetch("/api/employees?page=1&limit=100"),
          fetch("/api/branches?page=1&limit=100"),
        ]);

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }

        if (employeesRes.ok) {
          const data = await employeesRes.json();
          setEmployees(data.employees || []);
        }

        if (branchesRes.ok) {
          const data = await branchesRes.json();
          setBranches(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };

    fetchData();
  }, []);

  const watchedEmployeeId = useWatch({ control, name: "employee_id" });
  const watchedClientId = useWatch({ control, name: "client_id" });
  const watchedDate = useWatch({ control, name: "scheduled_date" });
  const watchedStart = useWatch({ control, name: "start_time" });
  const watchedEnd = useWatch({ control, name: "end_time" });

  const [conflicts, setConflicts] = useState<VisitConflict[]>([]);

  useEffect(() => {
    if (!watchedEmployeeId || !watchedDate || !watchedStart || !watchedEnd) {
      // Deferred to a microtask so this setState call isn't synchronous within the effect body.
      queueMicrotask(() => setConflicts([]));
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/visits/conflicts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: watchedEmployeeId,
            clientId: watchedClientId || undefined,
            scheduledDate: watchedDate,
            startTime: watchedStart,
            endTime: watchedEnd,
            excludeVisitId: visit?.id,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setConflicts(data.conflicts || []);
        }
      } catch {
        // Non-blocking pre-submit hint - a failed live check shouldn't stop the user.
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [watchedEmployeeId, watchedClientId, watchedDate, watchedStart, watchedEnd, visit?.id]);

  const handleFormSubmit = async (data: CreateVisitPayload | UpdateVisitPayload) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="flex gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="flex gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-amber-800 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Possible scheduling conflicts</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {conflicts.map((conflict, i) => (
                <li key={i}>{conflict.message}</li>
              ))}
            </ul>
            {!conflicts.some((c) => c.type === "DOUBLE_BOOKING") && (
              <p className="mt-1 text-xs opacity-80">
                This won&apos;t block saving, but double-bookings will.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Client *
        </label>
        <select
          {...register("client_id")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
        {errors.client_id && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.client_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Employee
        </label>
        <select
          {...register("employee_id")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select an employee (optional)</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name}
            </option>
          ))}
        </select>
        {errors.employee_id && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {errors.employee_id.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Branch *
        </label>
        <select
          {...register("branch_id")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        {errors.branch_id && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.branch_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Title *
        </label>
        <input
          type="text"
          {...register("title")}
          placeholder="e.g., Morning Care Visit"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Visit Type *
        </label>
        <select
          {...register("visit_type")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select visit type</option>
          {VISIT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.visit_type && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.visit_type.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Scheduled Date *
        </label>
        <input
          type="date"
          {...register("scheduled_date")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.scheduled_date && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {errors.scheduled_date.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Start Time *
          </label>
          <input
            type="time"
            {...register("start_time")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.start_time && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.start_time.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            End Time *
          </label>
          <input
            type="time"
            {...register("end_time")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.end_time && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.end_time.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Priority
        </label>
        <select
          {...register("priority")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Notes
        </label>
        <textarea
          {...register("notes")}
          placeholder="Add any additional notes..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.notes && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? "Saving..." : visit ? "Update Visit" : "Create Visit"}
        </Button>
      </div>
    </form>
  );
}
