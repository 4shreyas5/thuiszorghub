"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Building2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/core/context/auth-context";
import { Card } from "@/components/ui/Card";
import { FormSection } from "@/components/ui/FormSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface Organization {
  id: string;
  name: string;
  legal_name?: string;
  kvk_number?: string;
  vat_number?: string;
  email: string;
  phone?: string;
  website?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  country: string;
  primary_language: string;
  timezone: string;
  currency: string;
}

export default function OrganizationPage() {
  const { user: authUser, status } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Organization>>({});

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/organization");

      if (!response.ok) {
        let errorMsg = "Failed to fetch organization";
        try {
          const result = await response.json();
          errorMsg = result.error || errorMsg;
        } catch {
          // If response isn't JSON, use default message
        }
        setError(`Error ${response.status}: ${errorMsg}`);
        return;
      }

      const result = await response.json();
      if (result.data) {
        setFormData(result.data);
      } else {
        setError("No organization data returned");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch organization";
      setError(errorMsg);
      console.error("Error fetching organization:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask so these setState calls aren't synchronous within the effect body.
    queueMicrotask(() => {
      if (status === "loading") {
        setLoading(true);
        return;
      }

      if (status === "error") {
        setError("Authentication error occurred");
        setLoading(false);
        return;
      }

      if (status === "unauthenticated") {
        setError("You are not authenticated");
        setLoading(false);
        return;
      }

      if (!authUser) {
        setError("User profile not loaded");
        setLoading(false);
        return;
      }

      if (!authUser.organizationId) {
        setLoading(false);
        return;
      }

      fetchOrganization();
    });
  }, [status, authUser, fetchOrganization]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          legalName: formData.legal_name,
          kvkNumber: formData.kvk_number,
          vatNumber: formData.vat_number,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          addressLine1: formData.address_line_1,
          addressLine2: formData.address_line_2,
          city: formData.city,
          postalCode: formData.postal_code,
          country: formData.country,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(result.data);
        addToast({
          type: "success",
          message: "Organization updated",
          description: "Your changes have been saved.",
        });
      } else {
        addToast({
          type: "error",
          message: "Update failed",
          description: "Could not save organization settings.",
        });
      }
    } catch (error) {
      console.error("Error saving organization:", error);
      addToast({
        type: "error",
        message: "Update failed",
        description: "An unexpected error occurred while saving.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization"
          description="Manage your organization's profile and registration details."
        />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization"
          description="Manage your organization's profile and registration details."
        />
        <Card bordered padding="md">
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Couldn't load organization"
            description={error}
            action={
              <Button variant="outline" onClick={fetchOrganization}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (!authUser?.organizationId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization"
          description="Create and manage your organization's settings."
        />
        <Card bordered padding="lg" className="border-warning/40 bg-warning/5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
            <Building2 className={ICON_SIZE.lg} strokeWidth={ICON_STROKE_WIDTH} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Organization Setup Required
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Complete the organization setup to manage your registration, contact and address
            details.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/onboarding">Complete Setup</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Manage your organization's profile and registration details."
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection
          title="Organization Details"
          description="The primary identity of your organization."
        >
          <Input
            label="Organization Name"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
          />
          <Input
            label="Legal Name"
            name="legal_name"
            value={formData.legal_name || ""}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection
          title="Registration"
          description="Dutch Chamber of Commerce and tax identifiers."
        >
          <Input
            label="KVK Number"
            name="kvk_number"
            value={formData.kvk_number || ""}
            onChange={handleChange}
          />
          <Input
            label="VAT Number"
            name="vat_number"
            value={formData.vat_number || ""}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection
          title="Contact"
          description="How clients and partners reach your organization."
        >
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
          />
          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
          />
          <Input
            label="Website"
            type="url"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            className="md:col-span-2"
          />
        </FormSection>

        <FormSection title="Address" description="Primary registered address.">
          <Input
            label="Address Line 1"
            name="address_line_1"
            value={formData.address_line_1 || ""}
            onChange={handleChange}
            className="md:col-span-2"
          />
          <Input label="City" name="city" value={formData.city || ""} onChange={handleChange} />
          <Input
            label="Postal Code"
            name="postal_code"
            value={formData.postal_code || ""}
            onChange={handleChange}
          />
          <Input
            label="Country"
            name="country"
            value={formData.country || ""}
            onChange={handleChange}
          />
        </FormSection>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Looking for timezone, language, currency, or notification preferences? Those live in{" "}
            <Link href="/admin/settings" className="font-medium text-primary hover:underline">
              Settings
            </Link>
            .
          </p>
          <Button type="submit" loading={saving} className="sm:w-auto">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
