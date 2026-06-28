"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/core/context/auth-context";
import { LoadingScreen } from "./LoadingScreen";
import { Unauthorized } from "./Unauthorized";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return fallback ? <>{fallback}</> : <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Unauthorized />;
  }

  return <>{children}</>;
}
