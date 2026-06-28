"use client";

import { useCurrentUser } from "./useCurrentUser";

export interface UseBranchReturn {
  branchId: string | null;
  branchName: string | null;
  isLoading: boolean;
}

export function useBranch(): UseBranchReturn {
  const { user, isLoading } = useCurrentUser();

  return {
    branchId: user?.createdAt ? null : null, // Placeholder - to be resolved from database
    branchName: null, // Placeholder - to be fetched from database
    isLoading,
  };
}
