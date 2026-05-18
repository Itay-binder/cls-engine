import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] border border-[var(--color-accent)]/20",
        success:
          "bg-[var(--color-success-dim)] text-[var(--color-success)] border border-[var(--color-success)]/20",
        warning:
          "bg-[var(--color-warning-dim)] text-[var(--color-warning)] border border-[var(--color-warning)]/20",
        danger:
          "bg-[var(--color-danger-dim)] text-[var(--color-danger)] border border-[var(--color-danger)]/20",
        secondary:
          "bg-[var(--color-secondary-dim)] text-[var(--color-secondary)] border border-[var(--color-secondary)]/20",
        outline:
          "bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
