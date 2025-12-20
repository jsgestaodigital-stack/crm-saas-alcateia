import { RefreshCw, Users, Target, Building2, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyLimits, ResourceType } from "@/hooks/useAgencyLimits";
import { cn } from "@/lib/utils";

const resources: { key: ResourceType; label: string; icon: React.ElementType }[] = [
  { key: "users", label: "Usuários", icon: Users },
  { key: "leads", label: "Leads", icon: Target },
  { key: "clients", label: "Clientes", icon: Building2 },
  { key: "recurring_clients", label: "Recorrentes", icon: Repeat },
];

export function UsageOverview() {
  const { limits, usage, isLoading, getUsagePercentage, isNearLimit, isAtLimit, recalculateUsage } = useAgencyLimits();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!limits || !usage) {
    return null;
  }

  const currentMap: Record<ResourceType, number> = {
    users: usage.current_users,
    leads: usage.current_leads,
    clients: usage.current_clients,
    recurring_clients: usage.current_recurring_clients,
  };

  const maxMap: Record<ResourceType, number> = {
    users: limits.max_users,
    leads: limits.max_leads,
    clients: limits.max_clients,
    recurring_clients: limits.max_recurring_clients,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Uso do Plano</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => recalculateUsage.mutate()}
          disabled={recalculateUsage.isPending}
          title="Recalcular uso"
        >
          <RefreshCw className={cn("h-4 w-4", recalculateUsage.isPending && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.map(({ key, label, icon: Icon }) => {
          const current = currentMap[key];
          const max = maxMap[key];
          const percentage = getUsagePercentage(key);
          const nearLimit = isNearLimit(key);
          const atLimit = isAtLimit(key);

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                </div>
                <span
                  className={cn(
                    "font-medium",
                    atLimit && "text-destructive",
                    nearLimit && !atLimit && "text-warning"
                  )}
                >
                  {current}/{max}
                </span>
              </div>
              <Progress
                value={percentage}
                className={cn(
                  "h-2",
                  atLimit && "[&>div]:bg-destructive",
                  nearLimit && !atLimit && "[&>div]:bg-warning"
                )}
              />
            </div>
          );
        })}

        {usage.last_calculated_at && (
          <p className="text-xs text-muted-foreground pt-2">
            Atualizado: {new Date(usage.last_calculated_at).toLocaleString("pt-BR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
