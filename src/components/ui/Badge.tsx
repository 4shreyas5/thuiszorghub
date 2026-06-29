import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "md", className = "" }: BadgeProps) {
  const variantClasses = {
    default: "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
    primary: "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100",
    success: "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100",
    warning: "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100",
    danger: "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100",
    info: "bg-cyan-100 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs font-medium",
    md: "px-3 py-1 text-sm font-medium",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
