import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export type ActivationEvent = 
  | 'added_first_client'
  | 'created_first_lead'
  | 'created_first_task'
  | 'invited_team_member'
  | 'completed_visual_tour'
  | 'accessed_reports'
  | 'customized_settings'
  | 'completed_onboarding_step'
  | 'viewed_dashboard'
  | 'exported_data';

export const ACTIVATION_EVENTS: Record<ActivationEvent, { label: string; description: string }> = {
  added_first_client: { label: 'Primeiro Cliente', description: 'Adicionou o primeiro cliente' },
  created_first_lead: { label: 'Primeiro Lead', description: 'Criou o primeiro lead' },
  created_first_task: { label: 'Primeira Tarefa', description: 'Criou a primeira tarefa' },
  invited_team_member: { label: 'Convidou Membro', description: 'Convidou um membro para a equipe' },
  completed_visual_tour: { label: 'Tour Completo', description: 'Completou o tour visual' },
  accessed_reports: { label: 'Acessou Relatórios', description: 'Visualizou relatórios pela primeira vez' },
  customized_settings: { label: 'Configurações', description: 'Personalizou configurações' },
  completed_onboarding_step: { label: 'Passo Onboarding', description: 'Completou um passo do onboarding' },
  viewed_dashboard: { label: 'Dashboard', description: 'Visualizou o dashboard' },
  exported_data: { label: 'Exportação', description: 'Exportou dados do sistema' },
};

export function useActivation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logEventMutation = useMutation({
    mutationFn: async ({ event, metadata }: { event: ActivationEvent; metadata?: Record<string, unknown> }) => {
      const { data, error } = await supabase.rpc('log_activation_event', {
        _event: event,
        _metadata: (metadata || {}) as Json
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activation-status'] });
      queryClient.invalidateQueries({ queryKey: ['nps-status'] });
    },
  });

  const logEvent = (event: ActivationEvent, metadata?: Record<string, unknown>) => {
    if (user?.id) {
      logEventMutation.mutate({ event, metadata });
    }
  };

  return {
    logEvent,
    isLogging: logEventMutation.isPending,
  };
}
