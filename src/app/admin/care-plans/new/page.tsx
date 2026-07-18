/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { CarePlanForm } from "@/components/admin/CarePlanForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function NewCarePlanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setError(null);

      const response = await fetch("/api/care-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create care plan");
      }

      const carePlan = await response.json();
      router.push(`/admin/care-plans/${carePlan.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create care plan";
      setError(message);
      console.error("Error creating care plan:", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Care Plan" description="Create a new care plan for a client" />

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Care Plan Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CarePlanForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
