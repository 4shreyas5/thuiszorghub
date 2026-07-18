"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Employee, CreateEmployeePayload, UpdateEmployeePayload } from "@/types/employee";
import { createEmployeeSchema, updateEmployeeSchema } from "@/core/validation/employee";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface EmployeeFormProps {
  employee?: Employee;
  isLoading?: boolean;
  onSubmit: (data: CreateEmployeePayload | UpdateEmployeePayload) => Promise<void>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "casual", label: "Casual" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "archived", label: "Archived" },
];

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
          status: employee.status,
          emergency_contact_name: employee.emergency_contact_name,
          emergency_contact_phone: employee.emergency_contact_phone,
          emergency_contact_relationship: employee.emergency_contact_relationship,
        }
      : {},
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const response = await fetch("/api/branches?page=1&limit=100");
        if (response.ok) {
          const result = await response.json();
          const allBranches: Branch[] = result.data || [];
          setBranches(allBranches.filter((b) => b.is_active));
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="First Name"
            required
            placeholder="John"
            {...register("first_name")}
            error={getErrorMessage(errors.first_name)}
          />
          <Input
            label="Last Name"
            required
            placeholder="Doe"
            {...register("last_name")}
            error={getErrorMessage(errors.last_name)}
          />
          <Input
            label="Email"
            required
            type="email"
            placeholder="john@example.com"
            {...register("email")}
            error={getErrorMessage(errors.email)}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+31 6 12345678"
            {...register("phone")}
            error={getErrorMessage(errors.phone)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Employment</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Select
              label="Branch"
              required
              placeholder={loadingBranches ? "Loading branches..." : "Select a branch..."}
              disabled={loadingBranches || branches.length === 0}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
              {...register("branch_id")}
              error={getErrorMessage(errors.branch_id)}
            />
            {!loadingBranches && branches.length === 0 && (
              <p className="mt-1.5 flex items-center gap-1 text-sm text-warning-foreground">
                <AlertTriangle className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                No active branches available
              </p>
            )}
          </div>
          <Select
            label="Employment Type"
            required
            placeholder="Select employment type..."
            options={EMPLOYMENT_TYPE_OPTIONS}
            {...register("employment_type")}
            error={getErrorMessage(errors.employment_type)}
          />
          <Input
            label="Start Date"
            required
            type="date"
            {...register("start_date")}
            error={getErrorMessage(errors.start_date)}
          />
          <Input
            label="End Date"
            type="date"
            helperText="Leave blank for permanent employment"
            {...register("end_date")}
            error={getErrorMessage(errors.end_date)}
          />
          <Input
            label="Hourly Rate (€)"
            type="number"
            placeholder="25.00"
            step="0.01"
            {...register("hourly_rate", { valueAsNumber: true })}
            error={getErrorMessage(errors.hourly_rate)}
          />
          {employee && (
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              {...register("status")}
              error={getErrorMessage(errors.status)}
              helperText="Archiving is reversible - use the Activate action on an archived employee to restore them."
            />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Emergency Contact</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Who to reach if something happens during a shift.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Name"
            {...register("emergency_contact_name")}
            error={getErrorMessage(errors.emergency_contact_name)}
          />
          <Input
            label="Phone"
            type="tel"
            {...register("emergency_contact_phone")}
            error={getErrorMessage(errors.emergency_contact_phone)}
          />
          <Input
            label="Relationship"
            placeholder="Spouse, parent, sibling..."
            {...register("emergency_contact_relationship")}
            error={getErrorMessage(errors.emergency_contact_relationship)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Notes</h3>
        <div className="mt-4">
          <Textarea
            placeholder="Additional information about the employee..."
            {...register("bio")}
            error={getErrorMessage(errors.bio)}
            rows={4}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t border-border pt-6">
        <Button type="submit" loading={isLoading}>
          {employee ? "Save Changes" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
