import { useMemo } from 'react';
import { Client } from '@/types/client';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  Zap
} from 'lucide-react';
import { calculateProgress, getDaysSinceUpdate } from '@/lib/clientUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OptimizationDashboardProps {
  clients: Client[];
}

export function OptimizationDashboard({ clients }: OptimizationDashboardProps) {
  const metrics = useMemo(() => {
    // Active clients (not delivered, finalized, or suspended)
    const activeClients = clients.filter(c => 
      !['delivered', 'finalized', 'suspended'].includes(c.columnId)
    );
    
    // Stalled clients (no update in 3+ days)
    const stalledClients = activeClients.filter(c => getDaysSinceUpdate(c.lastUpdate) >= 3);
    
    // Ready to deliver
    const readyToDeliver = clients.filter(c => c.columnId === 'ready_to_deliver');
    
    // Delivered this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const deliveredThisMonth = clients.filter(c => {
      if (c.columnId !== 'delivered' && c.columnId !== 'finalized') return false;
      const updateDate = new Date(c.lastUpdate);
      return updateDate >= monthStart;
    });
    
    // Pending from client
    const pendingClient = activeClients.filter(c => c.status === 'pending_client');
    
    // Average progress
    const avgProgress = activeClients.length > 0
      ? Math.round(activeClients.reduce((acc, c) => acc + calculateProgress(c), 0) / activeClients.length)
      : 0;
    
    // In onboarding
    const inOnboarding = clients.filter(c => c.columnId === 'onboarding');
    
    // In optimization
    const inOptimization = clients.filter(c => c.columnId === 'optimization');
    
    return {
      activeClients: activeClients.length,
      stalledClients: stalledClients.length,
      readyToDeliver: readyToDeliver.length,
      deliveredThisMonth: deliveredThisMonth.length,
      pendingClient: pendingClient.length,
      avgProgress,
      inOnboarding: inOnboarding.length,
      inOptimization: inOptimization.length,
    };
  }, [clients]);

  const stats = [
    {
      label: 'Ativos',
      value: metrics.activeClients.toString(),
      icon: Users,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      tooltip: 'Clientes em execução ativa',
    },
    {
      label: 'Progresso Médio',
      value: `${metrics.avgProgress}%`,
      icon: TrendingUp,
      color: metrics.avgProgress >= 60 ? 'text-green-400' : metrics.avgProgress >= 30 ? 'text-amber-400' : 'text-red-400',
      bgColor: metrics.avgProgress >= 60 ? 'bg-green-500/10' : metrics.avgProgress >= 30 ? 'bg-amber-500/10' : 'bg-red-500/10',
      borderColor: metrics.avgProgress >= 60 ? 'border-green-500/30' : metrics.avgProgress >= 30 ? 'border-amber-500/30' : 'border-red-500/30',
      tooltip: 'Média de conclusão do checklist dos clientes ativos',
    },
    {
      label: 'Prontos p/ Entregar',
      value: metrics.readyToDeliver.toString(),
      icon: Package,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      tooltip: 'Clientes prontos para serem entregues',
      highlight: metrics.readyToDeliver > 0,
    },
    {
      label: 'Entregas do Mês',
      value: metrics.deliveredThisMonth.toString(),
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      tooltip: 'Clientes finalizados neste mês',
    },
    {
      label: 'Onboarding',
      value: metrics.inOnboarding.toString(),
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      tooltip: 'Clientes na fase de onboarding',
    },
    {
      label: 'Otimizando',
      value: metrics.inOptimization.toString(),
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      tooltip: 'Clientes em fase de otimização',
    },
    {
      label: 'Parados (+3d)',
      value: metrics.stalledClients.toString(),
      icon: Clock,
      color: metrics.stalledClients > 0 ? 'text-amber-400' : 'text-muted-foreground',
      bgColor: metrics.stalledClients > 0 ? 'bg-amber-500/10' : 'bg-muted/10',
      borderColor: metrics.stalledClients > 0 ? 'border-amber-500/30' : 'border-border',
      tooltip: 'Clientes sem atualização há mais de 3 dias',
      highlight: metrics.stalledClients > 0,
    },
    {
      label: 'Pendente Cliente',
      value: metrics.pendingClient.toString(),
      icon: AlertTriangle,
      color: metrics.pendingClient > 0 ? 'text-red-400' : 'text-muted-foreground',
      bgColor: metrics.pendingClient > 0 ? 'bg-red-500/10' : 'bg-muted/10',
      borderColor: metrics.pendingClient > 0 ? 'border-red-500/30' : 'border-border',
      tooltip: 'Clientes aguardando retorno ou material',
      highlight: metrics.pendingClient > 0,
    },
  ];

  return (
    <TooltipProvider>
      <div className="px-4 py-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
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