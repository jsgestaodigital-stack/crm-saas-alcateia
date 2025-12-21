import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { normalizeForComparison } from '@/lib/leadValidation';

export interface DuplicateLeadGroup {
  matchType: 'email' | 'phone' | 'name_city' | 'exact' | 'similar';
  key: string;
  leads: {
    id: string;
    company_name: string;
    contact_name: string | null;
    email: string | null;
    whatsapp: string | null;
    city: string | null;
    pipeline_stage: string;
    created_at: string;
  }[];
}

export interface UnificationLog {
  id: string;
  original_lead_id: string;
  merged_lead_id: string | null;
  action_type: 'merged' | 'removed' | 'ignored' | 'detected';
  match_type: string;
  similarity_score: number | null;
  details: Record<string, unknown>;
  executed_by_name: string;
  is_automatic: boolean;
  created_at: string;
}

export interface UnificationStats {
  totalDetected: number;
  totalMerged: number;
  totalAutomatic: number;
  totalManual: number;
}

export function useLeadUnification() {
  const { user, currentAgencyId } = useAuth();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateLeadGroup[]>([]);

  // Buscar logs de unificação
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['lead-unification-logs', currentAgencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_unification_logs')
        .select('*')
        .eq('agency_id', currentAgencyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as UnificationLog[];
    },
    enabled: !!currentAgencyId,
  });

  // Calcular estatísticas
  const stats: UnificationStats = {
    totalDetected: logs?.filter(l => l.action_type === 'detected').length || 0,
    totalMerged: logs?.filter(l => l.action_type === 'merged').length || 0,
    totalAutomatic: logs?.filter(l => l.is_automatic).length || 0,
    totalManual: logs?.filter(l => !l.is_automatic).length || 0,
  };

  // Detectar duplicatas localmente (para prevenção em tempo real)
  const checkDuplicatesLocal = useCallback(async (leadData: {
    company_name: string;
    email?: string | null;
    whatsapp?: string | null;
    city?: string | null;
  }, excludeId?: string): Promise<DuplicateLeadGroup[]> => {
    if (!currentAgencyId) return [];

    const { data: existingLeads, error } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, email, whatsapp, city, pipeline_stage, created_at')
      .eq('agency_id', currentAgencyId)
      .neq('status', 'lost')
      .is('merged_at', null)
      .limit(500);

    if (error || !existingLeads) return [];

    const groups: DuplicateLeadGroup[] = [];
    const normalizedEmail = leadData.email?.toLowerCase().trim();
    const normalizedPhone = leadData.whatsapp?.replace(/\D/g, '');
    const normalizedName = normalizeForComparison(leadData.company_name);
    const normalizedCity = leadData.city ? normalizeForComparison(leadData.city) : null;

    // Verificar email
    if (normalizedEmail) {
      const emailMatches = existingLeads.filter(l => 
        l.id !== excludeId && 
        l.email?.toLowerCase().trim() === normalizedEmail
      );
      if (emailMatches.length > 0) {
        groups.push({
          matchType: 'email',
          key: normalizedEmail,
          leads: emailMatches
        });
      }
    }

    // Verificar telefone
    if (normalizedPhone && normalizedPhone.length >= 10) {
      const phoneMatches = existingLeads.filter(l => 
        l.id !== excludeId && 
        l.whatsapp?.replace(/\D/g, '') === normalizedPhone
      );
      if (phoneMatches.length > 0) {
        groups.push({
          matchType: 'phone',
          key: normalizedPhone,
          leads: phoneMatches
        });
      }
    }

    // Verificar nome + cidade
    if (normalizedName && normalizedCity) {
      const nameCityMatches = existingLeads.filter(l => {
        if (l.id === excludeId) return false;
        const lName = normalizeForComparison(l.company_name);
        const lCity = l.city ? normalizeForComparison(l.city) : null;
        return lName === normalizedName && lCity === normalizedCity;
      });
      if (nameCityMatches.length > 0) {
        groups.push({
          matchType: 'name_city',
          key: `${normalizedName}_${normalizedCity}`,
          leads: nameCityMatches
        });
      }
    }

    // Verificar nome similar (sem cidade)
    if (normalizedName) {
      const nameMatches = existingLeads.filter(l => {
        if (l.id === excludeId) return false;
        const lName = normalizeForComparison(l.company_name);
        return lName === normalizedName;
      });
      if (nameMatches.length > 0 && !groups.some(g => g.matchType === 'name_city')) {
        groups.push({
          matchType: 'exact',
          key: normalizedName,
          leads: nameMatches
        });
      }
    }

    return groups;
  }, [currentAgencyId]);

  // Escanear todas as duplicatas da agência
  const scanAllDuplicates = useCallback(async () => {
    if (!currentAgencyId) return;

    setIsScanning(true);
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, company_name, contact_name, email, whatsapp, city, pipeline_stage, created_at')
        .eq('agency_id', currentAgencyId)
        .neq('status', 'lost')
        .is('merged_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!leads) return;

      const emailGroups = new Map<string, typeof leads>();
      const phoneGroups = new Map<string, typeof leads>();
      const nameCityGroups = new Map<string, typeof leads>();

      for (const lead of leads) {
        // Agrupar por email
        if (lead.email) {
          const key = lead.email.toLowerCase().trim();
          if (!emailGroups.has(key)) emailGroups.set(key, []);
          emailGroups.get(key)!.push(lead);
        }

        // Agrupar por telefone
        if (lead.whatsapp) {
          const key = lead.whatsapp.replace(/\D/g, '');
          if (key.length >= 10) {
            if (!phoneGroups.has(key)) phoneGroups.set(key, []);
            phoneGroups.get(key)!.push(lead);
          }
        }

        // Agrupar por nome + cidade
        if (lead.company_name && lead.city) {
          const key = `${normalizeForComparison(lead.company_name)}_${normalizeForComparison(lead.city)}`;
          if (!nameCityGroups.has(key)) nameCityGroups.set(key, []);
          nameCityGroups.get(key)!.push(lead);
        }
      }

      const groups: DuplicateLeadGroup[] = [];
      const processedIds = new Set<string>();

      // Adicionar grupos de email com duplicatas
      for (const [key, group] of emailGroups) {
        if (group.length > 1) {
          const unprocessed = group.filter(l => !processedIds.has(l.id));
          if (unprocessed.length > 1) {
            groups.push({ matchType: 'email', key, leads: unprocessed });
            unprocessed.forEach(l => processedIds.add(l.id));
          }
        }
      }

      // Adicionar grupos de telefone
      for (const [key, group] of phoneGroups) {
        if (group.length > 1) {
          const unprocessed = group.filter(l => !processedIds.has(l.id));
          if (unprocessed.length > 1) {
            groups.push({ matchType: 'phone', key, leads: unprocessed });
            unprocessed.forEach(l => processedIds.add(l.id));
          }
        }
      }

      // Adicionar grupos de nome+cidade
      for (const [key, group] of nameCityGroups) {
        if (group.length > 1) {
          const unprocessed = group.filter(l => !processedIds.has(l.id));
          if (unprocessed.length > 1) {
            groups.push({ matchType: 'name_city', key, leads: unprocessed });
            unprocessed.forEach(l => processedIds.add(l.id));
          }
        }
      }

      setDuplicateGroups(groups);
      
      if (groups.length === 0) {
        toast.success('Nenhuma duplicata encontrada!');
      } else {
        toast.warning(`${groups.length} grupos de duplicatas encontrados`);
      }
    } catch (error) {
      console.error('Error scanning duplicates:', error);
      toast.error('Erro ao escanear duplicatas');
    } finally {
      setIsScanning(false);
    }
  }, [currentAgencyId]);

  // Executar unificação via Edge Function
  const unifyMutation = useMutation({
    mutationFn: async () => {
      if (!currentAgencyId) throw new Error('Agency ID not found');

      const { data, error } = await supabase.functions.invoke('unify-leads', {
        body: {
          agencyId: currentAgencyId,
          manualRun: true,
          userId: user?.id,
          userName: user?.user_metadata?.full_name || user?.email || 'Usuário'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-unification-logs'] });
      setDuplicateGroups([]);
      
      if (data.unified > 0) {
        toast.success(`${data.unified} leads unificados com sucesso!`);
      } else {
        toast.info('Nenhuma duplicata para unificar');
      }
    },
    onError: (error) => {
      console.error('Unification error:', error);
      toast.error('Erro ao unificar leads');
    }
  });

  // Mover lead para outro funil (evita duplicidade)
  const moveLeadSafely = useCallback(async (
    leadId: string, 
    newStage: 'cold' | 'contacted' | 'qualified' | 'meeting_scheduled' | 'meeting_done' | 'proposal_sent' | 'negotiating' | 'future' | 'gained' | 'lost'
  ): Promise<{ success: boolean; error?: string }> => {
    // Verificar se o lead já existe nessa etapa
    const { data: existingLead, error } = await supabase
      .from('leads')
      .select('id, company_name, pipeline_stage')
      .eq('id', leadId)
      .single();

    if (error || !existingLead) {
      return { success: false, error: 'Lead não encontrado' };
    }

    // Atualizar o estágio
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        pipeline_stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    queryClient.invalidateQueries({ queryKey: ['leads'] });
    return { success: true };
  }, [queryClient]);

  // Ignorar duplicata (marcar como não-duplicata)
  const ignoreDuplicate = useCallback(async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ is_duplicate: false, duplicate_of: null })
      .eq('id', leadId);

    if (error) {
      toast.error('Erro ao ignorar duplicata');
      return false;
    }

    // Registrar log
    await supabase
      .from('lead_unification_logs')
      .insert({
        agency_id: currentAgencyId,
        original_lead_id: leadId,
        action_type: 'ignored',
        match_type: 'manual',
        executed_by: user?.id,
        executed_by_name: user?.user_metadata?.full_name || 'Usuário',
        is_automatic: false
      });

    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.success('Duplicata ignorada');
    return true;
  }, [currentAgencyId, user, queryClient]);

  return {
    // Dados
    logs,
    logsLoading,
    stats,
    duplicateGroups,
    isScanning,
    isUnifying: unifyMutation.isPending,

    // Ações
    checkDuplicatesLocal,
    scanAllDuplicates,
    unifyLeads: unifyMutation.mutate,
    moveLeadSafely,
    ignoreDuplicate,
  };
}
