import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 active:scale-[0.97] hover:-translate-y-0.5",
        destructive: 
          "bg-destructive text-destructive-foreground hover:brightness-110 shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.97]",
        outline: 
          "border-2 border-border bg-transparent hover:bg-primary/10 hover:border-primary/60 hover:text-primary active:scale-[0.97]",
        secondary: 
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50 shadow-sm active:scale-[0.97]",
        ghost: 
          "hover:bg-primary/10 hover:text-primary active:bg-primary/15",
        link: 
          "text-primary underline-offset-4 hover:underline font-medium",
        // Premium variants
        glow: 
          "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.55)] hover:brightness-110 active:scale-[0.97]",
        gradient: 
          "gradient-primary text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] bg-[length:200%_auto] hover:bg-right transition-[background-position,transform] duration-500 hover:-translate-y-0.5",
        emerald:
          "bg-emerald text-primary-foreground shadow-lg shadow-emerald/30 hover:shadow-xl hover:shadow-emerald/40 hover:brightness-110 active:scale-[0.97]",
        violet:
          "bg-violet text-white shadow-lg shadow-violet/30 hover:shadow-xl hover:shadow-violet/40 hover:brightness-110 active:scale-[0.97]",
        lavender:
          "bg-lavender text-accent-foreground shadow-lg shadow-lavender/30 hover:shadow-xl hover:shadow-lavender/40 hover:brightness-105 active:scale-[0.97]",
        success:
          "bg-status-success text-white hover:brightness-110 shadow-lg shadow-status-success/25 active:scale-[0.97]",
        warning:
          "bg-status-warning text-black hover:brightness-105 shadow-lg shadow-status-warning/25 active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-5 py-2 min-h-[44px]", // Minimum touch target
        sm: "h-9 rounded-lg px-4 text-xs min-h-[36px]",
        lg: "h-12 rounded-xl px-8 text-base min-h-[48px]",
        xl: "h-14 rounded-2xl px-10 text-base font-bold min-h-[56px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]", // Touch target for icons
        "icon-sm": "h-8 w-8 rounded-lg min-h-[32px] min-w-[32px]",
        "icon-lg": "h-12 w-12 rounded-xl min-h-[48px] min-w-[48px]",
        // Mobile-optimized sizes
        "mobile": "h-12 px-6 py-3 text-base min-h-[48px]",
        "mobile-icon": "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
