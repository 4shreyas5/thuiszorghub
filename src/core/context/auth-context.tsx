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

        // Fetch full user profile from database via API.
        // A 404 here means the user has no `users` row yet, which is
        // expected pre-onboarding (organization_id is NOT NULL, so the
        // row can't exist until /api/organization creates it). In that
        // case, use a local placeholder profile instead of persisting
        // anything - onboarding is what creates the real row.
        try {
          const response = await fetch("/api/auth/profile");

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            const userProfile: UserProfile = {
              id: currentSession.user.id,
              userId: currentSession.user.id,
              email: currentSession.user.email,
              firstName: "",
              lastName: "",
              timezone: "UTC",
              language: "en",
              isActive: true,
              organizationId: "",
              createdAt: currentSession.user.createdAt,
              updatedAt: currentSession.user.createdAt,
            };
            setUser(userProfile);
          }
        } catch (profileError) {
          console.error("Failed to fetch user profile:", profileError);
          // Fallback to minimal profile
          const userProfile: UserProfile = {
            id: currentSession.user.id,
            userId: currentSession.user.id,
            email: currentSession.user.email,
            firstName: "",
            lastName: "",
            timezone: "UTC",
            language: "en",
            isActive: true,
            organizationId: "",
            createdAt: currentSession.user.createdAt,
            updatedAt: currentSession.user.createdAt,
          };
          setUser(userProfile);
        }

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

  // Set up real-time auth state listener from Supabase
  useEffect(() => {
    const { data: authListener } = AuthService.getAuthStateListener();

    // Properly handle auth state changes (logout, session expiry, etc)
    if (authListener?.subscription) {
      // The subscription is already handling state updates in the listener callback
      // When logout happens, the listener will fire with session=null
      // which triggers SessionManager.clearSession()
      // Then we need to update the context to reflect that
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [initializeSession]);

  // Re-check session periodically or when storage changes
  useEffect(() => {
    const handleStorageChange = async () => {
      await initializeSession();
    };

    // Listen for storage changes (logout from another tab)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [initializeSession]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/profile");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  }, []);

  const value: IdentityContext = {
    user,
    session,
    status,
    error,
    isLoading,
    isAuthenticated,
    refreshUser,
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
