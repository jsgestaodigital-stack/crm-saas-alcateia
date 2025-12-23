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

// Tour steps configuration - focused on always-visible elements
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard-welcome',
    target: 'body',
    content: '🎉 Bem-vindo ao GRank CRM! Vamos fazer um tour rápido para você conhecer as principais funcionalidades do sistema.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    id: 'sidebar-navigation',
    target: '[data-tour="sidebar"]',
    content: '📋 Este é o menu principal do sistema. Aqui você pode alternar entre Vendas, Otimização e Recorrência, além de acessar propostas, contratos e ferramentas.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    id: 'new-client-button',
    target: '[data-tour="new-client"]',
    content: '➕ Clique aqui para adicionar novos clientes ou leads ao sistema. O botão muda conforme o funil ativo.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    id: 'funnel-toggle',
    target: '[data-tour="funnel-toggle"]',
    content: '🔄 Use este seletor para alternar entre os diferentes modos: Vendas (prospecção), Otimização (execução) e Recorrência (tarefas periódicas).',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    id: 'main-stats',
    target: '[data-tour="main-stats"]',
    content: '📊 Aqui você vê os indicadores do funil atual: clientes ativos, leads em aberto, tarefas do dia e mais.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    id: 'kanban-board',
    target: '[data-tour="kanban-board"]',
    content: '📌 O Kanban mostra seus clientes/leads organizados por etapa. Arraste os cards para movê-los no funil.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    content: '🔔 Aqui você recebe alertas, avisos de prazos e atualizações importantes do sistema.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    id: 'tour-complete',
    target: 'body',
    content: '🚀 Pronto! Agora você conhece o básico do GRank CRM. Explore o menu lateral para acessar Propostas, Contratos, Agentes IA, Equipe e muito mais. Bom trabalho!',
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
