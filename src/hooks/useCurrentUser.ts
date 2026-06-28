"use client";

import { useAuth } from "@/core/context/auth-context";
import type { UserProfile } from "@/types/auth";

export interface UseCurrentUserReturn {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
