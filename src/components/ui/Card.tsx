import { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const cardVariants = cva(
  "bg-gradient-to-b from-card to-(--card-gradient-to) text-card-foreground rounded-xl shadow-sm",
  {
    variants: {
      padding: {
        sm: "p-4",
        md: "p-7",
        lg: "p-8",
      },
      bordered: {
        true: "border border-border/70",
        false: "",
      },
      hover: {
        true: "hover:shadow-md hover:border-primary/15 transition-[box-shadow,border-color]",
        false: "",
      },
    },
    defaultVariants: {
      padding: "md",
      bordered: false,
      hover: false,
    },
  }
);

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: ReactNode;
}

export function Card({ children, className, padding, bordered, hover, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ padding, bordered, hover }), className)} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  /** Adds a bottom rule under the header. Off by default - typography and
   *  spacing carry the structure instead of a boxed divider on every card. */
  divided?: boolean;
}

export function CardHeader({ children, className = "", divided = false }: CardHeaderProps) {
  return (
    <div className={cn("mb-5", divided && "pb-4 border-b border-border", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const titleSizeClasses = {
  sm: "text-lg font-semibold",
  md: "text-xl font-semibold",
  lg: "text-2xl font-semibold",
};

export function CardTitle({ children, className = "", size = "md" }: CardTitleProps) {
  return (
    <h3 className={cn("text-foreground tracking-tight", titleSizeClasses[size], className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={cn("text-muted-foreground", className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-border flex gap-2", className)}>{children}</div>
  );
}
