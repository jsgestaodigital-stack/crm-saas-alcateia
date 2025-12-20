import { AlertTriangle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAgencyLimits, ResourceType } from "@/hooks/useAgencyLimits";

interface UsageLimitBannerProps {
  resource: ResourceType;
  showAlways?: boolean;
}

const resourceLabels: Record<ResourceType, string> = {
  users: "Usuários",
  leads: "Leads",
  clients: "Clientes",
  recurring_clients: "Clientes Recorrentes",
};

export function UsageLimitBanner({ resource, showAlways = false }: UsageLimitBannerProps) {
  const { limits, usage, isLoading, getUsagePercentage, isNearLimit, isAtLimit } = useAgencyLimits();

  if (isLoading || !limits || !usage) return null;

  const percentage = getUsagePercentage(resource);
  const nearLimit = isNearLimit(resource);
  const atLimit = isAtLimit(resource);

  // Só mostrar se está próximo do limite ou showAlways
  if (!showAlways && !nearLimit) return null;

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

  const current = currentMap[resource];
  const max = maxMap[resource];
  const label = resourceLabels[resource];

  if (atLimit) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Limite Atingido</AlertTitle>
        <AlertDescription>
          Você atingiu o limite de {max} {label.toLowerCase()}. 
          Entre em contato para aumentar seu plano.
        </AlertDescription>
      </Alert>
    );
  }

  if (nearLimit) {
    return (
      <Alert className="mb-4 border-warning bg-warning/10">
        <TrendingUp className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Próximo do Limite</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Você está usando {current} de {max} {label.toLowerCase()} ({percentage}%).
          </p>
          <Progress value={percentage} className="h-2" />
        </AlertDescription>
      </Alert>
    );
  }

  // showAlways mode - mostrar uso normal
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
      <span>{label}:</span>
      <Progress value={percentage} className="h-2 w-24" />
      <span>{current}/{max}</span>
    </div>
  );
}
