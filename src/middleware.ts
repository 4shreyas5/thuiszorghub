import { NextRequest, NextResponse } from "next/server";
import { TenantResolver } from "@/core/middleware/tenant";

export const config = {
  matcher: ["/((?!_next|.*\\..*|public).*)", "/api/(.*)"],
};

export function middleware(request: NextRequest): NextResponse | void {
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
