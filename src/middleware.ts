import { NextRequest, NextResponse } from "next/server";
import { TenantResolver } from "@/core/middleware/tenant";

export const config = {
  matcher: ["/((?!_next|.*\\..*|api|public).*)", "/api/(.*)"],
};

export function middleware(request: NextRequest): NextResponse | void {
  // Extract tenant information
  const tenant = TenantResolver.extractFromRequest(request);

  // Add tenant context to response headers for use in handlers
  const response = NextResponse.next();

  if (tenant?.organizationId) {
    response.headers.set("x-organization-id", tenant.organizationId);
  }

  if (tenant?.branchId) {
    response.headers.set("x-branch-id", tenant.branchId);
  }

  if (tenant?.userId) {
    response.headers.set("x-user-id", tenant.userId);
  }

  return response;
}
