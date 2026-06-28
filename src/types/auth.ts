import { Timestamp, Locale } from "./common";

export interface AuthSession {
  user: AuthUser;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: Date;
  lastSignInAt: Date;
}

export interface SignUpPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone: string;
  language: Locale;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface PasswordResetPayload {
  email: string;
}

export interface NewPasswordPayload {
  token: string;
  password: string;
}

export interface UserProfile extends Timestamp {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  language: Locale;
  isActive: boolean;
  organizationId: string;
}

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

export interface AuthError {
  code: string;
  message: string;
  type: "auth" | "network" | "unknown";
}

export interface IdentityContext {
  user: UserProfile | null;
  session: AuthSession | null;
  status: AuthStatus;
  error: AuthError | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
