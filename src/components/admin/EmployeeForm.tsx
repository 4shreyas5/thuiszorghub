"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Employee, CreateEmployeePayload, UpdateEmployeePayload } from "@/types/employee";
import { createEmployeeSchema, updateEmployeeSchema } from "@/core/validation/employee";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useEffect, useState } from "react";
import { Loader, AlertCircle } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  employee?: Employee;
  isLoading?: boolean;
  onSubmit: (data: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function EmployeeForm({ employee, isLoading, onSubmit }: EmployeeFormProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const schema = employee ? updateEmployeeSchema : createEmployeeSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: employee
      ? {
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          branch_id: employee.branch_id,
          employment_type: employee.employment_type,
          start_date: employee.start_date,
          end_date: employee.end_date,
          hourly_rate: employee.hourly_rate,
          bio: employee.bio,
        }
      : {},
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const response = await fetch("/api/branches");
        if (response.ok) {
          const data = await response.json();
          setBranches(Array.isArray(data) ? data : data.branches || []);
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      if (!employee) {
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
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name *
          </label>
          <Input
            placeholder="John"
            {...register("first_name")}
            error={getErrorMessage(errors.first_name)}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name *
          </label>
          <Input
            placeholder="Doe"
            {...register("last_name")}
            error={getErrorMessage(errors.last_name)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <Input
            type="email"
            placeholder="john@example.com"
            {...register("email")}
            error={getErrorMessage(errors.email)}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone
          </label>
          <Input
            type="tel"
            placeholder="+31 6 12345678"
            {...register("phone")}
            error={getErrorMessage(errors.phone)}
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Branch *
          </label>
          <div className="relative">
            <select
              {...register("branch_id")}
              className={`
                w-full px-4 py-2 rounded-lg border appearance-none transition-colors
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  errors.branch_id
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }
              `}
              disabled={loadingBranches}
            >
              <option value="">Select a branch...</option>
              {loadingBranches ? (
                <option disabled>Loading branches...</option>
              ) : (
                branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))
              )}
            </select>
          </div>
          {getErrorMessage(errors.branch_id) && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {getErrorMessage(errors.branch_id)}
            </p>
          )}
        </div>

        {/* Employment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Employment Type *
          </label>
          <div className="relative">
            <select
              {...register("employment_type")}
              className={`
                w-full px-4 py-2 rounded-lg border appearance-none transition-colors
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  errors.employment_type
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }
              `}
            >
              <option value="">Select employment type...</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          {getErrorMessage(errors.employment_type) && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {getErrorMessage(errors.employment_type)}
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
            {...register("start_date")}
            error={getErrorMessage(errors.start_date)}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <Input
            type="date"
            {...register("end_date")}
            error={getErrorMessage(errors.end_date)}
          />
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hourly Rate (€)
          </label>
          <Input
            type="number"
            placeholder="25.00"
            step="0.01"
            {...register("hourly_rate", { valueAsNumber: true })}
            error={getErrorMessage(errors.hourly_rate)}
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <Textarea
          placeholder="Additional information about the employee..."
          {...register("bio")}
          error={getErrorMessage(errors.bio)}
          rows={4}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex gap-2 items-center">
          {isLoading && <Loader className="w-4 h-4 animate-spin" />}
          {employee ? "Update Employee" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
