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
      // Supabase browser client handles all session and cookie management
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
      // Supabase browser client handles all session and cookie management

      // Create database user entry
      try {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            timezone: payload.timezone || "UTC",
            language: payload.language || "en",
          }),
        });

        if (!registerResponse.ok) {
          console.warn("Failed to create user database entry:", await registerResponse.json());
        }
      } catch (registerError) {
        console.warn("Error calling /api/auth/register:", registerError);
        // Don't fail signup if registration endpoint fails - user can still continue
      }
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
      // Supabase browser client clears all cookies automatically
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
