import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  action?: () => void;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { 
    id: 'create_client', 
    label: 'Cadastre seu primeiro cliente',
    description: 'Adicione um cliente ao sistema de otimização',
    icon: 'Users'
  },
  { 
    id: 'import_leads', 
    label: 'Adicione seus primeiros leads',
    description: 'Importe ou cadastre leads no funil de vendas',
    icon: 'Target'
  },
  { 
    id: 'configure_pipeline', 
    label: 'Configure seu funil de vendas',
    description: 'Personalize as etapas do seu pipeline',
    icon: 'Layers'
  },
  { 
    id: 'assign_task', 
    label: 'Atribua sua primeira tarefa',
    description: 'Crie uma tarefa para sua equipe',
    icon: 'CheckSquare'
  },
  { 
    id: 'invite_member', 
    label: 'Convide um membro da equipe',
    description: 'Adicione colaboradores à sua agência',
    icon: 'UserPlus'
  },
  { 
    id: 'view_dashboard', 
    label: 'Acesse o painel de performance',
    description: 'Explore os relatórios e métricas',
    icon: 'BarChart3'
  },
  { 
    id: 'explore_agents', 
    label: 'Explore os agentes de IA',
    description: 'Conheça o Agente SEO e outros recursos',
    icon: 'Sparkles'
  },
];

interface OnboardingStatus {
  completed_steps: string[];
  dismissed: boolean;
  completed: boolean;
}

export function useOnboardingChecklist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: async (): Promise<OnboardingStatus> => {
      const { data, error } = await supabase.rpc('get_onboarding_status');
      
      if (error) {
        console.error('Error fetching onboarding status:', error);
        return { completed_steps: [], dismissed: false, completed: false };
      }
      
      // Safely parse the response
      const result = data as unknown as OnboardingStatus;
      return {
        completed_steps: result?.completed_steps || [],
        dismissed: result?.dismissed || false,
        completed: result?.completed || false,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const markStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { data, error } = await supabase.rpc('mark_onboarding_step_completed', {
        _step: stepId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, stepId) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      const step = ONBOARDING_STEPS.find(s => s.id === stepId);
      if (step) {
        toast.success(`✓ ${step.label}`, {
          description: 'Passo do onboarding concluído!'
        });
      }
    },
    onError: (error) => {
      console.error('Error marking step:', error);
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('dismiss_onboarding');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      toast.info('Checklist minimizado', {
        description: 'Você pode reabri-lo a qualquer momento.'
      });
    }
  });

  const completedSteps = status?.completed_steps || [];
  const completedCount = completedSteps.length;
  const totalSteps = ONBOARDING_STEPS.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  
  const markStepDone = (stepId: string) => {
    if (!isStepCompleted(stepId)) {
      markStepMutation.mutate(stepId);
    }
  };

  const dismissChecklist = () => {
    dismissMutation.mutate();
  };

  // Should show checklist if not dismissed and not completed
  const shouldShow = !status?.dismissed && !status?.completed && completedCount < totalSteps;

  return {
    steps: ONBOARDING_STEPS,
    completedSteps,
    completedCount,
    totalSteps,
    progressPercentage,
    isStepCompleted,
    markStepDone,
    dismissChecklist,
    isLoading,
    isDismissed: status?.dismissed || false,
    isCompleted: status?.completed || false,
    shouldShow,
    isMarkingStep: markStepMutation.isPending,
  };
}
