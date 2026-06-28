"use client";

import React from "react";
import Link from "next/link";

export interface ForbiddenProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionHref?: string;
}

export function Forbidden({
  title = "Access Denied",
  message = "You do not have permission to access this page.",
  actionText = "Go to Dashboard",
  actionHref = "/dashboard",
}: ForbiddenProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600 mb-6">{message}</p>
        <Link
          href={actionHref}
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </Link>
      </div>
    </div>
  );
}
