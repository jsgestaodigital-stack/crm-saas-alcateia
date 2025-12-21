import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutGrid, Table, Calendar, Clock, LayoutDashboard, ClipboardList, Plus, Shield, ChevronLeft, ChevronRight, Zap, Target, AlertTriangle, TrendingUp, X, DollarSign, MessageCircleQuestion, Flame, CalendarClock, Search, FileText, CalendarCheck, RefreshCw, CheckCircle2, Users, Lightbulb, Bell, History, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClientStore } from "@/stores/clientStore";
import { useAuth } from "@/contexts/AuthContext";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { useQuestions } from "@/hooks/useQuestions";
import { useLeads } from "@/hooks/useLeads";
import { useRecurring } from "@/hooks/useRecurring";
import { calculateProgress, getDaysSinceUpdate } from "@/lib/clientUtils";
import { TOOLTIP_CONTENT } from "@/lib/tooltipContent";
import { FunnelToggleCompact } from "@/components/FunnelToggle";
import grankLogo from "@/assets/grank-logo.png";
import { cn } from "@/lib/utils";
import { isBefore, parseISO, isToday } from "date-fns";
import { AgenteSEOModal, AgenteSuspensoesModal, AgenteRaioXModal, AgenteRelatorioModal } from "@/components/agents";

// Views do funil de clientes (otimização) - Kanban primeiro, mais usado
const CLIENT_VIEWS = [{
  id: "kanban",
  label: "Kanban",
  icon: LayoutGrid,
  description: "Arraste entre colunas",
  highlight: true
}, {
  id: "overview",
  label: "Visão Geral",
  icon: Target,
  description: "Travamentos e alertas"
}, {
  id: "checklist",
  label: "Execução",
  icon: ClipboardList,
  description: "Clientes e tarefas"
}] as const;

// Views do funil de vendas - Kanban primeiro
const SALES_VIEWS = [{
  id: "kanban",
  label: "Kanban",
  icon: LayoutGrid,
  description: "Arraste leads",
  highlight: true
}, {
  id: "sales-overview",
  label: "Visão Geral",
  icon: Target,
  description: "Pipeline e insights"
}] as const;

// Views do funil de recorrência - Execução primeiro (mais usado)
const RECURRING_VIEWS = [{
  id: "kanban",
  label: "Execução",
  icon: ClipboardList,
  description: "Tarefas para trabalhar",
  highlight: true
}, {
  id: "recurring-overview",
  label: "Visão Geral",
  icon: Target,
  description: "Métricas e insights"
}] as const;

// Views extras
const EXTRA_VIEWS = [{
  id: "table",
  label: "Tabela",
  icon: Table
}, {
  id: "timeline",
  label: "Timeline",
  icon: Clock
}, {
  id: "calendar",
  label: "Calendário",
  icon: Calendar
}, {
  id: "cards",
  label: "Cards",
  icon: LayoutDashboard
}] as const;
interface AppSidebarProps {
  onNewClient?: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}
