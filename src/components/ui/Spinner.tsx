import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-current border-r-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-[3px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  label?: string;
}

export function Spinner({ size, className, label = "Loading" }: SpinnerProps) {
  return (
    <span role="status" className={cn(spinnerVariants({ size }), className)}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
