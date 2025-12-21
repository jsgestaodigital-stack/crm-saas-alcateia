import { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  Zap,
  Brain,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'action' | 'trend' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  metric?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  };
  action?: {
    label: string;
    route?: string;
  };
}

interface AIInsightsPanelProps {
  data: {
    activeLeads: number;
    hotLeads: number;
    stalledClients: number;
    pipelineValue: number;
    mrr: number;
    weeklyCompliance: number;
    pendingCommissions: number;
    readyToDeliver: number;
  };
  className?: string;
}

const insightTypeConfig = {
  opportunity: {
    icon: Lightbulb,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  risk: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  action: {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  trend: {
    icon: TrendingUp,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  recommendation: {
    icon: Target,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
};

const priorityStyles = {
  high: 'ring-2 ring-red-500/30',
  medium: 'ring-1 ring-amber-500/20',
  low: '',
};

export function AIInsightsPanel({ data, className }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Generate insights based on data (client-side logic for immediate feedback)
  const generateLocalInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];

    // Hot leads without action
    if (data.hotLeads > 0) {
      insights.push({
        id: 'hot-leads',
        type: 'action',
        priority: 'high',
        title: `${data.hotLeads} Lead${data.hotLeads > 1 ? 's' : ''} Quente${data.hotLeads > 1 ? 's' : ''} Aguardando`,
        message: 'Leads quentes têm alta probabilidade de conversão. Priorize contato imediato para maximizar chances de fechamento.',
        metric: {
          label: 'Valor Potencial',
          value: `R$ ${(data.pipelineValue * 0.4).toLocaleString('pt-BR')}`,
          trend: 'up',
        },
        action: { label: 'Ver Leads Quentes', route: '/dashboard?mode=sales' },
      });
    }

    // Stalled clients
    if (data.stalledClients > 3) {
      insights.push({
        id: 'stalled-warning',
        type: 'risk',
        priority: 'high',
        title: 'Gargalo Operacional Detectado',
        message: `${data.stalledClients} clientes estão parados há mais de 2 dias. Isso pode impactar entregas e satisfação do cliente.`,
        metric: {
          label: 'Clientes Parados',
          value: String(data.stalledClients),
          trend: 'down',
        },
        action: { label: 'Resolver Agora', route: '/dashboard?mode=delivery' },
      });
    }

    // Ready to deliver
    if (data.readyToDeliver > 0) {
      insights.push({
        id: 'ready-deliver',
        type: 'opportunity',
        priority: 'medium',
        title: `${data.readyToDeliver} Cliente${data.readyToDeliver > 1 ? 's' : ''} Pronto${data.readyToDeliver > 1 ? 's' : ''} para Entregar`,
        message: 'Finalize as entregas para liberar comissões e melhorar o fluxo de caixa.',
        action: { label: 'Ver Prontos', route: '/dashboard?mode=delivery' },
      });
    }

    // Low compliance
    if (data.weeklyCompliance < 70) {
      insights.push({
        id: 'low-compliance',
        type: 'risk',
        priority: data.weeklyCompliance < 50 ? 'high' : 'medium',
        title: 'Compliance Abaixo do Ideal',
        message: `Taxa de ${data.weeklyCompliance}% está abaixo da meta de 80%. Clientes recorrentes podem estar em risco de churn.`,
        metric: {
          label: 'Taxa Atual',
          value: `${data.weeklyCompliance}%`,
          trend: 'down',
        },
        action: { label: 'Ver Recorrência', route: '/recorrencia' },
      });
    }

    // Pipeline health
    if (data.pipelineValue > 0) {
      const projectedMonthly = data.pipelineValue * 0.25; // 25% conversion estimate
      insights.push({
        id: 'pipeline-health',
        type: 'trend',
        priority: 'low',
        title: 'Projeção de Receita',
        message: `Com ${data.activeLeads} leads ativos, a projeção de novos contratos para o mês é estimada em R$ ${projectedMonthly.toLocaleString('pt-BR')}.`,
        metric: {
          label: 'Valor Pipeline',
          value: `R$ ${data.pipelineValue.toLocaleString('pt-BR')}`,
          trend: 'up',
        },
      });
    }

    // MRR growth opportunity
    if (data.mrr > 0) {
      insights.push({
        id: 'mrr-growth',
        type: 'recommendation',
        priority: 'low',
        title: 'Oportunidade de Crescimento',
        message: `Seu MRR atual de R$ ${data.mrr.toLocaleString('pt-BR')} pode crescer 20% com upsell para clientes existentes.`,
        metric: {
          label: 'Potencial',
          value: `+R$ ${(data.mrr * 0.2).toLocaleString('pt-BR')}/mês`,
          trend: 'up',
        },
      });
    }

    // Pending commissions
    if (data.pendingCommissions > 5000) {
      insights.push({
        id: 'pending-commissions',
        type: 'action',
        priority: 'medium',
        title: 'Comissões Pendentes',
        message: `R$ ${data.pendingCommissions.toLocaleString('pt-BR')} em comissões aguardando liberação. Verifique entregas pendentes.`,
        action: { label: 'Ver Comissões', route: '/comissoes' },
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const fetchAIInsights = useCallback(async () => {
    setLoading(true);
    try {
      // Generate local insights immediately
      const localInsights = generateLocalInsights();
      setInsights(localInsights);
      setLastUpdated(new Date());
      
      // Optionally call AI for enhanced insights (if edge function exists)
      // const { data: aiData, error } = await supabase.functions.invoke('generate-ai-insights', { body: data });
      // if (aiData?.insights) setInsights([...localInsights, ...aiData.insights]);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  }, [data.activeLeads, data.hotLeads, data.stalledClients, data.pipelineValue, data.mrr, data.weeklyCompliance, data.pendingCommissions, data.readyToDeliver]);

  useEffect(() => {
    fetchAIInsights();
  }, [fetchAIInsights]);

  const highPriorityCount = insights.filter(i => i.priority === 'high').length;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-surface-1/50 to-surface-2/30 backdrop-blur-xl",
      className
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20">
            <Brain className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Copiloto IA
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {insights.length} insights • {highPriorityCount > 0 && (
                <span className="text-red-400">{highPriorityCount} crítico{highPriorityCount > 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAIInsights}
          disabled={loading}
          className="h-8 px-3 text-xs gap-1.5 hover:bg-violet-500/10"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Insights List */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {loading && insights.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Analisando dados...</p>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-3" />
            <p className="text-sm font-medium text-foreground">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground">Nenhum insight crítico no momento.</p>
          </div>
        ) : (
          insights.map((insight) => {
            const config = insightTypeConfig[insight.type];
            const Icon = config.icon;
            
            return (
              <div
                key={insight.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] cursor-pointer",
                  config.border,
                  config.bg,
                  priorityStyles[insight.priority]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg flex-shrink-0", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn("text-sm font-semibold leading-tight", config.color)}>
                        {insight.title}
                      </h4>
                      {insight.priority === 'high' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-400">
                          Urgente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {insight.message}
                    </p>
                    
                    {insight.metric && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{insight.metric.label}:</span>
                        <span className={cn(
                          "text-xs font-mono font-bold",
                          insight.metric.trend === 'up' ? 'text-emerald-400' : 
                          insight.metric.trend === 'down' ? 'text-red-400' : 
                          'text-foreground'
                        )}>
                          {insight.metric.value}
                        </span>
                        {insight.metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                        {insight.metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
                      </div>
                    )}
                    
                    {insight.action && (
                      <button className={cn(
                        "mt-3 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all",
                        config.color
                      )}>
                        {insight.action.label}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="px-4 py-2 border-t border-border/20 bg-surface-1/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}
