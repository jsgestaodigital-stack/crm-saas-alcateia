import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color?: "primary" | "blue" | "amber" | "purple" | "emerald" | "red";
}

const colorVariants = {
  primary: {
    icon: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    glow: "shadow-primary/20",
  },
  blue: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
  },
  amber: {
    icon: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  purple: {
    icon: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
  },
  emerald: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  red: {
    icon: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
  },
};

export const SectionHeader = ({ title, subtitle, icon: Icon, color = "primary" }: SectionHeaderProps) => {
  const variant = colorVariants[color];
  
  return (
    <div className="relative mb-6">
      {/* Decorative line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-full",
        variant.bg.replace("/10", "")
      )} />
      
      <div className="pl-5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl border shadow-lg",
            variant.bg,
            variant.border,
            variant.glow
          )}>
            <Icon className={cn("h-6 w-6", variant.icon)} />
          </div>
          <div>
            <h2 className={cn("text-2xl font-bold tracking-tight", variant.icon)}>
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
