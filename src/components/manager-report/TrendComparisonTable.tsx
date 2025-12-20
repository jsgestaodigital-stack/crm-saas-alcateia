import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface TrendItem {
  label: string;
  current: number;
  previous: number;
  icon?: LucideIcon;
  inverted?: boolean;
}

interface TrendComparisonTableProps {
  title: string;
  description?: string;
  items: TrendItem[];
  periodLabel?: string;
}

export const TrendComparisonTable = ({
  title,
  description,
  items,
  periodLabel = "vs período anterior",
}: TrendComparisonTableProps) => {
  const getTrendInfo = (current: number, previous: number, inverted: boolean = false) => {
    if (previous === 0) {
      return { diff: 0, isPositive: true, icon: Minus, color: "text-muted-foreground" };
    }
    
    const diff = ((current - previous) / previous) * 100;
    const isPositive = inverted ? diff < 0 : diff > 0;
    
    if (Math.abs(diff) < 1) {
      return { diff: 0, isPositive: true, icon: Minus, color: "text-muted-foreground" };
    }
    
    return {
      diff,
      isPositive,
      icon: diff > 0 ? TrendingUp : TrendingDown,
      color: isPositive ? "text-emerald-500" : "text-red-500",
    };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => {
            const trend = getTrendInfo(item.current, item.previous, item.inverted);
            const TrendIcon = trend.icon;
            const ItemIcon = item.icon;
            
            return (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {ItemIcon && (
                    <ItemIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-lg">{item.current}</span>
                      <span className="text-xs text-muted-foreground">
                        vs {item.previous}
                      </span>
                    </div>
                  </div>
                  
                  <Badge
                    variant="outline"
                    className={cn(
                      "min-w-[70px] justify-center",
                      trend.isPositive && trend.diff !== 0 && "border-emerald-500/30 bg-emerald-500/10",
                      !trend.isPositive && trend.diff !== 0 && "border-red-500/30 bg-red-500/10"
                    )}
                  >
                    <TrendIcon className={cn("h-3 w-3 mr-1", trend.color)} />
                    <span className={trend.color}>
                      {trend.diff === 0 ? "-" : `${Math.abs(trend.diff).toFixed(1)}%`}
                    </span>
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          {periodLabel}
        </p>
      </CardContent>
    </Card>
  );
};
