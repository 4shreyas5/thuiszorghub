"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { Card } from "@/components/ui/Card";
import { CreateEmployeePayload, UpdateEmployeePayload } from "@/types/employee";

export default function NewEmployeePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateEmployeePayload | UpdateEmployeePayload) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create employee");

      router.push(`/admin/employees/${result.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create employee";
      setError(message);
      console.error("Error creating employee:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Employee"
        description="Add a new caregiver or office staff member."
      />

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Card bordered padding="lg">
        <EmployeeForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}
