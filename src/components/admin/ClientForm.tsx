/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client, CreateClientPayload, UpdateClientPayload } from "@/types/client";
import { createClientSchema, updateClientSchema } from "@/core/validation/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useEffect, useState } from "react";
import { Loader, AlertCircle } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface ClientFormProps {
  client?: Client;
  isLoading?: boolean;
  onSubmit: (data: CreateClientPayload | UpdateClientPayload) => Promise<void>;
}

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

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date of Birth
          </label>
          <Input
            type="date"
            {...register("date_of_birth")}
            error={getErrorMessage(errors.date_of_birth)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
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

        {/* Case Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Case Status *
          </label>
          <div className="relative">
            <select
              {...register("case_status")}
              className={`
                w-full px-4 py-2 rounded-lg border appearance-none transition-colors
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  errors.case_status
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }
              `}
            >
              <option value="">Select case status...</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
          {getErrorMessage(errors.case_status) && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {getErrorMessage(errors.case_status)}
            </p>
          )}
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Risk Level
          </label>
          <div className="relative">
            <select
              {...register("risk_level")}
              className={`
                w-full px-4 py-2 rounded-lg border appearance-none transition-colors
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-offset-0
                ${
                  errors.risk_level
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                }
              `}
            >
              <option value="">Select risk level...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Emergency Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Emergency Contact Name
          </label>
          <Input
            placeholder="Emergency contact name"
            {...register("emergency_contact_name")}
            error={getErrorMessage(errors.emergency_contact_name)}
          />
        </div>

        {/* Emergency Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Emergency Contact Phone
          </label>
          <Input
            type="tel"
            placeholder="+31 6 12345678"
            {...register("emergency_contact_phone")}
            error={getErrorMessage(errors.emergency_contact_phone)}
          />
        </div>

        {/* Address Line 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Street Address
          </label>
          <Input
            placeholder="123 Main Street"
            {...register("address_line_1")}
            error={getErrorMessage(errors.address_line_1)}
          />
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address Line 2
          </label>
          <Input
            placeholder="Apartment, suite, etc."
            {...register("address_line_2")}
            error={getErrorMessage(errors.address_line_2)}
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Postal Code
          </label>
          <Input
            placeholder="1234 AB"
            {...register("postal_code")}
            error={getErrorMessage(errors.postal_code)}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City
          </label>
          <Input
            placeholder="Amsterdam"
            {...register("city")}
            error={getErrorMessage(errors.city)}
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country
          </label>
          <Input
            placeholder="Netherlands"
            {...register("country")}
            error={getErrorMessage(errors.country)}
          />
        </div>

        {/* Insurance Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Insurance Provider
          </label>
          <Input
            placeholder="Insurance company name"
            {...register("insurance_provider")}
            error={getErrorMessage(errors.insurance_provider)}
          />
        </div>

        {/* Policy Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Policy Number
          </label>
          <Input
            placeholder="Policy number"
            {...register("policy_number")}
            error={getErrorMessage(errors.policy_number)}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <Textarea
          placeholder="Additional information about the client..."
          {...register("notes")}
          error={getErrorMessage(errors.notes)}
          rows={4}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex gap-2 items-center">
          {isLoading && <Loader className="w-4 h-4 animate-spin" />}
          {client ? "Update Client" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
