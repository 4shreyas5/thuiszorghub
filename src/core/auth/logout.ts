import { AuthService } from "./service";
import { SESSION_STORAGE_KEY } from "./session";

/**
 * Complete logout flow that:
 * 1. Terminates Supabase session
 * 2. Clears all client-side session data
 * 3. Clears cookies and storage
 * 4. Ensures user cannot access protected pages
 */
export async function performCompleteLogout(): Promise<void> {
  try {
    // Step 1: Sign out from Supabase (terminates session on server)
    await AuthService.signOut();

    // Step 2: Clear all browser storage
    if (typeof window !== "undefined") {
      // Clear localStorage
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.clear();
      } catch (e) {
        console.warn("Failed to clear localStorage:", e);
      }

      // Clear sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn("Failed to clear sessionStorage:", e);
      }

      // Clear cookies (including Supabase cookies)
      try {
        clearAllCookies();
      } catch (e) {
        console.warn("Failed to clear cookies:", e);
      }

      // Clear any cached data in window object
      const win = window as Window & { __APOLLO_STATE__?: unknown; __INITIAL_STATE__?: unknown };
      if (win.__APOLLO_STATE__) {
        delete win.__APOLLO_STATE__;
      }
      if (win.__INITIAL_STATE__) {
        delete win.__INITIAL_STATE__;
      }
    }

    // Step 3: Prevent browser back button from accessing cached pages
    // Add no-cache headers hint
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (e) {
        console.warn("Failed to clear cache:", e);
      }
    }
  } catch (error) {
    console.error("Error during logout:", error);
    // Continue with redirect even if logout fails
  }
}

/**
 * Clear all cookies from the browser
 */
function clearAllCookies(): void {
  const cookies = document.cookie.split(";");

  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

    if (name) {
      // Clear with all possible paths and domains
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${window.location.hostname};`;

      // Also try SameSite variants
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax;`;
    }
  });
}
