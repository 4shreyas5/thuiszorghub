"use client";

import { useCallback, useState } from "react";
import { AuthService } from "@/core/auth/service";
import type {
  SignInPayload,
  SignUpPayload,
  PasswordResetPayload,
  NewPasswordPayload,
} from "@/types/auth";

export interface UseAuthActionsReturn {
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (payload: PasswordResetPayload) => Promise<void>;
  resetPassword: (payload: NewPasswordPayload) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useAuthActions(): UseAuthActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(async (payload: SignInPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.signIn(payload);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign in failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.signUp(payload);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign up failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.signOut();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign out failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (payload: PasswordResetPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.requestPasswordReset(payload);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Password reset request failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (payload: NewPasswordPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.resetPassword(payload);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Password reset failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    resetPassword,
    isLoading,
    error,
  };
}
