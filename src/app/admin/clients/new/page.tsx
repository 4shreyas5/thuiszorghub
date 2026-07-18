"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { ClientForm } from "@/components/admin/ClientForm";
import { Card } from "@/components/ui/Card";
import { CreateClientPayload, UpdateClientPayload } from "@/types/client";

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateClientPayload | UpdateClientPayload) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create client");

      router.push(`/admin/clients/${result.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create client";
      setError(message);
      console.error("Error creating client:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Client"
        description="Add a new client to start coordinating their care."
      />

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Card bordered padding="lg">
        <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}
