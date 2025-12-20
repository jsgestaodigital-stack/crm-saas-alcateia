import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Repeat,
  Activity,
  ShoppingCart,
  Briefcase,
  Award,
  Gauge,
  Heart
} from 'lucide-react';
import { EnterpriseKPICard, EnterpriseMetricRow } from '@/components/ui/enterprise-card';
import { cn } from '@/lib/utils';

interface ExecutiveSummaryProps {
  data: {
    // Financial
    mrr: number;
    pipelineValue: number;
    pendingCommissions: number;
    annualProjection: number;
    
    // Sales
    activeLeads: number;
    hotLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    
    // Operations
    activeClients: number;
    stalledClients: number;
    readyToDeliver: number;
    delivered: number;
    
    // Recurring
    recurringClients: number;
    weeklyCompliance: number;
    completedTasks: number;
    totalTasks: number;
    
    // Trends
    mrrTrend?: number;
    leadsTrend?: number;
    deliveredTrend?: number;
  };
  className?: string;
}

export function ExecutiveSummary({ data, className }: ExecutiveSummaryProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  // Calculate health score (0-100)
  const healthScore = useMemo(() => {
    let score = 50; // Base score
    
    // Sales health (+/- 20)
    if (data.hotLeads > 0) score += 10;
    if (data.qualifiedLeads > data.activeLeads * 0.3) score += 10;
    
    // Operations health (+/- 20)
    if (data.stalledClients === 0) score += 10;
    else if (data.stalledClients > 5) score -= 10;
    if (data.readyToDeliver > 0) score += 5;
    
    // Compliance health (+/- 20)
    if (data.weeklyCompliance >= 80) score += 15;
    else if (data.weeklyCompliance < 50) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  }, [data]);

  const healthColor = healthScore >= 80 ? 'emerald' : healthScore >= 60 ? 'amber' : 'red';
  const healthLabel = healthScore >= 80 ? 'Excelente' : healthScore >= 60 ? 'Atenção' : 'Crítico';

  return (
    <div className={cn("space-y-6", className)}>
      {/* Business Health Indicator */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-surface-1/50 to-surface-2/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saúde do Negócio</p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className={cn(
                "text-5xl font-bold font-mono",
                healthColor === 'emerald' && "text-emerald-400",
                healthColor === 'amber' && "text-amber-400",
                healthColor === 'red' && "text-red-400"
              )}>
                {healthScore}
              </span>
              <span className={cn(
                "text-lg font-semibold",
                healthColor === 'emerald' && "text-emerald-400",
                healthColor === 'amber' && "text-amber-400",
                healthColor === 'red' && "text-red-400"
              )}>
                {healthLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado em vendas, operações e compliance
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl",
            healthColor === 'emerald' && "bg-emerald-500/20",
            healthColor === 'amber' && "bg-amber-500/20",
            healthColor === 'red' && "bg-red-500/20"
          )}>
            <Heart className={cn(
              "h-10 w-10",
              healthColor === 'emerald' && "text-emerald-400",
              healthColor === 'amber' && "text-amber-400",
              healthColor === 'red' && "text-red-400"
            )} />
          </div>
        </div>
        
        {/* Health Breakdown */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/30">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Vendas</div>
            <div className={cn("text-lg font-bold", data.hotLeads > 0 ? "text-emerald-400" : "text-muted-foreground")}>
              {data.hotLeads > 0 ? '●' : '○'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Operações</div>
            <div className={cn("text-lg font-bold", data.stalledClients <= 2 ? "text-emerald-400" : "text-amber-400")}>
              {data.stalledClients <= 2 ? '●' : '◐'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Entregas</div>
            <div className={cn("text-lg font-bold", data.readyToDeliver > 0 ? "text-emerald-400" : "text-muted-foreground")}>
              {data.readyToDeliver > 0 ? '●' : '○'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Compliance</div>
            <div className={cn("text-lg font-bold", data.weeklyCompliance >= 80 ? "text-emerald-400" : data.weeklyCompliance >= 50 ? "text-amber-400" : "text-red-400")}>
              {data.weeklyCompliance >= 80 ? '●' : data.weeklyCompliance >= 50 ? '◐' : '○'}
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseKPICard
          title="MRR"
          value={formatCurrency(data.mrr)}
          subtitle={`${data.recurringClients} clientes recorrentes`}
          trend={data.mrrTrend ? { value: data.mrrTrend, direction: data.mrrTrend > 0 ? 'up' : 'down', label: 'vs mês anterior' } : undefined}
          icon={<Repeat className="h-5 w-5" />}
          variant="emerald"
          insight={data.mrr > 10000 ? {
            type: 'success',
            message: 'Receita recorrente saudável'
          } : undefined}
        />
        
        <EnterpriseKPICard
          title="Pipeline"
          value={formatCurrency(data.pipelineValue)}
          subtitle={`${data.activeLeads} leads ativos`}
          trend={data.leadsTrend ? { value: data.leadsTrend, direction: data.leadsTrend > 0 ? 'up' : 'down' } : undefined}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="blue"
          insight={data.hotLeads > 3 ? {
            type: 'warning',
            message: `${data.hotLeads} leads quentes precisam de atenção`
          } : undefined}
        />
        
        <EnterpriseKPICard
          title="Comissões Pendentes"
          value={formatCurrency(data.pendingCommissions)}
          subtitle="Aguardando liberação"
          icon={<Award className="h-5 w-5" />}
          variant="amber"
        />
        
        <EnterpriseKPICard
          title="Projeção Anual"
          value={formatCurrency(data.annualProjection)}
          subtitle="Com base no MRR atual"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="violet"
        />
      </div>

      {/* Operational Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <EnterpriseKPICard
          title="Em Otimização"
          value={data.activeClients}
          subtitle="Clientes ativos"
          icon={<Briefcase className="h-4 w-4" />}
          variant="default"
          size="sm"
        />
        
        <EnterpriseKPICard
          title="Parados"
          value={data.stalledClients}
          subtitle="Atenção necessária"
          icon={<Activity className="h-4 w-4" />}
          variant={data.stalledClients > 3 ? "danger" : data.stalledClients > 0 ? "warning" : "success"}
          size="sm"
        />
        
        <EnterpriseKPICard
          title="Prontos"
          value={data.readyToDeliver}
          subtitle="Para entregar"
          icon={<Target className="h-4 w-4" />}
          variant={data.readyToDeliver > 0 ? "success" : "default"}
          size="sm"
        />
        
        <EnterpriseKPICard
          title="Entregues"
          value={data.delivered}
          subtitle="Este período"
          trend={data.deliveredTrend ? { value: data.deliveredTrend, direction: data.deliveredTrend > 0 ? 'up' : 'down' } : undefined}
          icon={<Users className="h-4 w-4" />}
          variant="emerald"
          size="sm"
        />
        
        <EnterpriseKPICard
          title="Compliance"
          value={`${data.weeklyCompliance}%`}
          subtitle={`${data.completedTasks}/${data.totalTasks} tarefas`}
          icon={<Gauge className="h-4 w-4" />}
          variant={data.weeklyCompliance >= 80 ? "success" : data.weeklyCompliance >= 50 ? "warning" : "danger"}
          size="sm"
        />
      </div>
    </div>
  );
}
