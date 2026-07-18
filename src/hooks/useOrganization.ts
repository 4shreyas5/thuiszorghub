/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";

export interface UseOrganizationReturn {
  organizationId: string | null;
  organizationName: string | null;
  logoUrl: string | null;
  isLoading: boolean;
}

export function useOrganization(): UseOrganizationReturn {
  const { user, isLoading: userLoading, isAuthenticated } = useCurrentUser();
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.organizationId) return;

    let cancelled = false;
    setFetching(true);

    fetch("/api/organization")
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (cancelled || !result?.data) return;
        setOrganizationName(result.data.name ?? null);
        setLogoUrl(result.data.logo_url ?? null);
      })
      .catch(() => {
        /* non-fatal — sidebar falls back to initials */
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.organizationId]);

  return {
    organizationId: user?.organizationId || null,
    organizationName,
    logoUrl,
    isLoading: userLoading || fetching,
  };
}
