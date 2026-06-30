"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { VisitForm } from "@/components/admin/VisitForm";
import { CreateVisitPayload } from "@/types/visit";

export default function NewVisitPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateVisitPayload) => {
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create visit");
      }

      const visit = await response.json();
      router.push(`/admin/visits/${visit.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create visit";
      setError(message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Visit"
        description="Schedule a new care visit"
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Visit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <VisitForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
