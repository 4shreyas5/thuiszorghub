/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Assignment, CreateAssignmentPayload, UpdateAssignmentPayload } from "@/types/assignment";
import { createAssignmentSchema, updateAssignmentSchema } from "@/core/validation/assignment";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useEffect, useState } from "react";
import { Loader, AlertCircle } from "lucide-react";

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

interface AssignmentFormProps {
  assignment?: Assignment;
  isLoading?: boolean;
  onSubmit: (data: CreateAssignmentPayload | UpdateAssignmentPayload) => Promise<void>;
}

export function AssignmentForm({ assignment, isLoading, onSubmit }: AssignmentFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const schema = assignment ? updateAssignmentSchema : createAssignmentSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: assignment
      ? {
          employee_id: assignment.employee_id,
          client_id: assignment.client_id,
          assigned_from: assignment.assigned_from,
          assigned_until: assignment.assigned_until,
          is_primary: assignment.is_primary,
          notes: assignment.notes,
        }
      : {},
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [employeesRes, clientsRes] = await Promise.all([
          fetch("/api/employees?page=1&limit=1000&status=active"),
          fetch("/api/clients?page=1&limit=1000&status=active"),
        ]);

        if (employeesRes.ok) {
          const data = await employeesRes.json();
          setEmployees(data.employees || []);
        }
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      if (!assignment) {
        reset();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const getErrorMessage = (error: any): string | undefined => {
    if (!error) return undefined;
    if (typeof error === "string") return error;
    if (error.message) return error.message;
    return undefined;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Employee *
          </label>
          <div className="relative">
            <select
              {...register("employee_id")}
              className={`
                w-full px-4 py-2 rounded-lg border appearance-none transition-colors
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  errors.employee_id
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }
              `}
              disabled={loadingData}
            >
              <option value="">Select an employee...</option>
              {loadingData ? (
                <option disabled>Loading employees...</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))
              )}
            </select>
          </div>
          {getErrorMessage(errors.employee_id) && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {getErrorMessage(errors.employee_id)}
            </p>
          )}
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client *
          </label>
          <div className="relative">
            <select
              {...register("client_id")}
              className={`
                w-full px-4 py-2 rounded-lg border appearance-none transition-colors
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  errors.client_id
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }
              `}
              disabled={loadingData}
            >
              <option value="">Select a client...</option>
              {loadingData ? (
                <option disabled>Loading clients...</option>
              ) : (
                clients.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.first_name} {cli.last_name}
                  </option>
                ))
              )}
            </select>
          </div>
          {getErrorMessage(errors.client_id) && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {getErrorMessage(errors.client_id)}
            </p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date *
          </label>
          <Input
            type="date"
            {...register("assigned_from")}
            error={getErrorMessage(errors.assigned_from)}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <Input
            type="date"
            {...register("assigned_until")}
            error={getErrorMessage(errors.assigned_until)}
          />
        </div>

        {/* Primary Assignment */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("is_primary")}
            id="is_primary"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_primary" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Primary Assignment
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <Textarea
          placeholder="Additional information about this assignment..."
          {...register("notes")}
          error={getErrorMessage(errors.notes)}
          rows={4}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex gap-2 items-center">
          {isLoading && <Loader className="w-4 h-4 animate-spin" />}
          {assignment ? "Update Assignment" : "Create Assignment"}
        </Button>
      </div>
    </form>
  );
}
