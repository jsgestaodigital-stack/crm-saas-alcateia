import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NPSStatus {
  show: boolean;
  reason?: string;
  activation_count?: number;
  days?: number;
}

export function useNPSFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if local storage has dismissed flag
  useEffect(() => {
    const dismissed = localStorage.getItem('nps-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Re-show after 30 days
      if ((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) < 30) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('nps-dismissed');
      }
    }
  }, []);

  // Check if should show NPS
  const { data: npsStatus, isLoading } = useQuery({
    queryKey: ['nps-status', user?.id],
    queryFn: async (): Promise<NPSStatus> => {
      const { data, error } = await supabase.rpc('should_show_nps');
      
      if (error) {
        console.error('Error checking NPS status:', error);
        return { show: false };
      }
      
      return data as unknown as NPSStatus;
    },
    enabled: !!user?.id && !isDismissed,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Submit NPS mutation
  const submitMutation = useMutation({
    mutationFn: async ({ score, feedback }: { score: number; feedback?: string }) => {
      const { data, error } = await supabase.rpc('submit_nps', {
        _score: score,
        _feedback: feedback || null
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nps-status'] });
      setIsModalOpen(false);
      toast.success('Obrigado pelo feedback!', {
        description: 'Sua avaliação nos ajuda a melhorar o sistema.',
      });
    },
    onError: () => {
      toast.error('Erro ao enviar avaliação');
    },
  });

  // Dismiss NPS temporarily
  const dismiss = useCallback(() => {
    localStorage.setItem('nps-dismissed', new Date().toISOString());
    setIsDismissed(true);
    setIsModalOpen(false);
  }, []);

  // Submit NPS
  const submit = useCallback((score: number, feedback?: string) => {
    submitMutation.mutate({ score, feedback });
  }, [submitMutation]);

  // Auto-open modal if conditions are met
  useEffect(() => {
    if (npsStatus?.show && !isDismissed && !isModalOpen) {
      // Delay to not interrupt user immediately
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [npsStatus?.show, isDismissed, isModalOpen]);

  return {
    isModalOpen,
    setIsModalOpen,
    shouldShow: npsStatus?.show && !isDismissed,
    activationCount: npsStatus?.activation_count || 0,
    daysSinceSignup: npsStatus?.days || 0,
    isLoading,
    submit,
    dismiss,
    isSubmitting: submitMutation.isPending,
  };
}
