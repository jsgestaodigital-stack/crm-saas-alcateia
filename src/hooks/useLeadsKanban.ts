import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LeadPipelineStage } from '@/types/lead';
import { classifyError, formatErrorForContext, logError, ErrorType } from '@/lib/errorHandler';

/**
 * Lead minificado para listagem no Kanban
 * Campos mínimos para performance - detalhes carregados sob demanda
 */
export interface KanbanLead {
  id: string;
  company_name: string;
  contact_name: string | null;
  pipeline_stage: LeadPipelineStage;
  temperature: 'cold' | 'warm' | 'hot';
  status: string;
  estimated_value: number | null;
  probability: number | null;
  next_action: string | null;
  next_action_date: string | null;
  responsible: string | null;
  last_activity_at: string;
  created_at: string;
}

// Campos otimizados para listagem (sem email, phone, notes, etc.)
const KANBAN_FIELDS = `
  id,
  company_name,
  contact_name,
  pipeline_stage,
  temperature,
  status,
  estimated_value,
  probability,
  next_action,
  next_action_date,
  responsible,
  last_activity_at,
  created_at
`;

const PAGE_SIZE = 100;

/**
 * Hook otimizado para o Kanban - busca apenas campos necessários
 * Use useLeads() quando precisar de todos os campos do lead
 */
export function useLeadsKanban() {
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const fetchLeads = useCallback(async (pageNum = 0, append = false) => {
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('leads')
        .select(KANBAN_FIELDS, { count: 'exact' })
        .order('last_activity_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      const newLeads = (data ?? []) as KanbanLead[];
      
      if (append) {
        setLeads(prev => [...prev, ...newLeads]);
      } else {
        setLeads(newLeads);
      }
      
      setHasMore(count ? from + newLeads.length < count : false);
      setTotalCount(count);
      setPage(pageNum);
    } catch (error) {
      logError(error, 'fetchLeadsKanban');
      const classified = classifyError(error);
      
      if (classified.type === ErrorType.Permission) {
        toast.error('Você não tem permissão para visualizar os leads');
      } else if (classified.type === ErrorType.Network) {
        toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        toast.error(formatErrorForContext(error, 'leads'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchLeads(page + 1, true);
    }
  }, [hasMore, loading, page, fetchLeads]);

  // Optimistic update for moving leads - instant UI update
  const optimisticMove = useCallback((leadId: string, newStage: LeadPipelineStage) => {
    let newStatus = 'open';
    if (newStage === 'gained') newStatus = 'gained';
    else if (newStage === 'lost') newStatus = 'lost';
    else if (newStage === 'future') newStatus = 'future';

    setLeads(prev => prev.map(l => 
      l.id === leadId 
        ? { ...l, pipeline_stage: newStage, status: newStatus }
        : l
    ));
  }, []);

  useEffect(() => {
    fetchLeads(0, false);

    // Realtime updates - refetch only first page
    const channel = supabase
      .channel('kanban-leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchLeads(0, false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  return {
    leads,
    loading,
    hasMore,
    totalCount,
    loadMore,
    optimisticMove,
    refetch: () => fetchLeads(0, false),
  };
}
