import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface ExecutiveKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  previousValue?: number;
  currentValue?: number;
  inverted?: boolean;
  icon?: LucideIcon;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md" | "lg";
}

const colorVariants = {
  primary: {
    bg: "bg-primary/5",
    border: "border-primary/20",
    text: "text-primary",
    iconBg: "bg-primary/10",
  },
  success: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-500",
    iconBg: "bg-amber-500/10",
  },
  danger: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    text: "text-red-500",
    iconBg: "bg-red-500/10",
  },
  info: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  purple: {
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
    text: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
};

export const ExecutiveKPICard = ({
  title,
  value,
  subtitle,
  previousValue,
  currentValue,
  inverted = false,
  icon: Icon,
  color = "primary",
  size = "md",
}: ExecutiveKPICardProps) => {
  const variant = colorVariants[color];
  
  const getTrendIndicator = () => {
    if (previousValue === undefined || currentValue === undefined) return null;
    if (previousValue === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
    
    const diff = ((currentValue - previousValue) / previousValue) * 100;
    const isPositive = inverted ? diff < 0 : diff > 0;
    
    if (Math.abs(diff) < 1) return <Minus className="h-3 w-3 text-muted-foreground" />;
    
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
        isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
      )}>
        {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{Math.abs(diff).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
      variant.bg,
      variant.border,
      "border"
    )}>
      {/* Background decoration */}
      <div className={cn(
        "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5",
        variant.text.replace("text-", "bg-")
      )} />
      
      <CardContent className={cn(
        "relative",
        size === "sm" ? "pt-4 pb-3" : size === "lg" ? "pt-8 pb-6" : "pt-6 pb-4"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-muted-foreground font-medium truncate",
              size === "sm" ? "text-xs" : "text-sm"
            )}>
              {title}
            </p>
            <p className={cn(
              "font-bold tracking-tight mt-1",
              variant.text,
              size === "sm" ? "text-xl" : size === "lg" ? "text-4xl" : "text-2xl"
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {(previousValue !== undefined && currentValue !== undefined) && (
              <div className="mt-2">
                {getTrendIndicator()}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "rounded-xl p-3 flex-shrink-0",
              variant.iconBg
            )}>
              <Icon className={cn(
                variant.text,
                size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6"
              )} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
