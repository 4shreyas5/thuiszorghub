import { NextRequest, NextResponse } from "next/server";
import { TenantResolver } from "@/core/middleware/tenant";

export const config = {
  matcher: ["/((?!_next|.*\\..*|public).*)", "/api/(.*)"],
};

export function middleware(request: NextRequest): NextResponse | void {
  const pathname = request.nextUrl.pathname;

  // Check for authorization token in header (will be set by fetch calls) or cookies
  const authHeader = request.headers.get("authorization");
  const authCookie = request.cookies.get("thuiszorghub-auth-token");
  const hasAuth = !!(authHeader || authCookie?.value);

  // Public routes that don't need authentication
  const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/"];

  // Protected routes that require authentication
  const isApiRoute = pathname.startsWith("/api");
  const isPageRoute = pathname.startsWith("/admin") || pathname.startsWith("/onboarding");
  const isProtectedRoute = isApiRoute || isPageRoute;

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  // If trying to access protected route without auth
  if (isProtectedRoute && !hasAuth) {
    // API routes return JSON 401, not HTML redirects
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Page routes redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth pages with auth, redirect to admin
  if (isPublicRoute && hasAuth && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Extract tenant information
  const tenant = TenantResolver.extractFromRequest(request);

  // Create response
  const response = NextResponse.next();

  // Add tenant context to response headers for use in handlers
  if (tenant?.organizationId) {
    response.headers.set("x-organization-id", tenant.organizationId);
  }

  if (tenant?.branchId) {
    response.headers.set("x-branch-id", tenant.branchId);
  }

  if (tenant?.userId) {
    response.headers.set("x-user-id", tenant.userId);
  }

  // Check for language preference
  const language = request.cookies.get("NEXT_LOCALE")?.value || "en";
  response.headers.set("x-language", language);

  // Add session refresh hint to headers
  response.headers.set("x-session-refresh-hint", "true");

  return response;
}
