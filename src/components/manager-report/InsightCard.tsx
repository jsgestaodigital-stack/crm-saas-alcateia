import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface InsightCardProps {
  title: string;
  type: "positive" | "negative" | "warning" | "info" | "neutral";
  items: string[];
  icon?: LucideIcon;
}

const typeVariants = {
  positive: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    defaultIcon: TrendingUp,
    bulletBg: "bg-emerald-500",
  },
  negative: {
    bg: "bg-red-500/5",
    border: "border-red-500/30",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    defaultIcon: TrendingDown,
    bulletBg: "bg-red-500",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    defaultIcon: AlertTriangle,
    bulletBg: "bg-amber-500",
  },
  info: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    defaultIcon: Info,
    bulletBg: "bg-blue-500",
  },
  neutral: {
    bg: "bg-muted/30",
    border: "border-border",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    defaultIcon: CheckCircle2,
    bulletBg: "bg-muted-foreground",
  },
};

export const InsightCard = ({ title, type, items, icon }: InsightCardProps) => {
  const variant = typeVariants[type];
  const IconComponent = icon || variant.defaultIcon;

  if (items.length === 0) return null;

  return (
    <Card className={cn("border transition-all hover:shadow-md", variant.bg, variant.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className={cn("p-2 rounded-lg", variant.iconBg)}>
            <IconComponent className={cn("h-4 w-4", variant.iconColor)} />
          </div>
          <span className={variant.iconColor}>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                variant.bulletBg
              )} />
              <span className="text-sm text-foreground/80">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
