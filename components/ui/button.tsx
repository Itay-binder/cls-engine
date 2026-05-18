import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] text-white shadow-lg shadow-[var(--color-accent)]/20 hover:shadow-[var(--color-accent)]/40 hover:brightness-110 active:scale-[0.98]",
        outline:
          "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-card)] hover:border-[var(--color-accent)] active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] active:scale-[0.98]",
        destructive:
          "bg-[var(--color-danger)] text-white shadow-lg shadow-[var(--color-danger)]/20 hover:brightness-110 active:scale-[0.98]",
        secondary:
          "bg-[var(--color-secondary-dim)] text-[var(--color-secondary)] border border-[var(--color-secondary)]/20 hover:bg-[var(--color-secondary)]/20 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