export function AppSidebar({
  onNewClient,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange
}: AppSidebarProps) {
  const {
    viewMode,
    setViewMode,
    clients
  } = useClientStore();
  const {
    isAdmin,
    derived
  } = useAuth();
  const {
    mode,
    isSalesMode,
    isDeliveryMode,
    isRecurringMode,
    canAccessSales: salesAccess,
    canAccessDelivery: deliveryAccess,
    canAccessRecurring: recurringAccess
  } = useFunnelMode();
  const {
    pendingCount
  } = useQuestions();
  const {
    leads
  } = useLeads();
  const {
    stats: recurringStats,
    getTodayTasks,
    getOverdueTasks
  } = useRecurring();
  const navigate = useNavigate();
  const location = useLocation();

  // No longer need to navigate - recurring mode now shows inline in Dashboard

  // Permission-based access (using derived includes isAdmin)
  const canAccessSales = derived?.canSalesOrAdmin ?? isAdmin;
  const canAccessOps = derived?.canOpsOrAdmin ?? isAdmin;
  const canAccessFinance = derived?.canFinanceOrAdmin ?? isAdmin;
  const canAccessAdmin = derived?.canAdminOrIsAdmin ?? isAdmin;
  const canAccessRecurring = derived?.canRecurringOrAdmin ?? isAdmin;

  // Quick stats for Delivery (Clients)
  const activeClients = clients.filter(c => ["onboarding", "optimization", "ready_to_deliver"].includes(c.columnId)).length;
  const stalledClients = clients.filter(c => {
    const days = getDaysSinceUpdate(c.lastUpdate);
    return days >= 3 && !["delivered", "finalized", "suspended"].includes(c.columnId);
  }).length;
  const readyToDeliver = clients.filter(c => c.columnId === "ready_to_deliver").length;
  const avgProgress = clients.length > 0 ? Math.round(clients.filter(c => !["delivered", "finalized"].includes(c.columnId)).reduce((acc, c) => acc + calculateProgress(c), 0) / Math.max(clients.filter(c => !["delivered", "finalized"].includes(c.columnId)).length, 1)) : 0;

  // Quick stats for Sales (Leads)
  const hotLeads = leads.filter(l => l.temperature === 'hot' && l.status === 'open').length;
  const overdueLeads = leads.filter(l => {
    if (!l.next_action_date || l.status !== 'open') return false;
    return isBefore(parseISO(l.next_action_date), new Date()) && !isToday(parseISO(l.next_action_date));
  }).length;
  const todaysFollowups = leads.filter(l => {
    if (!l.next_action_date || l.status !== 'open') return false;
    return isToday(parseISO(l.next_action_date));
  }).length;
  const openLeads = leads.filter(l => l.status === 'open').length;
  const handleNavClick = (viewId: string) => {
    setViewMode(viewId as any);
    if (location.pathname !== "/" && location.pathname !== "/dashboard") {
      navigate("/");
    }
    onMobileOpenChange(false);
  };
  const isOnDashboard = location.pathname === "/" || location.pathname === "/dashboard";
  const isOnRaioX = location.pathname === "/raio-x";
  const isOnAgenteSEO = location.pathname === "/agente-seo";
  const isOnAgenteSuspensoes = location.pathname === "/agente-suspensoes";
  const isOnRecorrencia = location.pathname === "/recorrencia";
  const sidebarContent = <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50">
        {!collapsed && <img src={grankLogo} alt="G-Rank CRM" className="h-9 w-auto animate-fade-in" />}
        <Button variant="ghost" size="icon" onClick={() => onCollapsedChange(!collapsed)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all hidden lg:flex">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMobileOpenChange(false)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all lg:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Funnel Toggle - only when not collapsed */}
      {!collapsed && <div className="p-3 border-b border-sidebar-border/50 animate-fade-in">
          <FunnelToggleCompact />
        </div>}


      {/* Navigation - Only show when in Delivery mode */}
      <nav className="flex-1 min-h-0 p-3 space-y-4 overflow-y-auto">
        <TooltipProvider delayDuration={1000}>
          
          {/* Only show navigation options when in Delivery mode */}
          {isDeliveryMode && <>
              <div className="space-y-1">
                {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-2">
                    Visualizações
                  </p>}
                
                {CLIENT_VIEWS.map(view => {
              const isActive = viewMode === view.id && isOnDashboard;
              return <Tooltip key={view.id}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", isActive ? "bg-primary/15 text-primary border border-primary/30 neon-border" : "hover:bg-primary/5 hover:text-primary hover:translate-x-1 border border-transparent")} onClick={() => handleNavClick(view.id)}>
                          <view.icon className={cn("h-5 w-5 shrink-0", isActive && "scale-110")} />
                          {!collapsed && <div className="flex flex-col items-start animate-fade-in">
                              <span className="text-sm font-medium">{view.label}</span>
                              <span className="text-[10px] text-muted-foreground">{view.description}</span>
                            </div>}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="glass">
                        <p className="font-medium">{view.label}</p>
                        <p className="text-xs text-muted-foreground">{view.description}</p>
                      </TooltipContent>
                    </Tooltip>;
            })}
              </div>
            </>}

          {/* Sales Mode Views */}
          {isSalesMode && canAccessSales && <>
              <div className="space-y-1">
                {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-2">
                    Visualizações
                  </p>}
                
                {SALES_VIEWS.map(view => {
              const isActive = (viewMode as string) === view.id && isOnDashboard;
              return <Tooltip key={view.id}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", isActive ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 neon-border" : "hover:bg-amber-500/5 hover:text-amber-400 hover:translate-x-1 border border-transparent")} onClick={() => handleNavClick(view.id)}>
                          <view.icon className={cn("h-5 w-5 shrink-0", isActive && "scale-110")} />
                          {!collapsed && <div className="flex flex-col items-start animate-fade-in">
                              <span className="text-sm font-medium">{view.label}</span>
                              <span className="text-[10px] text-muted-foreground">{view.description}</span>
                            </div>}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="glass">
                        <p className="font-medium">{view.label}</p>
                        <p className="text-xs text-muted-foreground">{view.description}</p>
                      </TooltipContent>
                    </Tooltip>;
            })}
              </div>
            </>}

          {/* Recurring Mode Views */}
          {isRecurringMode && canAccessRecurring && <>
              <div className="space-y-1">
                {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-2">
                    Visualizações
                  </p>}
                
                {RECURRING_VIEWS.map(view => {
              const isActive = (viewMode as string) === view.id && isOnDashboard;
              return <Tooltip key={view.id}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", isActive ? "bg-violet-500/15 text-violet-400 border border-violet-500/30 neon-border" : "hover:bg-violet-500/5 hover:text-violet-400 hover:translate-x-1 border border-transparent")} onClick={() => handleNavClick(view.id)}>
                          <view.icon className={cn("h-5 w-5 shrink-0", isActive && "scale-110", "text-violet-400")} />
                          {!collapsed && <div className="flex flex-col items-start animate-fade-in">
                              <span className="text-sm font-medium text-violet-400">{view.label}</span>
                              <span className="text-[10px] text-muted-foreground">{view.description}</span>
                            </div>}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="glass">
                        <p className="font-medium">{view.label}</p>
                        <p className="text-xs text-muted-foreground">{view.description}</p>
                      </TooltipContent>
                    </Tooltip>;
            })}
              </div>
              
              {/* Ferramentas - Recorrência */}
              <div className="space-y-1 pt-2 border-t border-border/30">
                {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-2">
                    Ferramentas
                  </p>}
                
                <AgenteRelatorioModal trigger={
                  <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", "hover:bg-violet-500/10 hover:text-violet-400 border border-transparent")}>
                    <FileText className={cn("h-5 w-5 shrink-0 text-violet-400/70")} />
                    {!collapsed && <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Agente Relatórios</span>
                        <span className="text-[10px] text-muted-foreground">Análise IA de métricas</span>
                      </div>}
                  </Button>
                } />
              </div>
            </>}

          {/* Ferramentas - Otimização (Delivery Mode) */}
          {isDeliveryMode && canAccessOps && <div className="space-y-1 pt-2 border-t border-border/30">
              {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-2">
                  Ferramentas
                </p>}
              
              <AgenteSEOModal trigger={
                <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", "hover:bg-primary/10 hover:text-primary border border-transparent")}>
                  <Search className="h-5 w-5 shrink-0 text-primary/70" />
                  {!collapsed && <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">Agente SEO</span>
                      <span className="text-[10px] text-muted-foreground">Otimização de perfil</span>
                    </div>}
                </Button>
              } />
              
              <AgenteSuspensoesModal trigger={
                <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", "hover:bg-status-warning/10 hover:text-status-warning border border-transparent")}>
                  <AlertTriangle className="h-5 w-5 shrink-0 text-status-warning/70" />
                  {!collapsed && <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">Agente Suspensões</span>
                      <span className="text-[10px] text-muted-foreground">Análise de perfis suspensos</span>
                    </div>}
                </Button>
              } />
            </div>}

          {/* Comercial - Only visible in Sales mode for users with sales permission */}
          {canAccessSales && isSalesMode && <div className="space-y-1 pt-2 border-t border-border/30">
              {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-2">
                  Comercial
                </p>}
              
              {/* Propostas */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", location.pathname === "/propostas" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "hover:bg-amber-500/10 hover:text-amber-400 border border-transparent")} onClick={() => {
                    navigate("/propostas");
                    onMobileOpenChange(false);
                  }}>
                    <FileText className="h-5 w-5 shrink-0 text-amber-400/70" />
                    {!collapsed && <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Propostas</span>
                        <span className="text-[10px] text-muted-foreground">Geração inteligente</span>
                      </div>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass">
                  <p className="font-medium">Propostas</p>
                  <p className="text-xs text-muted-foreground">Crie e gerencie propostas comerciais</p>
                </TooltipContent>
              </Tooltip>

              {/* Contratos */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", location.pathname === "/contratos" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "hover:bg-emerald-500/10 hover:text-emerald-400 border border-transparent")} onClick={() => {
                    navigate("/contratos");
                    onMobileOpenChange(false);
                  }}>
                    <FileSignature className="h-5 w-5 shrink-0 text-emerald-400/70" />
                    {!collapsed && <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">Contratos</span>
                        <span className="text-[10px] text-muted-foreground">Assinatura digital</span>
                      </div>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass">
                  <p className="font-medium">Contratos</p>
                  <p className="text-xs text-muted-foreground">Gere contratos com base jurídica validada</p>
                </TooltipContent>
              </Tooltip>
              
              <AgenteRaioXModal trigger={
                <Button variant="ghost" className={cn("w-full justify-start gap-3 h-11 transition-all duration-200", collapsed ? "px-3 justify-center" : "px-4", "hover:bg-purple-500/10 hover:text-purple-400 border border-transparent")}>
                  <Zap className="h-5 w-5 shrink-0 text-purple-400/70" />
                  {!collapsed && <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">Raio-X</span>
                      <span className="text-[10px] text-muted-foreground">Análise de fechamento</span>
                    </div>}
                </Button>
              } />
            </div>}
        </TooltipProvider>
      </nav>

      {/* Actions - scrollable section that works with zoom */}
      <div className="shrink-0 max-h-[40vh] overflow-y-auto p-3 border-t border-sidebar-border/50 space-y-2 bg-sidebar/95 backdrop-blur-sm">
        <TooltipProvider delayDuration={1000}>
          {/* Main Action Button - Show in all modes */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button data-tour="new-client" className={cn("w-full gap-2 h-10 hover-lift", collapsed ? "px-3" : "px-4", isSalesMode ? "bg-amber-500 text-black hover:bg-amber-400" : isRecurringMode ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow")} onClick={() => {
              onNewClient?.();
              onMobileOpenChange(false);
            }}>
                <Plus className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="animate-fade-in text-sm">
                    {isSalesMode ? "Novo Lead" : "Novo Cliente"}
                  </span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="glass">
              <p className="font-medium">{isSalesMode ? "Novo Lead" : isRecurringMode ? "Novo Cliente Recorrente" : "Novo Cliente"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Dúvidas/Central Operacional - Only visible in Delivery mode for ops users */}
          {canAccessOps && isDeliveryMode && <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className={cn("w-full gap-2 h-10 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 transition-all relative", collapsed ? "px-3" : "px-4", location.pathname === "/duvidas" && "bg-amber-500/10 text-amber-400 border-amber-500/50")} onClick={() => {
                navigate("/duvidas");
                onMobileOpenChange(false);
              }}>
                <MessageCircleQuestion className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="animate-fade-in text-sm">Central Operacional</span>}
                {pendingCount > 0 && <span className={cn("absolute bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center", collapsed ? "top-0.5 right-0.5 w-4 h-4" : "top-1.5 right-1.5 w-4 h-4")}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="glass">
              <p className="font-medium">Central Operacional {pendingCount > 0 && `(${pendingCount})`}</p>
            </TooltipContent>
          </Tooltip>}

          {/* Finance - Comissões */}
          {canAccessFinance && <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className={cn("w-full gap-2 h-10 border-status-success/30 hover:bg-status-success/10 hover:text-status-success transition-all", collapsed ? "px-3" : "px-4", location.pathname === "/commissions" && "bg-status-success/10 text-status-success border-status-success/50")} onClick={() => {
                navigate("/commissions");
                onMobileOpenChange(false);
              }}>
                <DollarSign className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="animate-fade-in text-sm">Comissões</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="glass">
              <p className="font-medium">Comissões</p>
            </TooltipContent>
          </Tooltip>}

          {/* Admin Section - Collapsible group */}
          {canAccessAdmin && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 pt-2 border-t border-border/30 mt-2">
                  Administração
                </p>
              )}
              
              {/* Admin Panel */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button data-tour="admin-button" variant="ghost" className={cn("w-full justify-start gap-2 h-9 transition-all", collapsed ? "px-3 justify-center" : "px-3", location.pathname === "/admin" ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary")} onClick={() => {
                    navigate("/admin");
                    onMobileOpenChange(false);
                  }}>
                    <Shield className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Admin</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass">
                  <p className="font-medium">Painel Admin</p>
                </TooltipContent>
              </Tooltip>

              {/* Equipe */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button data-tour="team-button" variant="ghost" className={cn("w-full justify-start gap-2 h-9 transition-all", collapsed ? "px-3 justify-center" : "px-3", location.pathname === "/equipe" ? "bg-violet-500/10 text-violet-400" : "hover:bg-violet-500/5 hover:text-violet-400")} onClick={() => {
                    navigate("/equipe");
                    onMobileOpenChange(false);
                  }}>
                    <Users className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Equipe</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass">
                  <p className="font-medium">Gestão de Equipe</p>
                </TooltipContent>
              </Tooltip>

              {/* Relatório Gestor */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 h-9 transition-all", collapsed ? "px-3 justify-center" : "px-3", location.pathname === "/relatorio-gestor" ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-cyan-500/5 hover:text-cyan-400")} onClick={() => {
                    navigate("/relatorio-gestor");
                    onMobileOpenChange(false);
                  }}>
                    <FileText className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Relatório Gestor</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass">
                  <p className="font-medium">Relatório do Gestor</p>
                </TooltipContent>
              </Tooltip>

              {/* Logs de Auditoria */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 h-9 transition-all", collapsed ? "px-3 justify-center" : "px-3", location.pathname === "/admin/audit" ? "bg-slate-500/10 text-slate-400" : "hover:bg-slate-500/5 hover:text-slate-400")} onClick={() => {
                    navigate("/admin/audit");
                    onMobileOpenChange(false);
                  }}>
                    <History className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Auditoria</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass">
                  <p className="font-medium">Logs de Auditoria</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Global items - available to all */}
          <div className={cn("space-y-1", canAccessAdmin && "pt-2 border-t border-border/30 mt-2")}>
            {!collapsed && !canAccessAdmin && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 pt-2 border-t border-border/30 mt-2">
                Mais
              </p>
            )}
            
            {/* Notificações */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className={cn("w-full justify-start gap-2 h-9 transition-all", collapsed ? "px-3 justify-center" : "px-3", location.pathname === "/notifications" ? "bg-orange-500/10 text-orange-400" : "hover:bg-orange-500/5 hover:text-orange-400")} onClick={() => {
                  navigate("/notifications");
                  onMobileOpenChange(false);
                }}>
                  <Bell className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm">Notificações</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass">
                <p className="font-medium">Notificações</p>
              </TooltipContent>
            </Tooltip>

            {/* Sugestões */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className={cn("w-full justify-start gap-2 h-9 transition-all", collapsed ? "px-3 justify-center" : "px-3", location.pathname === "/sugestoes" ? "bg-amber-500/10 text-amber-500" : "hover:bg-amber-500/5 hover:text-amber-500")} onClick={() => {
                  navigate("/sugestoes");
                  onMobileOpenChange(false);
                }}>
                  <Lightbulb className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm">Sugestões</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass">
                <p className="font-medium">Mural de Sugestões</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </>;
  return <>
      {/* Mobile Backdrop */}
      {mobileOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => onMobileOpenChange(false)} />}

      {/* Desktop Sidebar */}
      <aside className={cn("hidden lg:flex fixed left-0 top-0 h-screen z-30 flex-col glass-sidebar transition-all duration-300", collapsed ? "w-16" : "w-64")}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn("lg:hidden fixed left-0 top-0 h-screen z-50 flex flex-col glass-sidebar transition-transform duration-300 w-72", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        {sidebarContent}
      </aside>
    </>;
}