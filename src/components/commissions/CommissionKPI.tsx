import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CommissionKPIProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "danger" | "info";
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  format?: "currency" | "number" | "percent";
}

const COLOR_MAP = {
  primary: {
    bg: "bg-primary/5",
    border: "border-primary/20",
    text: "text-primary",
    iconBg: "bg-primary/10",
  },
  success: {
    bg: "bg-status-success/5",
    border: "border-status-success/20",
    text: "text-status-success",
    iconBg: "bg-status-success/10",
  },
  warning: {
    bg: "bg-status-warning/5",
    border: "border-status-warning/20",
    text: "text-status-warning",
    iconBg: "bg-status-warning/10",
  },
  danger: {
    bg: "bg-status-danger/5",
    border: "border-status-danger/20",
    text: "text-status-danger",
    iconBg: "bg-status-danger/10",
  },
  info: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-400",
    iconBg: "bg-blue-500/10",
  },
};

export function CommissionKPI({
  title,
  value,
  icon: Icon,
  color,
  trend,
  subtitle,
  format = "currency",
}: CommissionKPIProps) {
  const colors = COLOR_MAP[color];

  const formatValue = (val: number) => {
    if (format === "currency") {
      return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
    if (format === "percent") {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString("pt-BR");
  };

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  return (
    <Card className={cn(colors.bg, colors.border)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className={cn("text-2xl font-bold", colors.text)}>
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && TrendIcon && (
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon
                  className={cn(
                    "w-3 h-3",
                    trend.value > 0 ? "text-status-success" : trend.value < 0 ? "text-status-danger" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.value > 0 ? "text-status-success" : trend.value < 0 ? "text-status-danger" : "text-muted-foreground"
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value.toFixed(1)}%
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              colors.iconBg
            )}
          >
            <Icon className={cn("w-5 h-5", colors.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
