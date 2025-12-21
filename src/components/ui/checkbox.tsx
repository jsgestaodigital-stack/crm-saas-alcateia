import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-lg border-2 border-border/60 ring-offset-background transition-all duration-200",
      "data-[state=checked]:bg-emerald data-[state=checked]:border-emerald data-[state=checked]:text-soft-black",
      "data-[state=checked]:shadow-[0_0_8px_hsl(var(--emerald)/0.4)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 focus-visible:ring-offset-2",
      "hover:border-emerald/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-3.5 w-3.5 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
