import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const skeletonVariants = cva(
  "animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--muted)_35%,var(--border)_50%,var(--muted)_65%)]",
  {
    variants: {
      variant: {
        text: "rounded h-4",
        circular: "rounded-full",
        rectangular: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "rectangular",
    },
  }
);

interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  className?: string;
}

export function Skeleton({ className, variant }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ variant }), className)} />;
}
