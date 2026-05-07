import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivation } from '@/hooks/useActivation';
import { toast } from 'sonner';
import type { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';

export interface TourStep extends Step {
  id: string;
}

// Tour steps configuration - COMPLETE system walkthrough
export const TOUR_STEPS: TourStep[] = [
  // === BOAS-VINDAS ===
  {
    id: 'welcome',
    target: 'body',
    content: '🎉 Bem-vindo ao GBRank CRM! Este é o sistema completo para gestão de agências de Google Meu Negócio. Vamos conhecer TUDO que você pode fazer aqui!',
    placement: 'center',
    disableBeacon: true,
  },
  
  // === MENU PRINCIPAL ===
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    content: '📋 Este é o Menu Principal. Aqui você acessa todas as áreas do sistema: funis de trabalho, ferramentas de IA, documentos e gestão.',
    placement: 'right',
    disableBeacon: true,
  },
  
  // === BOTÃO DE AÇÃO ===
  {
    id: 'new-button',
    target: '[data-tour="new-client"]',
    content: '➕ Botão de Ação Rápida: Adicione leads, clientes ou tarefas recorrentes. O botão muda de cor e função conforme o funil ativo.',
    placement: 'right',
    disableBeacon: true,
  },

  // === FUNIL DE VENDAS ===
  {
    id: 'funnel-sales',
    target: '[data-tour="funnel-sales"]',
    content: '🔥 FUNIL DE VENDAS: Gerencie sua prospecção! Cadastre leads, acompanhe temperatura (frio/morno/quente), registre atividades e acompanhe até o fechamento.',
    placement: 'right',
    disableBeacon: true,
  },

  // === FUNIL DE OTIMIZAÇÃO ===
  {
    id: 'funnel-optimization',
    target: '[data-tour="funnel-optimization"]',
    content: '✨ FUNIL DE OTIMIZAÇÃO: Execute o trabalho! Acompanhe seus clientes pelo checklist de 32 pontos do Google Meu Negócio, desde onboarding até entrega.',
    placement: 'right',
    disableBeacon: true,
  },

  // === FUNIL DE RECORRÊNCIA ===
  {
    id: 'funnel-recurrence',
    target: '[data-tour="funnel-recurrence"]',
    content: '🔄 FUNIL DE RECORRÊNCIA: Gerencie tarefas periódicas! Posts semanais, atualizações mensais, fotos de capa - tudo com calendário e controle de conclusão.',
    placement: 'right',
    disableBeacon: true,
  },

  // === SELETOR DE FUNIL ===
  {
    id: 'funnel-toggle',
    target: '[data-tour="funnel-toggle"]',
    content: '🔄 Seletor de Modo: Alterne rapidamente entre Vendas (laranja), Otimização (verde) e Recorrência (roxo). Cada modo tem seu próprio Kanban e estatísticas.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // === ESTATÍSTICAS ===
  {
    id: 'stats',
    target: '[data-tour="main-stats"]',
    content: '📊 Indicadores em Tempo Real: Veja clientes ativos, leads quentes, tarefas do dia e alertas. Os números atualizam automaticamente.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // === SEÇÃO COMERCIAL ===
  {
    id: 'section-commercial',
    target: '[data-tour="section-comercial"]',
    content: '💼 SEÇÃO COMERCIAL: Aqui ficam as ferramentas de vendas - Propostas, Contratos e o Agente Raio-X para análise de fechamento.',
    placement: 'right',
    disableBeacon: true,
  },

  // === PROPOSTAS ===
  {
    id: 'proposals',
    target: '[data-tour="nav-propostas"]',
    content: '📄 GERADOR DE PROPOSTAS: Crie propostas profissionais com IA! Basta preencher os dados do cliente e o sistema gera uma proposta completa e personalizada.',
    placement: 'right',
    disableBeacon: true,
  },

  // === CONTRATOS ===
  {
    id: 'contracts',
    target: '[data-tour="nav-contratos"]',
    content: '📝 GERADOR DE CONTRATOS: Contratos digitais com assinatura eletrônica! Gere, envie e acompanhe assinaturas. Integração com Autentique para validade jurídica.',
    placement: 'right',
    disableBeacon: true,
  },

  // === RAIO-X ===
  {
    id: 'raiox',
    target: '[data-tour="nav-raiox"]',
    content: '⚡ AGENTE RAIO-X: Cole a transcrição da sua reunião de vendas e a IA analisa pontos fortes, objeções e dá sugestões de fechamento. Seu closer virtual!',
    placement: 'right',
    disableBeacon: true,
  },

  // === SEÇÃO FERRAMENTAS ===
  {
    id: 'section-tools',
    target: '[data-tour="section-ferramentas"]',
    content: '🛠️ FERRAMENTAS DE IA: Agentes especializados que automatizam tarefas complexas. SEO, Suspensões, Relatórios e mais.',
    placement: 'right',
    disableBeacon: true,
  },

  // === AGENTE SEO ===
  {
    id: 'agent-seo',
    target: '[data-tour="nav-agente-seo"]',
    content: '🔍 AGENTE SEO: ChatGPT especializado em Google Meu Negócio! Cole dados do perfil e receba sugestões de categoria, descrição, atributos e mais. Copie e cole direto no GMB.',
    placement: 'right',
    disableBeacon: true,
  },

  // === AGENTE SUSPENSÕES ===
  {
    id: 'agent-suspensions',
    target: '[data-tour="nav-agente-suspensoes"]',
    content: '⚠️ AGENTE SUSPENSÕES: Perfil do cliente foi suspenso? Cole os dados e a IA identifica possíveis causas e dá o passo-a-passo para recuperação.',
    placement: 'right',
    disableBeacon: true,
  },

  // === AGENTE RELATÓRIOS ===
  {
    id: 'agent-reports',
    target: '[data-tour="nav-agente-relatorios"]',
    content: '📈 AGENTE RELATÓRIOS: Gere relatórios profissionais para seus clientes! Cole as métricas do GMB e receba um relatório completo pronto para enviar.',
    placement: 'right',
    disableBeacon: true,
  },

  // === CENTRAL OPERACIONAL ===
  {
    id: 'questions',
    target: '[data-tour="nav-central-operacional"]',
    content: '💬 CENTRAL OPERACIONAL: Canal de comunicação entre equipe. Operadores fazem perguntas, gestores respondem. Tudo registrado e organizado.',
    placement: 'right',
    disableBeacon: true,
  },

  // === NOTIFICAÇÕES ===
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    content: '🔔 Central de Alertas: Receba notificações de prazos, tarefas pendentes, leads quentes e atualizações importantes.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // === TEMA ===
  {
    id: 'theme',
    target: '[data-tour="theme-toggle"]',
    content: '🌙 Tema Claro/Escuro: Alterne entre modo claro e escuro conforme sua preferência. Sua escolha é salva automaticamente.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // === TOUR GUIADO ===
  {
    id: 'tour-button',
    target: '[data-tour="tour-button"]',
    content: '🎯 Refazer Tour: Clique aqui sempre que quiser rever este tour ou mostrar para um membro da equipe.',
    placement: 'bottom',
    disableBeacon: true,
  },

  // === CONCLUSÃO ===
  {
    id: 'complete',
    target: 'body',
    content: '🚀 PRONTO! Você conheceu todas as funcionalidades do GBRank CRM. Agora é só começar a usar! Dica: Inicie cadastrando seu primeiro lead no Funil de Vendas. Bom trabalho!',
    placement: 'center',
    disableBeacon: true,
  },
];

interface TourStatus {
  completed_steps: string[];
  dismissed: boolean;
  completed: boolean;
  tour_started: boolean;
  tour_completed: boolean;
}

// Global state to persist across hook instances and re-renders
let globalIsRunning = false;
let globalStepIndex = 0;

export function useVisualTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logEvent } = useActivation();
  const [isRunning, setIsRunning] = useState(globalIsRunning);
  const [stepIndex, setStepIndex] = useState(globalStepIndex);

  // Sync local state with global
  const setRunning = useCallback((value: boolean) => {
    globalIsRunning = value;
    setIsRunning(value);
  }, []);

  const setStep = useCallback((value: number) => {
    globalStepIndex = value;
    setStepIndex(value);
  }, []);

  // Fetch tour status
  const { data: status, isLoading } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: async (): Promise<TourStatus> => {
      const { data, error } = await supabase.rpc('get_onboarding_status');
      
      if (error) {
        console.error('Error fetching tour status:', error);
        return { 
          completed_steps: [], 
          dismissed: false, 
          completed: false,
          tour_started: false,
          tour_completed: false
        };
      }
      
      const result = data as unknown as TourStatus;
      return {
        completed_steps: result?.completed_steps || [],
        dismissed: result?.dismissed || false,
        completed: result?.completed || false,
        tour_started: result?.tour_started || false,
        tour_completed: result?.tour_completed || false,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Start tour mutation
  const startMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('start_visual_tour');
      if (error) throw error;
      return data;
    },
    // Don't invalidate queries immediately - it causes re-render that resets isRunning
    // The status will be updated when tour completes
  });

  // Complete tour mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('complete_visual_tour');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      logEvent('completed_visual_tour');
      toast.success('Tour concluído!', {
        description: 'Você já conhece as principais funcionalidades do sistema.',
      });
    },
  });

  // Reset tour mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reset_visual_tour');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      toast.info('Tour resetado', {
        description: 'Você pode iniciar o tour novamente.',
      });
    },
  });

  // Start the tour
  const startTour = useCallback(() => {
    console.log('[VisualTour] Starting tour...');
    setStep(0);
    setRunning(true);
    startMutation.mutate();
  }, [startMutation, setStep, setRunning]);

  // Complete the tour
  const completeTour = useCallback(() => {
    setRunning(false);
    setStep(0);
    completeMutation.mutate();
  }, [completeMutation, setStep, setRunning]);

  // Dismiss/skip the tour
  const dismissTour = useCallback(() => {
    setRunning(false);
    setStep(0);
    completeMutation.mutate();
  }, [completeMutation, setStep, setRunning]);

  // Reset the tour (admin)
  const resetTour = useCallback(() => {
    resetMutation.mutate();
  }, [resetMutation]);

  // Handle Joyride callback
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, index, type } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      completeTour();
    } else if (type === 'step:after') {
      setStep(index + 1);
    }
  }, [completeTour, setStep]);

  // Should auto-start tour on first visit
  const shouldAutoStart = !status?.tour_started && !status?.tour_completed && !isLoading;

  return {
    steps: TOUR_STEPS,
    isRunning,
    stepIndex,
    isLoading,
    tourStarted: status?.tour_started || false,
    tourCompleted: status?.tour_completed || false,
    shouldAutoStart,
    startTour,
    completeTour,
    dismissTour,
    resetTour,
    handleJoyrideCallback,
    setStepIndex,
  };
}
