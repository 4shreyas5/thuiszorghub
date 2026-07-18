import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";
import { Spinner } from "./Spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-[color,background-color,border-color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-card text-primary border border-primary/25 hover:bg-primary/5 hover:border-primary/40",
        destructive: "bg-danger text-danger-foreground hover:bg-danger/90",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-9 px-3 text-sm gap-1.5",
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-12 px-6 text-base gap-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean | undefined;
  icon?: ReactNode;
  /** Render as the single child element (Radix Slot) instead of a <button>. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, icon, disabled, asChild, ...props }, ref) => {
    // Slot requires exactly one child, so the loading-spinner wrapper markup
    // below (which renders two sibling <span>s) is incompatible with it.
    // asChild is for simple polymorphic rendering (e.g. <Button asChild><Link/></Button>),
    // not the loading/icon-wrapped internal button markup.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), loading && "relative", className)}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size="sm" />
          </span>
        ) : null}
        <span className={cn("flex items-center gap-2", loading && "invisible")}>
          {icon}
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
