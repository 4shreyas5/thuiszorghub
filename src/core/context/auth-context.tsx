"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AuthService } from "@/core/auth/service";
import type { AuthSession, AuthStatus, AuthError, IdentityContext } from "@/types/auth";
import type { UserProfile } from "@/types/auth";

const AuthContext = createContext<IdentityContext | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<AuthError | null>(null);

  const isAuthenticated = status === "authenticated" && !!session && !!user;
  const isLoading = status === "loading";

  const initializeSession = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);

      const currentSession = await AuthService.getCurrentSession();

      if (currentSession) {
        setSession(currentSession);

        // In a real implementation, fetch full user profile from database
        // For now, use minimal profile from auth session
        const userProfile: UserProfile = {
          id: currentSession.user.id,
          userId: currentSession.user.id,
          email: currentSession.user.email,
          firstName: "", // To be fetched from database
          lastName: "", // To be fetched from database
          timezone: "UTC",
          language: "en",
          isActive: true,
          organizationId: "", // To be fetched from database
          createdAt: currentSession.user.createdAt,
          updatedAt: currentSession.user.createdAt,
        };

        setUser(userProfile);
        setStatus("authenticated");
      } else {
        setSession(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load session";
      setError({
        code: "SESSION_INIT_ERROR",
        message: errorMsg,
        type: "unknown",
      });
      setSession(null);
      setUser(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await initializeSession();
    };

    initialize();
  }, [initializeSession]);

  const value: IdentityContext = {
    user,
    session,
    status,
    error,
    isLoading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): IdentityContext {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
