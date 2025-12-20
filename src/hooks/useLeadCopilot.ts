import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type CopilotInteractionType = 'summary' | 'suggestion' | 'chat' | 'analysis';

interface CopilotResponse {
  success: boolean;
  type: CopilotInteractionType;
  response: string;
  tokensUsed?: number;
}

interface AiInteraction {
  id: string;
  lead_id: string;
  user_id: string | null;
  user_name: string | null;
  interaction_type: string;
  prompt: string | null;
  ai_response: string | null;
  model: string | null;
  tokens_used: number | null;
  created_at: string;
}

export function useLeadCopilot(leadId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<CopilotInteractionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<AiInteraction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);

  // Fetch AI interactions history
  const fetchInteractions = useCallback(async (typeFilter?: string) => {
    if (!leadId) return;
    
    setInteractionsLoading(true);
    try {
      let query = supabase
        .from('lead_ai_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (typeFilter) {
        query = query.eq('interaction_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInteractions(data || []);
    } catch (err) {
      console.error('[useLeadCopilot] Error fetching interactions:', err);
    } finally {
      setInteractionsLoading(false);
    }
  }, [leadId]);

  // Call AI Copilot
  const callCopilot = useCallback(async (
    type: CopilotInteractionType,
    userMessage?: string
  ): Promise<CopilotResponse | null> => {
    if (!leadId) {
      toast({
        title: 'Erro',
        description: 'ID do lead não encontrado',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    setLoadingType(type);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('lead-copilot', {
        body: {
          leadId,
          type,
          userMessage,
        },
      });

      if (error) {
        console.error('[useLeadCopilot] Function error:', error);
        throw new Error(error.message || 'Erro ao chamar o copiloto');
      }

      if (data?.error) {
        // Handle specific error codes
        if (data.error.includes('Rate limit')) {
          toast({
            title: 'Limite de requisições',
            description: 'Aguarde um momento antes de tentar novamente.',
            variant: 'destructive',
          });
          throw new Error(data.error);
        }
        if (data.error.includes('credits')) {
          toast({
            title: 'Créditos de IA',
            description: 'Créditos de IA esgotados. Entre em contato com o suporte.',
            variant: 'destructive',
          });
          throw new Error(data.error);
        }
        throw new Error(data.error);
      }

      // Refresh interactions after successful call
      await fetchInteractions();

      return data as CopilotResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useLeadCopilot] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  }, [leadId, fetchInteractions]);

  // Convenience methods
  const generateSummary = useCallback(() => callCopilot('summary'), [callCopilot]);
  const suggestNextAction = useCallback(() => callCopilot('suggestion'), [callCopilot]);
  const analyzeQuality = useCallback(() => callCopilot('analysis'), [callCopilot]);
  const chat = useCallback((message: string) => callCopilot('chat', message), [callCopilot]);

  return {
    isLoading,
    loadingType,
    error,
    interactions,
    interactionsLoading,
    generateSummary,
    suggestNextAction,
    analyzeQuality,
    chat,
    callCopilot,
    fetchInteractions,
  };
}
