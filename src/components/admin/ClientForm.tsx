"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client, CreateClientPayload, UpdateClientPayload } from "@/types/client";
import { createClientSchema, updateClientSchema } from "@/core/validation/client";
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

interface ClientFormProps {
  client?: Client;
  isLoading?: boolean;
  onSubmit: (data: CreateClientPayload | UpdateClientPayload) => Promise<void>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const CASE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discharged", label: "Discharged" },
];

const RISK_LEVEL_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export function ClientForm({ client, isLoading, onSubmit }: ClientFormProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const schema = client ? updateClientSchema : createClientSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: client
      ? {
          first_name: client.first_name,
          last_name: client.last_name,
          date_of_birth: client.date_of_birth,
          email: client.email,
          phone: client.phone,
          branch_id: client.branch_id,
          case_status: client.case_status,
          risk_level: client.risk_level,
          status: client.status,
          emergency_contact_name: client.emergency_contact_name,
          emergency_contact_phone: client.emergency_contact_phone,
          notes: client.notes,
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
      if (!client) {
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
            label="Date of Birth"
            type="date"
            {...register("date_of_birth")}
            error={getErrorMessage(errors.date_of_birth)}
          />
          <Input
            label="Email"
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
        <h3 className="text-sm font-semibold text-foreground">Care</h3>
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
            label="Case Status"
            required
            placeholder="Select case status..."
            options={CASE_STATUS_OPTIONS}
            {...register("case_status")}
            error={getErrorMessage(errors.case_status)}
            helperText="Whether this client's care case is currently open."
          />
          <Select
            label="Risk Level"
            placeholder="Select risk level..."
            options={RISK_LEVEL_OPTIONS}
            {...register("risk_level")}
            error={getErrorMessage(errors.risk_level)}
          />
          {client && (
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              {...register("status")}
              error={getErrorMessage(errors.status)}
              helperText="Archiving is reversible - use the Activate action on an archived client to restore them."
            />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Emergency Contact</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Address</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Street Address"
            placeholder="123 Main Street"
            {...register("address_line_1")}
            error={getErrorMessage(errors.address_line_1)}
          />
          <Input
            label="Address Line 2"
            placeholder="Apartment, suite, etc."
            {...register("address_line_2")}
            error={getErrorMessage(errors.address_line_2)}
          />
          <Input
            label="Postal Code"
            placeholder="1234 AB"
            {...register("postal_code")}
            error={getErrorMessage(errors.postal_code)}
          />
          <Input
            label="City"
            placeholder="Amsterdam"
            {...register("city")}
            error={getErrorMessage(errors.city)}
          />
          <Input
            label="Country"
            placeholder="Netherlands"
            {...register("country")}
            error={getErrorMessage(errors.country)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Insurance</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Insurance Provider"
            placeholder="Insurance company name"
            {...register("insurance_provider")}
            error={getErrorMessage(errors.insurance_provider)}
          />
          <Input
            label="Policy Number"
            {...register("policy_number")}
            error={getErrorMessage(errors.policy_number)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Notes</h3>
        <div className="mt-4">
          <Textarea
            placeholder="Additional information about the client..."
            {...register("notes")}
            error={getErrorMessage(errors.notes)}
            rows={4}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t border-border pt-6">
        <Button type="submit" loading={isLoading}>
          {client ? "Save Changes" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
