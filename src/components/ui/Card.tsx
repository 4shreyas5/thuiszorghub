import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  bordered?: boolean;
  hover?: boolean;
}

export function Card({
  children,
  className = "",
  padding = "md",
  bordered = false,
  hover = false,
}: CardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg
        ${paddingClasses[padding]}
        ${bordered ? "border border-gray-200 dark:border-gray-700" : ""}
        ${hover ? "hover:shadow-lg transition-shadow" : ""}
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CardTitle({ children, className = "", size = "md" }: CardTitleProps) {
  const sizeClasses = {
    sm: "text-lg font-semibold",
    md: "text-xl font-semibold",
    lg: "text-2xl font-bold",
  };

  return (
    <h3 className={`text-gray-900 dark:text-white ${sizeClasses[size]} ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={`text-gray-600 dark:text-gray-400 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div
      className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 ${className}`}
    >
      {children}
    </div>
  );
}
