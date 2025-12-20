import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, XCircle, CheckCircle2, LucideIcon } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  subtitle?: string;
  value: string | number;
  severity: "critical" | "warning" | "info" | "success";
}

interface AlertsListProps {
  title: string;
  items: AlertItem[];
  icon?: LucideIcon;
  maxHeight?: string;
  emptyMessage?: string;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    badgeVariant: "destructive" as const,
    borderColor: "border-red-500/30",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    badgeVariant: "outline" as const,
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Clock,
    badgeVariant: "secondary" as const,
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-500",
  },
  success: {
    icon: CheckCircle2,
    badgeVariant: "outline" as const,
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-500",
  },
};

export const AlertsList = ({
  title,
  items,
  icon: HeaderIcon,
  maxHeight = "h-80",
  emptyMessage = "Nenhum item encontrado",
}: AlertsListProps) => {
  const hasCritical = items.some((i) => i.severity === "critical");

  return (
    <Card className={cn(
      "transition-all",
      hasCritical && "border-red-500/30 bg-red-500/5"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {HeaderIcon && <HeaderIcon className={cn("h-5 w-5", hasCritical ? "text-red-500" : "text-muted-foreground")} />}
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <ScrollArea className={maxHeight}>
            <div className="space-y-2 pr-3">
              {items.map((item) => {
                const config = severityConfig[item.severity];
                const ItemIcon = config.icon;
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg bg-muted/30 border transition-colors hover:bg-muted/50",
                      config.borderColor
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ItemIcon className={cn("h-4 w-4 flex-shrink-0", config.iconColor)} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={config.badgeVariant} className="flex-shrink-0 ml-2">
                      {item.value}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
