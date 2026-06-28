import { supabaseBrowserClient } from "./clients";
import { SessionManager } from "./session";
import {
  AuthenticationError,
  SessionError,
  NetworkError,
  isIdentityError,
} from "@/core/errors/types";
import type {
  AuthSession,
  SignInPayload,
  SignUpPayload,
  PasswordResetPayload,
  NewPasswordPayload,
} from "@/types/auth";

export class AuthService {
  static getAuthStateListener() {
    try {
      return supabaseBrowserClient.auth.onAuthStateChange((_event, session) => {
        if (session) {
          SessionManager.setSession({
            user: {
              id: session.user.id,
              email: session.user.email || "",
              emailConfirmed: session.user.email_confirmed_at !== null,
              createdAt: new Date(session.user.created_at),
              lastSignInAt: new Date(session.user.last_sign_in_at || session.user.created_at),
            },
            session: {
              accessToken: session.access_token,
              refreshToken: session.refresh_token || "",
              expiresIn: session.expires_in || 3600,
              expiresAt: Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
            },
          });
        } else {
          SessionManager.clearSession();
        }
      });
    } catch (error) {
      console.error("Failed to set up auth state listener:", error);
      return { data: { subscription: null } };
    }
  }

  static async signIn(payload: SignInPayload): Promise<AuthSession> {
    try {
      const { data, error } = await supabaseBrowserClient.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });

      if (error) {
        throw new AuthenticationError(
          error.message,
          error.status === 400 ? "INVALID_CREDENTIALS" : "AUTH_FAILED"
        );
      }

      if (!data.session || !data.user) {
        throw new AuthenticationError("No session returned from server", "NO_SESSION");
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          emailConfirmed: data.user.email_confirmed_at !== null,
          createdAt: new Date(data.user.created_at),
          lastSignInAt: new Date(data.user.last_sign_in_at || data.user.created_at),
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || "",
          expiresIn: data.session.expires_in || 3600,
          expiresAt: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
        },
      };

      SessionManager.setSession(session);
      return session;
    } catch (error) {
      if (isIdentityError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes("network")) {
          throw new NetworkError(error.message);
        }
      }

      throw new AuthenticationError("Sign in failed", "SIGN_IN_FAILED");
    }
  }

  static async signUp(payload: SignUpPayload): Promise<AuthSession> {
    try {
      const { data, error } = await supabaseBrowserClient.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            first_name: payload.firstName,
            last_name: payload.lastName,
            timezone: payload.timezone,
            language: payload.language,
          },
        },
      });

      if (error) {
        throw new AuthenticationError(error.message, "SIGN_UP_FAILED");
      }

      if (!data.session || !data.user) {
        throw new AuthenticationError("No session returned from server", "NO_SESSION");
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          emailConfirmed: data.user.email_confirmed_at !== null,
          createdAt: new Date(data.user.created_at),
          lastSignInAt: new Date(data.user.created_at),
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || "",
          expiresIn: data.session.expires_in || 3600,
          expiresAt: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
        },
      };

      SessionManager.setSession(session);
      return session;
    } catch (error) {
      if (isIdentityError(error)) {
        throw error;
      }

      throw new AuthenticationError("Sign up failed", "SIGN_UP_FAILED");
    }
  }

  static async signOut(): Promise<void> {
    try {
      const { error } = await supabaseBrowserClient.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
      }

      SessionManager.clearSession();
    } catch (error) {
      console.error("Sign out failed:", error);
      SessionManager.clearSession();
    }
  }

  static async requestPasswordReset(payload: PasswordResetPayload): Promise<void> {
    try {
      const { error } = await supabaseBrowserClient.auth.resetPasswordForEmail(payload.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new AuthenticationError(error.message, "PASSWORD_RESET_FAILED");
      }
    } catch (error) {
      if (isIdentityError(error)) {
        throw error;
      }

      throw new AuthenticationError("Password reset request failed", "PASSWORD_RESET_FAILED");
    }
  }

  static async resetPassword(payload: NewPasswordPayload): Promise<AuthSession> {
    try {
      const { data, error } = await supabaseBrowserClient.auth.updateUser({
        password: payload.password,
      });

      if (error) {
        throw new AuthenticationError(error.message, "PASSWORD_RESET_FAILED");
      }

      if (!data.user) {
        throw new AuthenticationError("No user returned", "PASSWORD_RESET_FAILED");
      }

      const currentSession = await supabaseBrowserClient.auth.getSession();

      if (!currentSession.data.session) {
        throw new SessionError("No active session", "SESSION_NOT_FOUND");
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          emailConfirmed: data.user.email_confirmed_at !== null,
          createdAt: new Date(data.user.created_at),
          lastSignInAt: new Date(data.user.last_sign_in_at || data.user.created_at),
        },
        session: {
          accessToken: currentSession.data.session.access_token,
          refreshToken: currentSession.data.session.refresh_token || "",
          expiresIn: currentSession.data.session.expires_in || 3600,
          expiresAt:
            Math.floor(Date.now() / 1000) + (currentSession.data.session.expires_in || 3600),
        },
      };

      SessionManager.setSession(session);
      return session;
    } catch (error) {
      if (isIdentityError(error)) {
        throw error;
      }

      throw new AuthenticationError("Password reset failed", "PASSWORD_RESET_FAILED");
    }
  }

  static async refreshSession(): Promise<AuthSession | null> {
    try {
      const { data } = await supabaseBrowserClient.auth.refreshSession();

      if (!data.session) {
        SessionManager.clearSession();
        return null;
      }

      const user = data.session.user;
      if (!user) {
        SessionManager.clearSession();
        return null;
      }

      const session: AuthSession = {
        user: {
          id: user.id,
          email: user.email || "",
          emailConfirmed: user.email_confirmed_at !== null,
          createdAt: new Date(user.created_at),
          lastSignInAt: new Date(user.last_sign_in_at || user.created_at),
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || "",
          expiresIn: data.session.expires_in || 3600,
          expiresAt: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
        },
      };

      SessionManager.setSession(session);
      return session;
    } catch {
      SessionManager.clearSession();
      return null;
    }
  }

  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data } = await supabaseBrowserClient.auth.getSession();

      if (!data.session) {
        return SessionManager.getSession();
      }

      const user = data.session.user;
      if (!user) {
        return SessionManager.getSession();
      }

      const session: AuthSession = {
        user: {
          id: user.id,
          email: user.email || "",
          emailConfirmed: user.email_confirmed_at !== null,
          createdAt: new Date(user.created_at),
          lastSignInAt: new Date(user.last_sign_in_at || user.created_at),
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || "",
          expiresIn: data.session.expires_in || 3600,
          expiresAt: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
        },
      };

      SessionManager.setSession(session);
      return session;
    } catch {
      return SessionManager.getSession();
    }
  }
}
