import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, getDaysSinceUpdate } from "@/lib/clientUtils";
import { Zap, Target, PauseCircle, PackageCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/tooltipContent";
import { cn } from "@/lib/utils";

function getDaysRemaining(startDate: string): number {
  const start = new Date(startDate);
  const deadline = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function StatsBar() {
  const { clients } = useClientStore();

  // Métricas que fazem sentido para gestão operacional
  const activeClients = clients.filter(c => 
    c.columnId === "onboarding" || c.columnId === "optimization" || c.columnId === "ready_to_deliver"
  ).length;
  
  const readyToDeliver = clients.filter(c => c.columnId === "ready_to_deliver").length;
  
  const stalledClients = clients.filter(c => {
    const days = getDaysSinceUpdate(c.lastUpdate);
    return days >= 3 && c.columnId !== "delivered" && c.columnId !== "finalized" && c.columnId !== "suspended";
  }).length;
  
  const deadlineUrgent = clients.filter(c => {
    if (["delivered", "finalized", "suspended"].includes(c.columnId)) return false;
    return getDaysRemaining(c.startDate) <= 5;
  }).length;
  
  const deliveredThisMonth = clients.filter(c => {
    const lastUpdate = new Date(c.lastUpdate);
    const now = new Date();
    return c.columnId === "delivered" && 
           lastUpdate.getMonth() === now.getMonth() && 
           lastUpdate.getFullYear() === now.getFullYear();
  }).length;

  const avgProgress = clients.length > 0 
    ? Math.round(clients.filter(c => c.columnId !== "delivered" && c.columnId !== "finalized")
        .reduce((acc, c) => acc + calculateProgress(c), 0) / 
        Math.max(clients.filter(c => c.columnId !== "delivered" && c.columnId !== "finalized").length, 1)) 
    : 0;

  const hasUrgentAlerts = stalledClients > 0 || deadlineUrgent > 0;

  const stats = [
    {
      label: "Em Execução",
      value: activeClients,
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      tooltip: TOOLTIP_CONTENT.stats.active,
    },
    {
      label: "Prontos",
      value: readyToDeliver,
      icon: Target,
      color: "text-status-success",
      bgColor: "bg-status-success/10",
      borderColor: "border-status-success/20",
      highlight: readyToDeliver > 0,
      tooltip: TOOLTIP_CONTENT.stats.ready,
    },
    {
      label: "Prazo Urgente",
      value: deadlineUrgent,
      icon: AlertTriangle,
      color: deadlineUrgent > 0 ? "text-status-danger" : "text-muted-foreground",
      bgColor: deadlineUrgent > 0 ? "bg-status-danger/10" : "bg-muted/10",
      borderColor: deadlineUrgent > 0 ? "border-status-danger/30" : "border-border/30",
      alert: deadlineUrgent > 0,
      tooltip: TOOLTIP_CONTENT.stats.urgent,
    },
    {
      label: "Parados",
      value: stalledClients,
      icon: PauseCircle,
      color: stalledClients > 0 ? "text-status-warning" : "text-muted-foreground",
      bgColor: stalledClients > 0 ? "bg-status-warning/10" : "bg-muted/10",
      borderColor: stalledClients > 0 ? "border-status-warning/30" : "border-border/30",
      alert: stalledClients > 0,
      tooltip: TOOLTIP_CONTENT.stats.stalled,
    },
    {
      label: "Entregues",
      value: deliveredThisMonth,
      icon: PackageCheck,
      color: "text-status-success",
      bgColor: "bg-status-success/10",
      borderColor: "border-status-success/20",
      tooltip: TOOLTIP_CONTENT.stats.delivered,
    },
    {
      label: "Progresso",
      value: `${avgProgress}%`,
      icon: TrendingUp,
      color: avgProgress >= 60 ? "text-status-success" : avgProgress >= 30 ? "text-status-warning" : "text-status-danger",
      bgColor: avgProgress >= 60 ? "bg-status-success/10" : avgProgress >= 30 ? "bg-status-warning/10" : "bg-status-danger/10",
      borderColor: avgProgress >= 60 ? "border-status-success/20" : avgProgress >= 30 ? "border-status-warning/20" : "border-status-danger/20",
      tooltip: TOOLTIP_CONTENT.stats.progress,
    },
  ];

  return (
    <TooltipProvider delayDuration={1000}>
      <div 
        data-tour="main-stats"
        className={cn(
          "flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 border-b overflow-x-auto scrollbar-hide",
          hasUrgentAlerts 
            ? "bg-gradient-to-r from-status-danger/5 via-surface-1/50 to-status-warning/5 border-status-danger/20" 
            : "bg-gradient-to-r from-surface-1/50 via-primary/5 to-surface-1/50 border-primary/10"
        )}
      >
        {stats.map((stat) => (
          <Tooltip key={stat.label}>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border transition-all duration-200 min-w-fit cursor-help",
                  stat.bgColor,
                  stat.borderColor,
                  stat.highlight && "ring-1 ring-status-success/50 neon-glow",
                  stat.alert && "ring-1"
                )}
              >
                <div className={cn(
                  "p-1.5 sm:p-2 rounded-lg",
                  stat.bgColor,
                  stat.highlight && "neon-border"
                )}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">{stat.label}</p>
                  <p className={cn("text-lg sm:text-xl font-bold font-mono", stat.color)}>{stat.value}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass max-w-[280px]">
              <p className="font-medium mb-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{stat.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
