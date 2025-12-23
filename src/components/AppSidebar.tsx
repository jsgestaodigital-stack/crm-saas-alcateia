import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  LayoutGrid, Table, Calendar, Clock, Target, ClipboardList, Plus, Shield, 
  ChevronLeft, ChevronRight, Zap, AlertTriangle, X, DollarSign, 
  MessageCircleQuestion, Search, FileText, Users, Lightbulb, Bell, 
  History, FileSignature, ChevronDown, TrendingUp, RefreshCw, Flame,
  Building2, Settings, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClientStore } from "@/stores/clientStore";
import { useAuth } from "@/contexts/AuthContext";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { useQuestions } from "@/hooks/useQuestions";
import { useLeads } from "@/hooks/useLeads";
import { useRecurring } from "@/hooks/useRecurring";
import { calculateProgress, getDaysSinceUpdate } from "@/lib/clientUtils";

import { ThemeLogo } from "@/components/ThemeLogo";
import { cn } from "@/lib/utils";
import { isBefore, parseISO, isToday } from "date-fns";
import { AgenteSEOModal, AgenteSuspensoesModal, AgenteRaioXModal, AgenteRelatorioModal } from "@/components/agents";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

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
  const { viewMode, setViewMode, clients } = useClientStore();
  const { isAdmin, derived } = useAuth();
  const { 
    mode, setMode, isSalesMode, isDeliveryMode, isRecurringMode,
    canAccessSales: salesAccess, canAccessDelivery: deliveryAccess, canAccessRecurring: recurringAccess
  } = useFunnelMode();
  const { pendingCount } = useQuestions();
  const { leads } = useLeads();
  const { stats: recurringStats, getTodayTasks, getOverdueTasks } = useRecurring();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible states
  const [comercialOpen, setComercialOpen] = useState(false);
  const [ferramentasOpen, setFerramentasOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  // Permission-based access
  const canAccessSales = derived?.canSalesOrAdmin ?? isAdmin;
  const canAccessOps = derived?.canOpsOrAdmin ?? isAdmin;
  const canAccessFinance = derived?.canFinanceOrAdmin ?? isAdmin;
  const canAccessAdmin = derived?.canAdminOrIsAdmin ?? isAdmin;
  const canAccessRecurring = derived?.canRecurringOrAdmin ?? isAdmin;

  // Quick stats
  const activeClients = clients.filter(c => ["onboarding", "optimization", "ready_to_deliver"].includes(c.columnId)).length;
  const stalledClients = clients.filter(c => {
    const days = getDaysSinceUpdate(c.lastUpdate);
    return days >= 3 && !["delivered", "finalized", "suspended"].includes(c.columnId);
  }).length;
  const hotLeads = leads.filter(l => l.temperature === 'hot' && l.status === 'open').length;
  const openLeads = leads.filter(l => l.status === 'open').length;
  const todayRecurringTasks = getTodayTasks?.()?.length ?? 0;
  const overdueRecurringTasks = getOverdueTasks?.()?.length ?? 0;

  const handleNavClick = (viewId: string) => {
    setViewMode(viewId as any);
    if (location.pathname !== "/" && location.pathname !== "/dashboard") {
      navigate("/");
    }
    onMobileOpenChange(false);
  };

  const isOnDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  // Auto-open sections based on current route
  useEffect(() => {
    if (location.pathname === "/propostas" || location.pathname === "/contratos") {
      setComercialOpen(true);
    }
    if (location.pathname === "/agente-seo" || location.pathname === "/agente-suspensoes" || location.pathname === "/duvidas") {
      setFerramentasOpen(true);
    }
    if (location.pathname.includes("/admin") || location.pathname === "/equipe" || location.pathname === "/relatorio-gestor") {
      setAdminOpen(true);
    }
  }, [location.pathname]);

  // Main funnel item component
  const FunnelItem = ({ 
    icon: Icon, 
    label, 
    isActive, 
    onClick, 
    count, 
    color = "primary",
    size = "large",
    dataTour
  }: { 
    icon: any; 
    label: string; 
    isActive: boolean; 
    onClick: () => void;
    count?: number;
    color?: "primary" | "amber" | "violet";
    size?: "large" | "small";
    dataTour?: string;
  }) => {
    const colorClasses = {
      primary: {
        active: "bg-primary/15 text-primary border-primary/40 shadow-[0_0_20px_hsl(160_84%_39%/0.15)]",
        hover: "hover:bg-primary/8 hover:text-primary hover:border-primary/20"
      },
      amber: {
        active: "bg-amber-500/15 text-amber-500 border-amber-500/40 shadow-[0_0_20px_hsl(45_95%_55%/0.15)]",
        hover: "hover:bg-amber-500/8 hover:text-amber-500 hover:border-amber-500/20"
      },
      violet: {
        active: "bg-violet-500/15 text-violet-500 border-violet-500/40 shadow-[0_0_20px_hsl(260_70%_60%/0.15)]",
        hover: "hover:bg-violet-500/8 hover:text-violet-500 hover:border-violet-500/20"
      }
    };

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            data-tour={dataTour}
            className={cn(
              "group w-full flex items-center gap-3 rounded-xl border transition-all duration-300",
              size === "large" ? "p-3.5" : "p-2.5",
              isActive 
                ? colorClasses[color].active
                : cn("border-transparent", colorClasses[color].hover)
            )}
          >
            <div className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-300",
              size === "large" ? "h-11 w-11" : "h-9 w-9",
              isActive 
                ? color === "primary" ? "bg-primary text-primary-foreground" 
                  : color === "amber" ? "bg-amber-500 text-black"
                  : "bg-violet-500 text-white"
                : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
            )}>
              <Icon className={cn(
                "transition-transform duration-300 group-hover:scale-110",
                size === "large" ? "h-6 w-6" : "h-5 w-5"
              )} />
            </div>
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className={cn(
                  "font-semibold truncate",
                  size === "large" ? "text-base" : "text-sm"
                )}>
                  {label}
                </span>
                {count !== undefined && count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-2 h-5 px-1.5 text-[10px] font-bold",
                      color === "primary" && "bg-primary/20 text-primary",
                      color === "amber" && "bg-amber-500/20 text-amber-600",
                      color === "violet" && "bg-violet-500/20 text-violet-600"
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </Badge>
                )}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="glass">
          <p className="font-semibold">{label}</p>
          {count !== undefined && count > 0 && (
            <p className="text-xs text-muted-foreground">{count} item(s)</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  };

  // Collapsible section header
  const SectionHeader = ({ 
    icon: Icon, 
    label, 
    isOpen, 
    onToggle, 
    color = "muted" 
  }: { 
    icon: any; 
    label: string; 
    isOpen: boolean;
    onToggle: () => void;
    color?: "muted" | "amber" | "violet" | "cyan";
  }) => {
    const colorClasses = {
      muted: "text-muted-foreground hover:text-foreground",
      amber: "text-amber-600/70 hover:text-amber-600",
      violet: "text-violet-600/70 hover:text-violet-600",
      cyan: "text-cyan-600/70 hover:text-cyan-600"
    };

    return (
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-2 py-2 rounded-lg transition-all duration-200",
          colorClasses[color],
          "hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
          )}
        </div>
        {!collapsed && (
          <ChevronDown className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        )}
      </button>
    );
  };

  // Secondary nav item
  const NavItem = ({ 
    icon: Icon, 
    label, 
    description, 
    isActive, 
    onClick, 
    badge,
    color = "primary",
    dataTour
  }: { 
    icon: any; 
    label: string;
    description?: string;
    isActive: boolean;
    onClick: () => void;
    badge?: number;
    color?: "primary" | "amber" | "violet" | "cyan" | "red" | "slate";
    dataTour?: string;
  }) => {
    const colorMap = {
      primary: { active: "bg-primary/10 text-primary", hover: "hover:bg-primary/5 hover:text-primary" },
      amber: { active: "bg-amber-500/10 text-amber-500", hover: "hover:bg-amber-500/5 hover:text-amber-500" },
      violet: { active: "bg-violet-500/10 text-violet-500", hover: "hover:bg-violet-500/5 hover:text-violet-500" },
      cyan: { active: "bg-cyan-500/10 text-cyan-500", hover: "hover:bg-cyan-500/5 hover:text-cyan-500" },
      red: { active: "bg-red-500/10 text-red-500", hover: "hover:bg-red-500/5 hover:text-red-500" },
      slate: { active: "bg-slate-500/10 text-slate-500", hover: "hover:bg-slate-500/5 hover:text-slate-500" }
    };

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            data-tour={dataTour}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 relative group",
              collapsed && "justify-center px-2",
              isActive ? colorMap[color].active : colorMap[color].hover
            )}
          >
            <Icon className={cn(
              "shrink-0 transition-transform duration-200 group-hover:scale-105",
              collapsed ? "h-5 w-5" : "h-4 w-4",
              !isActive && "opacity-70 group-hover:opacity-100"
            )} />
            {!collapsed && (
              <div className="flex-1 flex flex-col items-start min-w-0">
                <span className="text-sm font-medium truncate">{label}</span>
                {description && (
                  <span className="text-[10px] text-muted-foreground truncate">{description}</span>
                )}
              </div>
            )}
            {badge !== undefined && badge > 0 && (
              <span className={cn(
                "bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center",
                collapsed ? "absolute -top-0.5 -right-0.5 w-4 h-4" : "w-5 h-5"
              )}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="glass">
          <p className="font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </TooltipContent>
      </Tooltip>
    );
  };

  const sidebarContent = (
    <>
      {/* Header with Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-violet/5">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-fade-in">
            <ThemeLogo className="h-8" />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onCollapsedChange(!collapsed)} 
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all hidden lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onMobileOpenChange(false)} 
          className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Funnel Toggle removed - using Principais section instead */}

      {/* Dynamic Action Button */}
      <div className="p-3 border-b border-border/30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                data-tour="new-client"
                className={cn(
                  "w-full gap-2.5 h-11 font-semibold transition-all duration-300 shadow-lg",
                  collapsed ? "px-0" : "px-4",
                  isSalesMode 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25" 
                    : isRecurringMode 
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 shadow-violet-500/25" 
                    : "bg-gradient-to-r from-primary to-teal-500 text-primary-foreground hover:from-primary/90 hover:to-teal-400 shadow-primary/25"
                )} 
                onClick={() => {
                  onNewClient?.();
                  onMobileOpenChange(false);
                }}
              >
                <Plus className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in">
                    {isSalesMode ? "Novo Lead" : isRecurringMode ? "Novo Recorrente" : "Novo Cliente"}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="glass">
              <p className="font-medium">
                {isSalesMode ? "Adicionar novo lead" : isRecurringMode ? "Novo cliente recorrente" : "Adicionar novo cliente"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 min-h-0 p-3 overflow-y-auto space-y-4">
        <TooltipProvider delayDuration={800}>
          
          {/* === PRINCIPAIS - Always visible === */}
          <div className="space-y-1.5">
            {!collapsed && (
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Principais
              </p>
            )}
            
            {/* Vendas */}
            {canAccessSales && (
              <FunnelItem
                icon={TrendingUp}
                label="Vendas"
                isActive={isSalesMode && isOnDashboard}
                onClick={() => {
                  setMode('sales');
                  handleNavClick("kanban");
                }}
                count={openLeads}
                color="amber"
                size="large"
                dataTour="funnel-sales"
              />
            )}

            {/* Otimização */}
            {canAccessOps && (
              <FunnelItem
                icon={LayoutGrid}
                label="Otimização"
                isActive={isDeliveryMode && isOnDashboard}
                onClick={() => {
                  setMode('delivery');
                  handleNavClick("kanban");
                }}
                count={activeClients}
                color="primary"
                size="large"
                dataTour="funnel-optimization"
              />
            )}

            {/* Recorrência */}
            {canAccessRecurring && (
              <FunnelItem
                icon={RefreshCw}
                label="Recorrência"
                isActive={isRecurringMode && isOnDashboard}
                onClick={() => {
                  setMode('recurring');
                  handleNavClick("kanban");
                }}
                count={todayRecurringTasks}
                color="violet"
                size="large"
                dataTour="funnel-recurrence"
              />
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* === COMERCIAL - Collapsible === */}
          {canAccessSales && (
            <Collapsible open={comercialOpen} onOpenChange={setComercialOpen}>
              <CollapsibleTrigger asChild>
                <div data-tour="section-comercial">
                  <SectionHeader 
                    icon={Building2} 
                    label="Comercial" 
                    isOpen={comercialOpen} 
                    onToggle={() => setComercialOpen(!comercialOpen)}
                    color="amber"
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pt-1 animate-accordion-down">
                <NavItem
                  icon={FileText}
                  label="Propostas"
                  description="Geração inteligente"
                  isActive={location.pathname === "/propostas"}
                  onClick={() => { navigate("/propostas"); onMobileOpenChange(false); }}
                  color="amber"
                  dataTour="nav-propostas"
                />
                <NavItem
                  icon={FileSignature}
                  label="Contratos"
                  description="Assinatura digital"
                  isActive={location.pathname === "/contratos"}
                  onClick={() => { navigate("/contratos"); onMobileOpenChange(false); }}
                  color="primary"
                  dataTour="nav-contratos"
                />
                <AgenteRaioXModal trigger={
                  <div className="w-full" data-tour="nav-raiox">
                    <NavItem
                      icon={Zap}
                      label="Raio-X"
                      description="Análise de fechamento"
                      isActive={false}
                      onClick={() => {}}
                      color="violet"
                    />
                  </div>
                } />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* === FERRAMENTAS - Collapsible === */}
          <Collapsible open={ferramentasOpen} onOpenChange={setFerramentasOpen}>
            <CollapsibleTrigger asChild>
              <div data-tour="section-ferramentas">
                <SectionHeader 
                  icon={Settings} 
                  label="Ferramentas" 
                  isOpen={ferramentasOpen} 
                  onToggle={() => setFerramentasOpen(!ferramentasOpen)}
                  color="cyan"
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 pt-1 animate-accordion-down">
              {canAccessOps && (
                <>
                  <AgenteSEOModal trigger={
                    <div className="w-full" data-tour="nav-agente-seo">
                      <NavItem
                        icon={Search}
                        label="Agente SEO"
                        description="Otimização de perfil"
                        isActive={false}
                        onClick={() => {}}
                        color="primary"
                      />
                    </div>
                  } />
                  <AgenteSuspensoesModal trigger={
                    <div className="w-full" data-tour="nav-agente-suspensoes">
                      <NavItem
                        icon={AlertTriangle}
                        label="Agente Suspensões"
                        description="Análise de perfis"
                        isActive={false}
                        onClick={() => {}}
                        color="amber"
                      />
                    </div>
                  } />
                </>
              )}
              {isRecurringMode && (
                <AgenteRelatorioModal trigger={
                  <div className="w-full" data-tour="nav-agente-relatorios">
                    <NavItem
                      icon={BarChart3}
                      label="Agente Relatórios"
                      description="Análise IA de métricas"
                      isActive={false}
                      onClick={() => {}}
                      color="violet"
                    />
                  </div>
                } />
              )}
              {canAccessOps && (
                <NavItem
                  icon={MessageCircleQuestion}
                  label="Central Operacional"
                  description="Dúvidas e suporte"
                  isActive={location.pathname === "/duvidas"}
                  onClick={() => { navigate("/duvidas"); onMobileOpenChange(false); }}
                  badge={pendingCount}
                  color="amber"
                  dataTour="nav-central-operacional"
                />
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* === ADMINISTRAÇÃO - Collapsible === */}
          {canAccessAdmin && (
            <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
              <CollapsibleTrigger asChild>
                <div>
                  <SectionHeader 
                    icon={Shield} 
                    label="Administração" 
                    isOpen={adminOpen} 
                    onToggle={() => setAdminOpen(!adminOpen)}
                    color="violet"
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pt-1 animate-accordion-down">
                <div data-tour="admin-button">
                  <NavItem
                    icon={Shield}
                    label="Admin"
                    isActive={location.pathname === "/admin"}
                    onClick={() => { navigate("/admin"); onMobileOpenChange(false); }}
                    color="primary"
                  />
                </div>
                <div data-tour="team-button">
                  <NavItem
                    icon={Users}
                    label="Equipe"
                    isActive={location.pathname === "/equipe"}
                    onClick={() => { navigate("/equipe"); onMobileOpenChange(false); }}
                    color="violet"
                  />
                </div>
                <NavItem
                  icon={FileText}
                  label="Relatório Gestor"
                  isActive={location.pathname === "/relatorio-gestor"}
                  onClick={() => { navigate("/relatorio-gestor"); onMobileOpenChange(false); }}
                  color="cyan"
                />
                <NavItem
                  icon={History}
                  label="Auditoria"
                  isActive={location.pathname === "/admin/audit"}
                  onClick={() => { navigate("/admin/audit"); onMobileOpenChange(false); }}
                  color="slate"
                />
                {canAccessFinance && (
                  <NavItem
                    icon={DollarSign}
                    label="Comissões"
                    isActive={location.pathname === "/commissions"}
                    onClick={() => { navigate("/commissions"); onMobileOpenChange(false); }}
                    color="primary"
                  />
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

        </TooltipProvider>
      </nav>

      {/* Footer - Quick actions */}
      <div className="shrink-0 p-3 border-t border-border/50 space-y-1 bg-gradient-to-t from-muted/30 to-transparent">
        <TooltipProvider delayDuration={800}>
          <NavItem
            icon={Bell}
            label="Notificações"
            isActive={location.pathname === "/notifications"}
            onClick={() => { navigate("/notifications"); onMobileOpenChange(false); }}
            color="amber"
          />
          <NavItem
            icon={Lightbulb}
            label="Sugestões"
            isActive={location.pathname === "/sugestoes"}
            onClick={() => { navigate("/sugestoes"); onMobileOpenChange(false); }}
            color="amber"
          />
        </TooltipProvider>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 lg:hidden animate-fade-in" 
          onClick={() => onMobileOpenChange(false)} 
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 h-screen z-30 flex-col transition-all duration-300 ease-out",
        "bg-sidebar/98 backdrop-blur-xl border-r border-border/40",
        "shadow-[4px_0_32px_hsl(var(--primary)/0.03)]",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed left-0 top-0 h-screen z-50 flex flex-col transition-transform duration-300 ease-out",
        "w-[85vw] max-w-[300px]",
        "bg-sidebar/98 backdrop-blur-xl border-r border-border/40",
        "shadow-[4px_0_40px_hsl(var(--primary)/0.08)]",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
