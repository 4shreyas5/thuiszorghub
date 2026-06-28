"use client";

import { useCurrentUser } from "./useCurrentUser";

export interface UseOrganizationReturn {
  organizationId: string | null;
  organizationName: string | null;
  isLoading: boolean;
}

export function useOrganization(): UseOrganizationReturn {
  const { user, isLoading } = useCurrentUser();

  return {
    organizationId: user?.organizationId || null,
    organizationName: null, // Placeholder - to be fetched from database
    isLoading,
  };
}
