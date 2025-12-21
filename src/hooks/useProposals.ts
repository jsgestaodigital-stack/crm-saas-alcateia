import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Proposal, ProposalTemplate, ProposalBlock, DEFAULT_PROPOSAL_BLOCKS } from '@/types/proposal';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export function useProposals() {
  const { user, currentAgencyId: agencyId } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!agencyId) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('proposals')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setProposals((data || []).map(p => ({
        ...p,
        blocks: p.blocks as unknown as ProposalBlock[],
        variables: p.variables as Record<string, string>,
        status: p.status as Proposal['status']
      })));
    } catch (err: any) {
      console.error('Error fetching proposals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  const fetchTemplates = useCallback(async () => {
    if (!agencyId) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('proposal_templates')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setTemplates((data || []).map(t => ({
        ...t,
        blocks: t.blocks as unknown as ProposalBlock[]
      })));
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchProposals();
    fetchTemplates();
  }, [fetchProposals, fetchTemplates]);

  const createProposal = async (data: Partial<Proposal>): Promise<Proposal | null> => {
    if (!agencyId || !user) return null;
    
    try {
      const newProposal = {
        agency_id: agencyId,
        created_by: user.id,
        title: data.title || 'Nova Proposta',
        client_name: data.client_name || '',
        company_name: data.company_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        city: data.city,
        blocks: data.blocks || DEFAULT_PROPOSAL_BLOCKS,
        variables: data.variables || {},
        full_price: data.full_price,
        discounted_price: data.discounted_price,
        installments: data.installments,
        installment_value: data.installment_value,
        payment_method: data.payment_method,
        discount_reason: data.discount_reason,
        valid_until: data.valid_until,
        lead_id: data.lead_id,
        client_id: data.client_id,
        ai_generated: data.ai_generated || false,
        ai_prompt: data.ai_prompt
      };

      const { data: created, error: insertError } = await supabase
        .from('proposals')
        .insert({
          ...newProposal,
          blocks: newProposal.blocks as unknown as Json,
          variables: newProposal.variables as unknown as Json
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      const proposal: Proposal = {
        ...created,
        blocks: created.blocks as unknown as ProposalBlock[],
        variables: created.variables as Record<string, string>,
        status: created.status as Proposal['status']
      };
      
      setProposals(prev => [proposal, ...prev]);
      toast.success('Proposta criada com sucesso!');
      return proposal;
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      toast.error('Erro ao criar proposta');
      return null;
    }
  };

  const updateProposal = async (id: string, data: Partial<Proposal>): Promise<boolean> => {
    try {
      const updateData: any = { ...data, updated_at: new Date().toISOString() };
      if (data.blocks) updateData.blocks = data.blocks as unknown as Json;
      if (data.variables) updateData.variables = data.variables as unknown as Json;
      
      const { error: updateError } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
      
      setProposals(prev => prev.map(p => 
        p.id === id ? { ...p, ...data } : p
      ));
      
      return true;
    } catch (err: any) {
      console.error('Error updating proposal:', err);
      toast.error('Erro ao atualizar proposta');
      return false;
    }
  };

  const deleteProposal = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setProposals(prev => prev.filter(p => p.id !== id));
      toast.success('Proposta excluída');
      return true;
    } catch (err: any) {
      console.error('Error deleting proposal:', err);
      toast.error('Erro ao excluir proposta');
      return false;
    }
  };

  const sendProposal = async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setProposals(prev => prev.map(p => 
        p.id === id ? { ...p, status: 'sent' as const, sent_at: new Date().toISOString() } : p
      ));
      
      toast.success('Proposta enviada!');
      return true;
    } catch (err: any) {
      console.error('Error sending proposal:', err);
      toast.error('Erro ao enviar proposta');
      return false;
    }
  };

  const duplicateProposal = async (proposal: Proposal): Promise<Proposal | null> => {
    const newProposal = await createProposal({
      ...proposal,
      title: `${proposal.title} (Cópia)`,
      status: 'draft' as const,
      sent_at: null,
      first_viewed_at: null,
      last_viewed_at: null,
      view_count: 0
    });
    return newProposal;
  };

  const createTemplate = async (data: Partial<ProposalTemplate>): Promise<ProposalTemplate | null> => {
    if (!agencyId || !user) return null;
    
    try {
      const newTemplate = {
        agency_id: agencyId,
        created_by: user.id,
        name: data.name || 'Novo Template',
        description: data.description,
        blocks: data.blocks || DEFAULT_PROPOSAL_BLOCKS,
        is_default: data.is_default || false
      };

      const { data: created, error: insertError } = await supabase
        .from('proposal_templates')
        .insert({
          ...newTemplate,
          blocks: newTemplate.blocks as unknown as Json
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      const template: ProposalTemplate = {
        ...created,
        blocks: created.blocks as unknown as ProposalBlock[]
      };
      
      setTemplates(prev => [template, ...prev]);
      toast.success('Template criado com sucesso!');
      return template;
    } catch (err: any) {
      console.error('Error creating template:', err);
      toast.error('Erro ao criar template');
      return null;
    }
  };

  const getProposalByToken = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('record_proposal_view', {
        _token: token,
        _ip: null,
        _user_agent: navigator.userAgent,
        _referrer: document.referrer || null
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error getting proposal by token:', err);
      return null;
    }
  };

  return {
    proposals,
    templates,
    loading,
    error,
    fetchProposals,
    fetchTemplates,
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal,
    duplicateProposal,
    createTemplate,
    getProposalByToken
  };
}
