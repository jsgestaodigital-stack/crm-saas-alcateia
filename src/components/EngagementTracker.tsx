import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useEngagement, EngagementEventType } from '@/hooks/useEngagement';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that tracks user engagement events automatically.
 * Place this in the app root to track page views and navigation.
 */
export function EngagementTracker() {
  const location = useLocation();
  const { logEvent } = useEngagement();
  const { user } = useAuth();
  const lastPath = useRef<string | null>(null);

  // Track page views
  useEffect(() => {
    if (!user || lastPath.current === location.pathname) return;
    
    lastPath.current = location.pathname;
    
    // Map routes to specific events
    const routeEventMap: Record<string, EngagementEventType> = {
      '/dashboard': 'dashboard_view',
      '/super-admin': 'page_view',
      '/equipe': 'page_view',
      '/contratos': 'page_view',
      '/propostas': 'page_view',
      '/comissoes': 'page_view',
      '/recorrencia': 'page_view',
      '/historico': 'page_view',
      '/raio-x': 'page_view',
      '/agente-seo': 'page_view',
      '/agente-suspensoes': 'page_view',
      '/meu-perfil': 'page_view',
      '/sugestoes': 'page_view',
      '/perguntas': 'page_view',
      '/notificacoes': 'page_view',
      '/upgrade': 'page_view',
    };

    const eventType = routeEventMap[location.pathname] || 'page_view';
    
    logEvent(eventType, { 
      path: location.pathname,
      search: location.search,
    });
  }, [location.pathname, user, logEvent]);

  return null;
}

/**
 * Hook to create engagement tracking functions for specific actions.
 * Use this in components to track CRUD and feature events.
 */
export function useEngagementTracking() {
  const { logEvent } = useEngagement();

  return {
    // CRUD events
    trackClientCreated: (clientId?: string) => logEvent('client_created', { clientId }),
    trackClientUpdated: (clientId?: string) => logEvent('client_updated', { clientId }),
    trackClientDeleted: (clientId?: string) => logEvent('client_deleted', { clientId }),
    trackLeadCreated: (leadId?: string) => logEvent('lead_created', { leadId }),
    trackLeadUpdated: (leadId?: string) => logEvent('lead_updated', { leadId }),
    trackLeadMoved: (leadId?: string, stage?: string) => logEvent('lead_moved', { leadId, stage }),
    trackTaskCreated: (taskId?: string) => logEvent('task_created', { taskId }),
    trackTaskCompleted: (taskId?: string) => logEvent('task_completed', { taskId }),
    trackProposalCreated: (proposalId?: string) => logEvent('proposal_created', { proposalId }),
    trackContractCreated: (contractId?: string) => logEvent('contract_created', { contractId }),
    trackContractSent: (contractId?: string) => logEvent('contract_sent', { contractId }),
    
    // Feature events
    trackReportGenerated: (reportType?: string) => logEvent('report_generated', { reportType }),
    trackReportExported: (reportType?: string) => logEvent('report_exported', { reportType }),
    trackAIAgentUsed: (agentType?: string) => logEvent('ai_agent_used', { agentType }),
    trackRaioXAnalyzed: (clientId?: string) => logEvent('raio_x_analyzed', { clientId }),
    trackSEOAnalyzed: (clientId?: string) => logEvent('seo_analyzed', { clientId }),
    trackTeamMemberInvited: () => logEvent('team_member_invited'),
    trackSettingsChanged: (setting?: string) => logEvent('settings_changed', { setting }),
    trackTourCompleted: () => logEvent('tour_completed'),
    trackVoiceCommandUsed: () => logEvent('voice_command_used'),
    
    // Navigation events
    trackSidebarClick: (item?: string) => logEvent('sidebar_click', { item }),
    trackPageView: (page?: string) => logEvent('page_view', { page }),
    trackDashboardView: () => logEvent('dashboard_view'),
  };
}
