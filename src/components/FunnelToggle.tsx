import { cn } from '@/lib/utils';
import { useFunnelMode } from '@/contexts/FunnelModeContext';
import { useClientStore } from '@/stores/clientStore';
import { Briefcase, Users, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Default views for first-time access (Kanban is most used, so it's the default)
const DEFAULT_VIEWS = {
  sales: 'kanban',
  delivery: 'kanban', 
  recurring: 'kanban',
};

// Get saved view for a funnel or return default
function getSavedView(funnel: 'sales' | 'delivery' | 'recurring'): string {
  const saved = localStorage.getItem(`rankeia-view-${funnel}`);
  return saved || DEFAULT_VIEWS[funnel];
}

// Save view for a funnel
function saveView(funnel: 'sales' | 'delivery' | 'recurring', view: string) {
  localStorage.setItem(`rankeia-view-${funnel}`, view);
}

export function FunnelToggle() {
  const { 
    mode, 
    setMode, 
    isSalesMode, 
    isDeliveryMode, 
    isRecurringMode,
    canAccessSales, 
    canAccessDelivery,
    canAccessRecurring 
  } = useFunnelMode();
  const { viewMode, setViewMode } = useClientStore();

  // Save current view when it changes
  const handleFunnelChange = (newFunnel: 'sales' | 'delivery' | 'recurring') => {
    // Save current view for current funnel before switching
    if (isSalesMode) {
      saveView('sales', viewMode);
    } else if (isDeliveryMode) {
      saveView('delivery', viewMode);
    } else if (isRecurringMode) {
      saveView('recurring', viewMode);
    }
    
    // Switch to new funnel and restore its saved view
    setMode(newFunnel);
    setViewMode(getSavedView(newFunnel) as any);
  };

  // Count accessible modes
  const accessibleModes = [canAccessSales, canAccessDelivery, canAccessRecurring].filter(Boolean).length;

  // If only one mode accessible, don't render toggle
  if (accessibleModes <= 1) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={500}>
      <div data-tour="funnel-toggle" className="flex items-center bg-surface-2/50 rounded-full p-1 border border-border/50 gap-1">
        {/* Sales Button */}
        {canAccessSales && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleFunnelChange('sales')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  isSalesMode 
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-400" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline whitespace-nowrap">Vendas</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gerenciar oportunidades e negociações</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Delivery Button */}
        {canAccessDelivery && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleFunnelChange('delivery')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  isDeliveryMode 
                    ? "bg-gradient-to-r from-primary/20 to-emerald-600/20 border border-primary/40 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline whitespace-nowrap">Otimização</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Acompanhar clientes em otimização</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Recurring Button */}
        {canAccessRecurring && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleFunnelChange('recurring')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  isRecurringMode 
                    ? "bg-gradient-to-r from-violet-500/20 to-violet-600/20 border border-violet-500/40 text-violet-400" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline whitespace-nowrap">Recorrência</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tarefas recorrentes de clientes ativos</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Compact version for sidebar
export function FunnelToggleCompact() {
  const { 
    mode, 
    setMode, 
    isSalesMode, 
    isDeliveryMode,
    isRecurringMode,
    canAccessSales, 
    canAccessDelivery,
    canAccessRecurring 
  } = useFunnelMode();
  const { viewMode, setViewMode } = useClientStore();

  // Save current view when it changes
  const handleFunnelChange = (newFunnel: 'sales' | 'delivery' | 'recurring') => {
    // Save current view for current funnel before switching
    if (isSalesMode) {
      saveView('sales', viewMode);
    } else if (isDeliveryMode) {
      saveView('delivery', viewMode);
    } else if (isRecurringMode) {
      saveView('recurring', viewMode);
    }
    
    // Switch to new funnel and restore its saved view
    setMode(newFunnel);
    setViewMode(getSavedView(newFunnel) as any);
  };

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex flex-col gap-1 w-full">
        {canAccessSales && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleFunnelChange('sales')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 border-2",
                  isSalesMode 
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-400" 
                    : "border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <Briefcase className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">Vendas</span>
                  <span className="text-[10px] opacity-70">Novas Oportunidades</span>
                </div>
                {isSalesMode && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Funil de prospecção e negociação</p>
            </TooltipContent>
          </Tooltip>
        )}

        {canAccessDelivery && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleFunnelChange('delivery')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 border-2",
                  isDeliveryMode 
                    ? "bg-primary/15 border-primary/50 text-primary" 
                    : "border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">Otimização</span>
                  <span className="text-[10px] opacity-70">Clientes em Execução</span>
                </div>
                {isDeliveryMode && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Funil de otimização e entrega do serviço</p>
            </TooltipContent>
          </Tooltip>
        )}

        {canAccessRecurring && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleFunnelChange('recurring')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 border-2",
                  isRecurringMode 
                    ? "bg-violet-500/15 border-violet-500/50 text-violet-400" 
                    : "border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <RefreshCw className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">Recorrência</span>
                  <span className="text-[10px] opacity-70">Tarefas Periódicas</span>
                </div>
                {isRecurringMode && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Rotinas recorrentes de clientes ativos</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
