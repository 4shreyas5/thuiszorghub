"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCarePlanSchema, updateCarePlanSchema } from "@/core/validation/care-plan";
import { CarePlan, CreateCarePlanPayload, UpdateCarePlanPayload } from "@/types/care-plan";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

interface CarePlanFormProps {
  carePlan?: CarePlan;
  isLoading?: boolean;
  onSubmit: (data: CreateCarePlanPayload | UpdateCarePlanPayload) => Promise<void>;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Branch {
  id: string;
  name: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An error occurred";
}

export function CarePlanForm({ carePlan, isLoading = false, onSubmit }: CarePlanFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const schema = carePlan ? updateCarePlanSchema : createCarePlanSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: carePlan ? {
      client_id: carePlan.client_id || "",
      branch_id: carePlan.branch_id || "",
      primary_caregiver_id: carePlan.primary_caregiver_id || "",
      title: carePlan.title || "",
      description: carePlan.description || "",
      assessment_notes: carePlan.assessment_notes || "",
      status: carePlan.status || "draft",
      priority: carePlan.priority || "normal",
      start_date: carePlan.start_date || "",
      review_date: carePlan.review_date || "",
      end_date: carePlan.end_date || "",
    } : {},
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
          setBranches(data.branches || data);
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };

    fetchData();
  }, []);

  const handleFormSubmit = async (data: CreateCarePlanPayload | UpdateCarePlanPayload) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.client_id.message}
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
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.branch_id.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Primary Caregiver
          </label>
          <select
            {...register("primary_caregiver_id")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an employee (optional)</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Title *
          </label>
          <input
            type="text"
            {...register("title")}
            placeholder="e.g., Post-Surgery Recovery Plan"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.title.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Description
        </label>
        <textarea
          {...register("description")}
          placeholder="Describe the care plan..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Assessment Notes
        </label>
        <textarea
          {...register("assessment_notes")}
          placeholder="Assessment and evaluation notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Status *
          </label>
          <select
            {...register("status")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Priority *
          </label>
          <select
            {...register("priority")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Start Date *
          </label>
          <input
            type="date"
            {...register("start_date")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.start_date && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {errors.start_date.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Review Date
          </label>
          <input
            type="date"
            {...register("review_date")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            End Date
          </label>
          <input
            type="date"
            {...register("end_date")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? "Saving..." : carePlan ? "Update Plan" : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}
