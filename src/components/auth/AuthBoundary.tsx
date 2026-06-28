"use client";

import React from "react";
import { AuthProvider } from "@/core/context/auth-context";

export interface AuthBoundaryProps {
  children: React.ReactNode;
}

export function AuthBoundary({ children }: AuthBoundaryProps): React.JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
