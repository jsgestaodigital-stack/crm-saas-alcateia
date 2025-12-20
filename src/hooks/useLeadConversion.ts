import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Lead } from '@/types/lead';

export function useLeadConversion() {
  const { user, derived } = useAuth();
  
  const canConvert = derived?.canSalesOrAdmin ?? false;

  const convertLeadToClient = async (
    lead: Lead,
    planType: 'unique' | 'recurring'
  ) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    if (!canConvert) {
      toast.error('Você não tem permissão para converter leads');
      return null;
    }

    try {
      // Use Edge Function to bypass RLS (service role)
      const { data, error } = await supabase.functions.invoke('convert-lead-to-client', {
        body: { leadId: lead.id, planType }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Erro ao converter lead');
        return null;
      }

      if (data?.error) {
        console.error('Conversion error:', data.error);
        toast.error(data.error);
        return null;
      }

      toast.success(
        `✅ Lead convertido em Cliente!`,
        { description: `${lead.company_name} foi enviado para Onboarding` }
      );

      return data.client;
    } catch (error) {
      console.error('Error converting lead:', error);
      toast.error('Erro ao converter lead');
      return null;
    }
  };

  const markLeadAsLost = async (
    leadId: string,
    lostReasonId: string,
    lostNotes?: string
  ) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }

    if (!canConvert) {
      toast.error('Você não tem permissão para marcar leads como perdidos');
      return false;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'lost',
          pipeline_stage: 'lost',
          lost_reason_id: lostReasonId,
          lost_notes: lostNotes || null,
        })
        .eq('id', leadId);

      if (error) throw error;

      // Add activity
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
        
      const userName = profile?.full_name || user.email || 'Usuário';
      
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          type: 'note',
          content: `❌ Lead marcado como Perdido. ${lostNotes || ''}`,
          created_by: user.id,
          created_by_name: userName,
        });

      toast.success('Lead marcado como perdido');
      return true;
    } catch (error) {
      console.error('Error marking lead as lost:', error);
      toast.error('Erro ao marcar lead como perdido');
      return false;
    }
  };

  return {
    convertLeadToClient,
    markLeadAsLost,
    canConvert,
  };
}
