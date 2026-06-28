import { AuthSession } from "@/types/auth";

export const SESSION_STORAGE_KEY = "thuiszorghub_session";
export const SESSION_COOKIE_NAME = "thuiszorghub_session";

export class SessionManager {
  static getSession(): AuthSession | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static setSession(session: AuthSession): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      console.error("Failed to store session");
    }
  }

  static clearSession(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      console.error("Failed to clear session");
    }
  }

  static isSessionValid(session: AuthSession | null): boolean {
    if (!session) {
      return false;
    }

    const now = Date.now() / 1000;
    return session.session.expiresAt > now;
  }

  static isSessionExpiring(session: AuthSession | null): boolean {
    if (!session) {
      return true;
    }

    const now = Date.now() / 1000;
    const fiveMinutesInSeconds = 5 * 60;

    return (
      session.session.expiresAt - now < fiveMinutesInSeconds && session.session.expiresAt > now
    );
  }
}
