import { useMemo } from 'react';
import { Lead, TEMPERATURE_CONFIG } from '@/types/lead';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Flame, 
  CalendarCheck, 
  Trophy,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format, parseISO, isBefore, startOfMonth, endOfMonth, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SalesDashboardProps {
  leads: Lead[];
}

export function SalesDashboard({ leads }: SalesDashboardProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Active leads (open + future)
    const activeLeads = leads.filter(l => l.status === 'open' || l.status === 'future');
    
    // Gained this month
    const gainedThisMonth = leads.filter(l => 
      l.status === 'gained' && 
      l.converted_at && 
      isWithinInterval(parseISO(l.converted_at), { start: monthStart, end: monthEnd })
    );
    
    // Lost this month
    const lostThisMonth = leads.filter(l => 
      l.status === 'lost' && 
      l.updated_at &&
      isWithinInterval(parseISO(l.updated_at), { start: monthStart, end: monthEnd })
    );
    
    // Hot leads
    const hotLeads = activeLeads.filter(l => l.temperature === 'hot');
    
    // Overdue follow-ups
    const overdueFollowups = activeLeads.filter(l => 
      l.next_action_date && 
      isBefore(parseISO(l.next_action_date), now)
    );
    
    // Leads with meeting scheduled
    const meetingsScheduled = activeLeads.filter(l => 
      l.pipeline_stage === 'meeting_scheduled'
    );
    
    // Pipeline value (only open leads with value)
    const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
    
    // Weighted forecast (value * probability / 100)
    const weightedForecast = activeLeads.reduce((sum, l) => 
      sum + ((l.estimated_value || 0) * (l.probability || 0) / 100), 0
    );
    
    // Conversion rate this month
    const closedThisMonth = gainedThisMonth.length + lostThisMonth.length;
    const conversionRate = closedThisMonth > 0 
      ? Math.round((gainedThisMonth.length / closedThisMonth) * 100) 
      : 0;
    
    // Average deal size (from gained leads)
    const gainedWithValue = leads.filter(l => l.status === 'gained' && l.estimated_value);
    const avgDealSize = gainedWithValue.length > 0
      ? gainedWithValue.reduce((sum, l) => sum + (l.estimated_value || 0), 0) / gainedWithValue.length
      : 0;
    
    // Proposals sent
    const proposalsSent = activeLeads.filter(l => 
      l.proposal_status === 'sent' || l.proposal_status === 'reviewing'
    );

    return {
      activeLeads: activeLeads.length,
      hotLeads: hotLeads.length,
      gainedThisMonth: gainedThisMonth.length,
      lostThisMonth: lostThisMonth.length,
      overdueFollowups: overdueFollowups.length,
      meetingsScheduled: meetingsScheduled.length,
      proposalsSent: proposalsSent.length,
      pipelineValue,
      weightedForecast,
      conversionRate,
      avgDealSize,
    };
  }, [leads]);

  const stats = [
    {
      label: 'Valor Total',
      value: `R$ ${metrics.pipelineValue.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      tooltip: 'Soma de todos os valores estimados dos leads em negociação',
    },
    {
      label: 'Previsão',
      value: `R$ ${Math.round(metrics.weightedForecast).toLocaleString('pt-BR')}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      tooltip: 'Valor esperado de fechamento (valor × chance de fechar)',
    },
    {
      label: 'Quentes',
      value: metrics.hotLeads.toString(),
      icon: Flame,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      tooltip: 'Leads com alta probabilidade de fechar negócio',
      highlight: metrics.hotLeads > 0,
    },
    {
      label: 'Vendas do Mês',
      value: metrics.gainedThisMonth.toString(),
      icon: Trophy,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      tooltip: `Negócios fechados em ${format(new Date(), 'MMMM', { locale: ptBR })}`,
    },
    {
      label: 'Reuniões',
      value: metrics.meetingsScheduled.toString(),
      icon: CalendarCheck,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      tooltip: 'Reuniões agendadas com potenciais clientes',
    },
    {
      label: 'Propostas',
      value: metrics.proposalsSent.toString(),
      icon: Target,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      tooltip: 'Propostas comerciais enviadas aguardando resposta',
    },
    {
      label: 'Taxa de Sucesso',
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      color: metrics.conversionRate >= 30 ? 'text-green-400' : 'text-amber-400',
      bgColor: metrics.conversionRate >= 30 ? 'bg-green-500/10' : 'bg-amber-500/10',
      borderColor: metrics.conversionRate >= 30 ? 'border-green-500/30' : 'border-amber-500/30',
      tooltip: 'Porcentagem de leads que viraram clientes este mês',
    },
    {
      label: 'Atrasados',
      value: metrics.overdueFollowups.toString(),
      icon: AlertTriangle,
      color: metrics.overdueFollowups > 0 ? 'text-amber-400' : 'text-muted-foreground',
      bgColor: metrics.overdueFollowups > 0 ? 'bg-amber-500/10' : 'bg-muted/10',
      borderColor: metrics.overdueFollowups > 0 ? 'border-amber-500/30' : 'border-border',
      tooltip: 'Leads que precisam de atenção (prazo de contato vencido)',
      highlight: metrics.overdueFollowups > 0,
    },
  ];

  return (
    <TooltipProvider>
      <div className="px-4 py-3 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {stats.map((stat) => (
            <Tooltip key={stat.label}>
              <TooltipTrigger asChild>
                <Card className={cn(
                  "min-w-[140px] border cursor-default transition-all hover:scale-[1.02]",
                  stat.bgColor,
                  stat.borderColor,
                  stat.highlight && "ring-1 ring-offset-1 ring-offset-background"
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        {stat.label}
                      </span>
                    </div>
                    <div className={cn("text-lg font-bold", stat.color)}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{stat.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}