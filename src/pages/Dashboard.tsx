import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Client (Delivery) views
import { KanbanBoard } from "@/components/KanbanBoard";
import { ProgressTable } from "@/components/ProgressTable";
import { TimelineView } from "@/components/TimelineView";
import { CalendarView } from "@/components/CalendarView";
import { CardsView } from "@/components/CardsView";
import { UnifiedTasksView } from "@/components/UnifiedTasksView";
import { ClientExecutionView } from "@/components/ClientExecutionView";
import { ManagerOverview } from "@/components/ManagerOverview";
import { OptimizationDashboard } from "@/components/OptimizationDashboard";

// Leads (Sales) views
import { LeadsKanban } from "@/components/leads/LeadsKanban";
import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { SalesDashboard } from "@/components/leads/SalesDashboard";
import { SalesOverview } from "@/components/leads/SalesOverview";
import { useLeads } from "@/hooks/useLeads";

// Recurring views
import { RecurrenceView } from "@/components/RecurrenceView";
import { RecurringOverview } from "@/components/recurring/RecurringOverview";
import { RecurringExecutionView } from "@/components/recurring/RecurringExecutionView";

// Common components
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { GlobalProgressBar } from "@/components/GlobalProgressBar";
import { Confetti, useConfetti } from "@/components/Confetti";
import { NewClientWizard } from "@/components/NewClientWizard";
import { VoiceCommandButton } from "@/components/VoiceCommandButton";
import { TrashBin } from "@/components/TrashBin";
import { Button } from "@/components/ui/button";
import { FunnelToggle } from "@/components/FunnelToggle";
import { OnboardingChecklist, VisualTour } from "@/components/onboarding";

import { useClientStore } from "@/stores/clientStore";
import { useAuth } from "@/contexts/AuthContext";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { cn } from "@/lib/utils";
import { Lead, LeadPipelineStage } from "@/types/lead";

