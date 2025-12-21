import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles with mobile-first sizing (min 44px touch target)
          "flex h-12 min-h-[44px] w-full rounded-xl border-2 border-border/50 bg-input/60 px-4 py-2",
          // Typography - 16px on mobile prevents iOS zoom, smaller on desktop
          "text-base ring-offset-background transition-all duration-250",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder
          "placeholder:text-muted-foreground/60",
          // Focus states with better visibility
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0",
          "focus-visible:border-primary/70 focus-visible:bg-input/80",
          "focus-visible:shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
          // Hover states
          "hover:border-border/70 hover:bg-input/70",
          // Disabled states
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Desktop refinement - slightly smaller text
          "md:h-11 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
