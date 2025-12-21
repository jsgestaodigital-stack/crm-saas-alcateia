import React from "react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanLimitBadgeProps {
  type: 'users' | 'clients' | 'leads' | 'recurring' | 'tasks';
  currentCount: number;
  showProgress?: boolean;
  className?: string;
}

const typeLabels: Record<string, string> = {
  users: 'membros',
  clients: 'clientes',
  leads: 'leads',
  recurring: 'recorrentes',
  tasks: 'tarefas',
};

export const PlanLimitBadge: React.FC<PlanLimitBadgeProps> = ({
  type,
  currentCount,
  showProgress = false,
  className,
}) => {
  const { limits, isWithinLimit, getRemainingQuota, isLoading } = usePlanFeatures();
  
  if (isLoading) {
    return <Badge variant="secondary" className={className}>Carregando...</Badge>;
  }
  
  const maxValue = (() => {
    switch (type) {
      case 'users': return limits.maxUsers;
      case 'clients': return limits.maxClients;
      case 'leads': return limits.maxLeads;
      case 'recurring': return limits.maxRecurringClients;
      case 'tasks': return limits.limiteTarefasMes;
      default: return 0;
    }
  })();
  
  const remaining = getRemainingQuota(type, currentCount);
  const withinLimit = isWithinLimit(type, currentCount);
  const percentage = maxValue > 0 ? Math.min(100, (currentCount / maxValue) * 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  
  if (showProgress) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground capitalize">{typeLabels[type]}</span>
          <span className={cn(
            "font-medium",
            isAtLimit && "text-destructive",
            isNearLimit && !isAtLimit && "text-warning",
          )}>
            {currentCount} / {maxValue}
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isAtLimit && "[&>div]:bg-destructive",
            isNearLimit && !isAtLimit && "[&>div]:bg-warning",
          )}
        />
        {!withinLimit && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Limite atingido. Faça upgrade para continuar.
          </p>
        )}
      </div>
    );
  }
  
  return (
    <Badge 
      variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
      className={cn("gap-1", className)}
    >
      {isAtLimit ? (
        <AlertTriangle className="h-3 w-3" />
      ) : withinLimit ? (
        <CheckCircle className="h-3 w-3" />
      ) : null}
      {currentCount}/{maxValue} {typeLabels[type]}
    </Badge>
  );
};

/**
 * Component para mostrar upgrade CTA quando limite é atingido
 */
export const PlanLimitWarning: React.FC<{
  type: 'users' | 'clients' | 'leads' | 'recurring' | 'tasks';
  currentCount: number;
}> = ({ type, currentCount }) => {
  const { isWithinLimit, getRemainingQuota } = usePlanFeatures();
  
  if (isWithinLimit(type, currentCount)) {
    return null;
  }
  
  const remaining = getRemainingQuota(type, currentCount);
  
  return (
    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
      <div>
        <p className="font-medium text-destructive">Limite de {typeLabels[type]} atingido</p>
        <p className="text-muted-foreground">
          Faça upgrade do seu plano para adicionar mais {typeLabels[type]}.
        </p>
      </div>
    </div>
  );
};
