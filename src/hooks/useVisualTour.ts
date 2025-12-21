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

// Tour steps configuration
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard-welcome',
    target: 'body',
    content: 'Bem-vindo ao Rankeia! Vamos fazer um tour rápido para você conhecer as principais funcionalidades do sistema.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    id: 'sidebar-navigation',
    target: '[data-tour="sidebar"]',
    content: 'Aqui está sua navegação principal. Alterne entre os funis de Otimização, Vendas e Recorrência.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    id: 'funnel-toggle',
    target: '[data-tour="funnel-toggle"]',
    content: 'Use este seletor para alternar entre os diferentes modos de trabalho: Operacional, Vendas e Recorrência.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    id: 'main-stats',
    target: '[data-tour="main-stats"]',
    content: 'Acompanhe os KPIs mais importantes da sua operação em tempo real nesta área.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    id: 'kanban-board',
    target: '[data-tour="kanban-board"]',
    content: 'O Kanban permite visualizar e gerenciar o fluxo de clientes ou leads. Arraste os cards entre as colunas.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    id: 'new-client-button',
    target: '[data-tour="new-client"]',
    content: 'Clique aqui para adicionar novos clientes ou leads ao sistema.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    id: 'team-button',
    target: '[data-tour="team-button"]',
    content: 'Gerencie sua equipe: convide membros, atribua funções e configure permissões.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    id: 'admin-button',
    target: '[data-tour="admin-button"]',
    content: 'Acesse configurações avançadas, planos, integrações e auditoria do sistema.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    content: 'Receba alertas importantes, atualizações e notificações do sistema aqui.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    id: 'tour-complete',
    target: 'body',
    content: 'Parabéns! Agora você conhece o básico do Rankeia. Explore à vontade e bom trabalho!',
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

export function useVisualTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logEvent } = useActivation();
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
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
    setStepIndex(0);
    setIsRunning(true);
    startMutation.mutate();
  }, [startMutation]);

  // Complete the tour
  const completeTour = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
    completeMutation.mutate();
  }, [completeMutation]);

  // Dismiss/skip the tour
  const dismissTour = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
    completeMutation.mutate();
  }, [completeMutation]);

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
      setStepIndex(index + 1);
    }
  }, [completeTour]);

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
