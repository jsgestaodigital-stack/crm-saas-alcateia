import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]",
        destructive: 
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg hover:shadow-destructive/20 active:scale-[0.98]",
        outline: 
          "border border-border bg-transparent hover:bg-secondary hover:border-primary/40 hover:text-primary active:scale-[0.98]",
        secondary: 
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50 active:scale-[0.98]",
        ghost: 
          "hover:bg-primary/10 hover:text-primary active:bg-primary/15",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // New premium variants
        glow: 
          "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:bg-primary/90 active:scale-[0.98]",
        gradient: 
          "bg-gradient-to-r from-primary via-neon-blue to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] bg-[length:200%_auto] hover:bg-right transition-[background-position] duration-500",
        success:
          "bg-status-success text-white hover:bg-status-success/90 shadow-md hover:shadow-lg hover:shadow-status-success/20 active:scale-[0.98]",
        warning:
          "bg-status-warning text-black hover:bg-status-warning/90 shadow-md hover:shadow-lg hover:shadow-status-warning/20 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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
