"use client";

import { useAuth } from "@/core/context/auth-context";
import type { AuthSession, AuthStatus } from "@/types/auth";

export interface UseSessionReturn {
  session: AuthSession | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useSession(): UseSessionReturn {
  const { session, status, isLoading, isAuthenticated } = useAuth();

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
  };
}
