/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { AssignmentForm } from "@/components/admin/AssignmentForm";
import { Card } from "@/components/ui/Card";

export default function NewAssignmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create assignment");
      }

      const assignment = await response.json();
      router.push(`/admin/assignments/${assignment.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create assignment";
      setError(message);
      console.error("Error creating assignment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Assignment" description="Assign a caregiver to a client." />

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Card bordered padding="lg">
        <AssignmentForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}
