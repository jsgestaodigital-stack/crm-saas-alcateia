import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Lead, 
  LeadListItem,
  LeadActivity, 
  LeadSource, 
  LostReason,
  LeadPipelineStage,
  LeadActivityType
} from '@/types/lead';
import { createAutoCommission } from './useCommissions';

// Campos mínimos para listagem no Kanban (performance)
const LEAD_LIST_FIELDS = `
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
` as const;

// Limite de leads por página
const PAGE_SIZE = 100;

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { user, currentAgencyId } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';

  const fetchLeads = useCallback(async (pageNum = 0, append = false) => {
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Busca todos os campos para manter compatibilidade com componentes que usam email, phone, etc.
      const { data, error, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('last_activity_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      const newLeads = (data ?? []) as Lead[];
      
      if (append) {
        setLeads(prev => [...prev, ...newLeads]);
      } else {
        setLeads(newLeads);
      }
      
      // Verifica se há mais páginas
      setHasMore(count ? from + newLeads.length < count : false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchLeads(page + 1, true);
    }
  }, [hasMore, loading, page, fetchLeads]);

  useEffect(() => {
    fetchLeads(0, false);

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchLeads(0, false) // Reset to first page on changes
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  const createLead = async (leadData: Partial<Lead>) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const insertData = {
        company_name: leadData.company_name!,
        contact_name: leadData.contact_name || null,
        whatsapp: leadData.whatsapp || null,
        phone: leadData.phone || null,
        email: leadData.email || null,
        city: leadData.city || null,
        main_category: leadData.main_category || null,
        source_id: leadData.source_id || null,
        source_custom: leadData.source_custom || null,
        pipeline_stage: leadData.pipeline_stage || 'cold',
        temperature: leadData.temperature || 'cold',
        probability: leadData.probability || 0,
        estimated_value: leadData.estimated_value || null,
        next_action: leadData.next_action || null,
        next_action_date: leadData.next_action_date || null,
        notes: leadData.notes || null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      toast.success(`Lead "${leadData.company_name}" criado!`);
      return data as unknown as Lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
      return null;
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          ...updates,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
      return false;
    }
  };

  const moveLead = async (leadId: string, newStage: LeadPipelineStage) => {
    // Get the lead before updating to check for stage change
    const lead = leads.find(l => l.id === leadId);
    const previousStage = lead?.pipeline_stage;

    const updates: Partial<Lead> = {
      pipeline_stage: newStage,
    };

    // Auto-update status based on stage
    if (newStage === 'gained') {
      updates.status = 'gained';
    } else if (newStage === 'lost') {
      updates.status = 'lost';
    } else if (newStage === 'future') {
      updates.status = 'future';
    } else {
      updates.status = 'open';
    }

    const success = await updateLead(leadId, updates);
    
    // Force immediate refetch to update UI
    if (success) {
      await fetchLeads();

      // AUTO-CREATE COMMISSION when lead moves to "gained" (Venda)
      if (newStage === 'gained' && previousStage !== 'gained' && lead && user) {
        const saleValue = lead.estimated_value || 0;
        const commissionAmount = saleValue * 0.10; // 10% default commission

        // Create commission for SDR (who created the lead)
        if (commissionAmount > 0) {
          await createAutoCommission({
            leadId: lead.id,
            clientName: lead.company_name,
            saleValue,
            recipientName: lead.responsible || userName,
            recipientRoleLabel: 'Vendedor',
            amount: commissionAmount,
            description: `Venda ${lead.company_name}`,
            userId: user.id,
          });
        }
      }
    }
    
    return success;
  };

  const deleteLead = async (leadId: string) => {
    try {
      // Use backend function so deletion works even if the lead has activities/analyses/commissions
      const { error } = await supabase.rpc('delete_lead' as any, { _lead_id: leadId } as any);

      if (error) throw error;

      // Update local state immediately (whoever is using this hook instance)
      setLeads((prev) => prev.filter((l) => l.id !== leadId));

      toast.success('Lead excluído');
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
      return false;
    }
  };

  return {
    leads,
    loading,
    hasMore,
    loadMore,
    createLead,
    updateLead,
    moveLead,
    deleteLead,
    refetch: () => fetchLeads(0, false),
  };
}

export function useLeadActivities(leadId: string | null) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';

  const fetchActivities = useCallback(async () => {
    if (!leadId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities((data as unknown as LeadActivity[]) || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchActivities();

    if (leadId) {
      const channel = supabase
        .channel(`lead-activities-${leadId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'lead_activities',
            filter: `lead_id=eq.${leadId}`
          },
          () => fetchActivities()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [leadId, fetchActivities]);

  const addActivity = async (type: LeadActivityType, content: string, link?: string) => {
    if (!user || !leadId) {
      toast.error('Erro ao adicionar atividade');
      return false;
    }

    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          type,
          content,
          link: link || null,
          created_by: user.id,
          created_by_name: userName,
        });

      if (error) throw error;

      // Update lead's last_activity_at
      await supabase
        .from('leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', leadId);

      toast.success('Atividade registrada');
      return true;
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Erro ao adicionar atividade');
      return false;
    }
  };

  return {
    activities,
    loading,
    addActivity,
    refetch: fetchActivities,
  };
}

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const { data, error } = await supabase
          .from('lead_sources')
          .select('*')
          .eq('active', true)
          .order('label');

        if (error) throw error;
        setSources((data as unknown as LeadSource[]) || []);
      } catch (error) {
        console.error('Error fetching sources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  const addSource = async (label: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .insert({ label })
        .select()
        .single();

      if (error) throw error;
      setSources(prev => [...prev, data as unknown as LeadSource]);
      return data as unknown as LeadSource;
    } catch (error) {
      console.error('Error adding source:', error);
      return null;
    }
  };

  return { sources, loading, addSource };
}

export function useLostReasons() {
  const [reasons, setReasons] = useState<LostReason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const { data, error } = await supabase
          .from('lost_reasons')
          .select('*')
          .eq('active', true)
          .order('sort_order');

        if (error) throw error;
        setReasons((data as unknown as LostReason[]) || []);
      } catch (error) {
        console.error('Error fetching lost reasons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReasons();
  }, []);

  return { reasons, loading };
}
