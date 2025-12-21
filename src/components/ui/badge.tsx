import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: 
          "border-transparent bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:brightness-110",
        secondary: 
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: 
          "border-transparent bg-destructive text-destructive-foreground shadow-md hover:brightness-110",
        outline: 
          "text-foreground border-border/60 hover:border-primary/50 hover:text-primary hover:bg-primary/5",
        // Status variants with glow effect
        success:
          "border-transparent bg-status-success/15 text-status-success font-semibold",
        warning:
          "border-transparent bg-status-warning/15 text-status-warning font-semibold",
        danger:
          "border-transparent bg-status-danger/15 text-status-danger font-semibold",
        info:
          "border-transparent bg-status-info/15 text-status-info font-semibold",
        purple:
          "border-transparent bg-status-purple/15 text-status-purple font-semibold",
        // Premium variants
        glow:
          "border-primary/50 bg-primary/15 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.25)]",
        emerald:
          "border-emerald/50 bg-emerald/15 text-emerald font-semibold",
        violet:
          "border-violet/50 bg-violet/15 text-violet font-semibold",
        lavender:
          "border-lavender/50 bg-lavender/20 text-lavender font-semibold",
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