const Dashboard = () => {
  const { viewMode, clients, setSelectedClient, setDetailOpen, isLoading: isClientsLoading } = useClientStore();
  const { user, isLoading, derived } = useAuth();
  const { mode, isSalesMode, isDeliveryMode, isRecurringMode, canAccessSales, canAccessDelivery, canAccessRecurring } = useFunnelMode();
  const navigate = useNavigate();
  
  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  
  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Lead state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetailOpen, setLeadDetailOpen] = useState(false);
  
  const { showConfetti, triggerConfetti, handleConfettiComplete } = useConfetti();
  
  // Leads hook
  const { 
    leads, 
    loading: isLeadsLoading, 
    moveLead,
    refetch: refetchLeads 
  } = useLeads();

  // Filter active leads for kanban (exclude gained/lost) - MUST be before any returns
  const activeLeads = useMemo(() => {
    return leads.filter(l => l.status === 'open' || l.status === 'future');
  }, [leads]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Listen for client completion events
  useEffect(() => {
    const handleClientCompleted = () => {
      triggerConfetti();
    };

    window.addEventListener("client-completed", handleClientCompleted);
    return () => window.removeEventListener("client-completed", handleClientCompleted);
  }, [triggerConfetti]);

  if (isLoading || isClientsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-12 h-12 border-4 rounded-full animate-spin",
            isSalesMode 
              ? "border-amber-500/30 border-t-amber-500" 
              : "border-primary/30 border-t-primary"
          )} />
          <div className={cn(
            "text-lg font-medium animate-pulse",
            isSalesMode ? "text-amber-400" : "text-primary"
          )}>
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter active clients for checklist view
  const activeClients = clients.filter(c => 
    !["finalized", "delivered"].includes(c.columnId) || 
    new Date(c.lastUpdate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  const handleClientClick = (client: typeof clients[0]) => {
    setSelectedClient(client);
    setDetailOpen(true);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadDetailOpen(true);
  };

  const handleLeadClose = () => {
    setLeadDetailOpen(false);
    setSelectedLead(null);
  };

  const handleMoveLead = async (leadId: string, newStage: LeadPipelineStage) => {
    const success = await moveLead(leadId, newStage);
    if (success) {
      // Force refetch to ensure UI updates immediately
      await refetchLeads();
    }
  };

  // Delivery (Clients) view
  const renderDeliveryView = () => {
    switch (viewMode) {
      case "overview":
        return <ManagerOverview />;
      case "kanban":
        return (
          <>
            <OptimizationDashboard clients={clients} />
            <KanbanBoard />
          </>
        );
      case "table":
        return <ProgressTable />;
      case "checklist":
      case "mytasks":
        return <UnifiedTasksView />;
      case "timeline":
        return <TimelineView />;
      case "calendar":
        return <CalendarView />;
      case "cards":
        return <CardsView />;
      default:
        return <ManagerOverview />;
    }
  };

  // Sales (Leads) view
  const renderSalesView = () => {
    // Block if no sales access
    if (!canAccessSales) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground text-sm">Você não tem permissão para acessar o módulo de Vendas.</p>
        </div>
      );
    }

    if (isLeadsLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      );
    }

    // Check viewMode for sales-specific views
    if (viewMode === 'sales-overview') {
      return <SalesOverview leads={leads} />;
    }

    // Default to Kanban view
    return (
      <>
        <SalesDashboard leads={leads} />
        <LeadsKanban 
          leads={activeLeads} 
          onLeadClick={handleLeadClick} 
          onMoveLead={handleMoveLead}
          onRefresh={refetchLeads}
        />
      </>
    );
  };

  // Recurring view
  const renderRecurringView = () => {
    if (!canAccessRecurring) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground text-sm">Você não tem permissão para acessar o módulo de Recorrência.</p>
        </div>
      );
    }

    // Check viewMode for recurring-specific views
    if (viewMode === 'recurring-overview') {
      return <RecurringOverview />;
    }

    // Default to execution view (kanban = execution for recurring)
    return <RecurringExecutionView />;
  };

  // Delivery (Clients) view with permission check
  const renderDeliveryViewWithPermission = () => {
    if (!canAccessDelivery) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground text-sm">Você não tem permissão para acessar o módulo Operacional.</p>
        </div>
      );
    }
    return renderDeliveryView();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Visual Tour */}
      <VisualTour />

      {/* Confetti celebration */}
      <Confetti 
        active={showConfetti} 
        onComplete={handleConfettiComplete}
        particleCount={80}
      />

      {/* Sidebar */}
      <div data-tour="sidebar">
        <AppSidebar 
          onNewClient={() => isSalesMode ? setNewLeadOpen(true) : setWizardOpen(true)} 
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
      </div>
      
      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-smooth-out min-h-screen",
        "ml-0",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Mobile Header with Menu Button */}
        <div className={cn(
          "lg:hidden fixed top-0 left-0 right-0 h-14 backdrop-blur-md z-30 flex items-center justify-between px-4",
          isSalesMode 
            ? "bg-background/90 border-b border-amber-500/20" 
            : "bg-background/80 border-b border-border/50"
        )}>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="h-10 w-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className={cn(
              "ml-3 font-semibold",
              isSalesMode ? "text-amber-400" : "text-primary"
            )}>
              Alcateia
            </span>
          </div>
        </div>

        {/* Header (Desktop) */}
        <div className="hidden lg:block">
          <DashboardHeader />
        </div>
        
        {/* Main area */}
        <main className={cn(
          "lg:pt-16",
          "pt-14"
        )}>
          {/* Mode-specific header bar */}
          <div className={cn(
            "px-4 py-3 flex items-center justify-between mode-header mode-transition",
            isSalesMode 
              ? "border-b border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent" 
              : isRecurringMode
              ? "border-b border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-transparent"
              : "border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent"
          )}>
            <div className="flex items-center gap-4">
              <h1 className={cn(
                "text-xl font-bold mode-transition",
                isSalesMode ? "text-amber-400" : isRecurringMode ? "text-violet-400" : "text-primary"
              )}>
                {isSalesMode ? "🎯 Funil de Vendas" : isRecurringMode ? "🔄 Recorrência" : "📋 Funil de Otimização"}
              </h1>
              <span className="text-sm text-muted-foreground">
                {isSalesMode 
                  ? `${activeLeads.length} oportunidades ativas` 
                  : isRecurringMode
                  ? "Tarefas periódicas dos clientes"
                  : `${activeClients.length} clientes ativos`}
              </span>
            </div>
            
            {/* Funnel Toggle - always visible */}
            <FunnelToggle />
          </div>

          {/* Global Progress Bar - only for delivery mode */}
          {!isSalesMode && !isRecurringMode && ["kanban", "table", "checklist", "mytasks"].includes(viewMode) && (
            <div className="border-b border-border/30 bg-surface-1/30 backdrop-blur-sm">
              <GlobalProgressBar />
            </div>
          )}

          {/* Onboarding Checklist - show on first visit */}
          <div className="px-4 pt-4">
            <OnboardingChecklist 
              onNewClient={() => setWizardOpen(true)}
              onNewLead={() => setNewLeadOpen(true)}
            />
          </div>

          {/* View Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="animate-fade-in-up"
            >
              {isSalesMode ? renderSalesView() : isRecurringMode ? renderRecurringView() : renderDeliveryViewWithPermission()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating buttons */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
          <TrashBin />
          <VoiceCommandButton />
        </div>
      </div>

      {/* Modals */}
      <ClientExecutionView />
      <NewClientWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      
      {/* Lead modals */}
      <NewLeadDialog 
        open={newLeadOpen} 
        onOpenChange={(open) => {
          setNewLeadOpen(open);
          if (!open) refetchLeads();
        }}
      />
      
      {leadDetailOpen && selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={handleLeadClose}
          onUpdate={() => refetchLeads()}
        />
      )}
    </div>
  );
};

export default Dashboard;
