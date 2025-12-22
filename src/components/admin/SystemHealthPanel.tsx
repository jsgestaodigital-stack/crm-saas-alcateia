import { useSystemHealth } from '@/hooks/useSystemHealth';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCheck,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SystemHealthPanel() {
  const { 
    summary, 
    healthScore, 
    isLoading, 
    resolveAllErrors, 
    isResolving 
  } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="bg-surface-2 border border-border/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando status...</span>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-status-success';
    if (score >= 70) return 'text-status-warning';
    return 'text-status-danger';
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-status-success/10 border-status-success/30';
    if (score >= 70) return 'bg-status-warning/10 border-status-warning/30';
    return 'bg-status-danger/10 border-status-danger/30';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Atenção';
    return 'Crítico';
  };

  const unresolvedCount = summary?.unresolved_count || 0;
  const criticalCount = summary?.critical_count || 0;
  const last24hCount = summary?.last_24h_count || 0;

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all",
      getHealthBg(healthScore)
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={cn("w-5 h-5", getHealthColor(healthScore))} />
          <span className="font-medium text-foreground">Saúde do Sistema</span>
        </div>
        <Badge variant="outline" className={cn("font-mono", getHealthColor(healthScore))}>
          {healthScore}% - {getHealthLabel(healthScore)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {/* Unresolved */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded",
            unresolvedCount > 0 ? "bg-status-danger/20" : "bg-muted/20"
          )}>
            <AlertCircle className={cn(
              "w-4 h-4",
              unresolvedCount > 0 ? "text-status-danger" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="font-semibold">{unresolvedCount}</p>
          </div>
        </div>

        {/* Critical */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded",
            criticalCount > 0 ? "bg-status-danger/20" : "bg-muted/20"
          )}>
            <AlertTriangle className={cn(
              "w-4 h-4",
              criticalCount > 0 ? "text-status-danger" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Críticos</p>
            <p className="font-semibold">{criticalCount}</p>
          </div>
        </div>

        {/* Last 24h */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-muted/20">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
            <p className="font-semibold">{last24hCount}</p>
          </div>
        </div>

        {/* Last Error */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-muted/20">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Último erro</p>
            <p className="text-sm font-medium truncate">
              {summary?.last_error_at 
                ? formatDistanceToNow(new Date(summary.last_error_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })
                : 'Nenhum'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {unresolvedCount > 0 && (
        <div className="flex items-center justify-end pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resolveAllErrors()}
            disabled={isResolving}
            className="text-xs"
          >
            {isResolving ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3 mr-1" />
            )}
            Marcar todos como resolvidos
          </Button>
        </div>
      )}

      {unresolvedCount === 0 && healthScore >= 90 && (
        <div className="text-xs text-status-success flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Sistema operando normalmente
        </div>
      )}
    </div>
  );
}
