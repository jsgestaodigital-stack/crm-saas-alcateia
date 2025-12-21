import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: 
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: 
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: 
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: 
          "text-foreground border-border/60 hover:border-primary/40 hover:text-primary",
        // New status variants
        success:
          "border-transparent bg-status-success/15 text-status-success",
        warning:
          "border-transparent bg-status-warning/15 text-status-warning",
        danger:
          "border-transparent bg-status-danger/15 text-status-danger",
        info:
          "border-transparent bg-status-info/15 text-status-info",
        purple:
          "border-transparent bg-status-purple/15 text-status-purple",
        // Glow variant
        glow:
          "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
