import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contract, ContractTemplate, ContractClause } from '@/types/contract';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export function useContracts() {
  const { currentAgencyId, user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    if (!currentAgencyId) return;
    
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('agency_id', currentAgencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = (data || []).map(c => ({
        ...c,
        clauses: (c.clauses as unknown as ContractClause[]) || [],
        variables: (c.variables as Record<string, string>) || {},
        client_ip_address: c.client_ip_address ? String(c.client_ip_address) : undefined
      })) as Contract[];
      
      setContracts(mapped);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching contracts:', err);
    }
  }, [currentAgencyId]);

  const fetchTemplates = useCallback(async () => {
    if (!currentAgencyId) return;
    
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .or(`agency_id.eq.${currentAgencyId},is_system.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = (data || []).map(t => ({
        ...t,
        clauses: (t.clauses as unknown as ContractClause[]) || [],
        variables: (t.variables as Record<string, string>) || {}
      })) as ContractTemplate[];
      
      setTemplates(mapped);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  }, [currentAgencyId]);

  useEffect(() => {
    if (currentAgencyId) {
      setLoading(true);
      Promise.all([fetchContracts(), fetchTemplates()])
        .finally(() => setLoading(false));
    }
  }, [currentAgencyId, fetchContracts, fetchTemplates]);

  const createContract = async (data: Partial<Contract>): Promise<Contract | null> => {
    if (!currentAgencyId || !user) return null;
    
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          agency_id: currentAgencyId,
          created_by: user.id,
          title: data.title || 'Novo Contrato',
          contract_type: data.contract_type || 'single_optimization',
          clauses: data.clauses as unknown as Json || [],
          variables: data.variables as unknown as Json || {},
          contractor_name: data.contractor_name,
          contractor_cnpj: data.contractor_cnpj,
          contractor_cpf: data.contractor_cpf,
          contractor_address: data.contractor_address,
          contractor_email: data.contractor_email,
          contractor_phone: data.contractor_phone,
          contractor_responsible: data.contractor_responsible,
          contracted_name: data.contracted_name,
          contracted_cnpj: data.contracted_cnpj,
          contracted_cpf: data.contracted_cpf,
          contracted_address: data.contracted_address,
          contracted_email: data.contracted_email,
          contracted_phone: data.contracted_phone,
          contracted_responsible: data.contracted_responsible,
          full_price: data.full_price,
          discounted_price: data.discounted_price,
          installments: data.installments,
          installment_value: data.installment_value,
          payment_method: data.payment_method,
          execution_term_days: data.execution_term_days,
          start_date: data.start_date,
          end_date: data.end_date,
          is_recurring: data.is_recurring,
          billing_cycle: data.billing_cycle,
          auto_renewal: data.auto_renewal,
          proposal_id: data.proposal_id,
          client_id: data.client_id,
          lead_id: data.lead_id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchContracts();
      toast.success('Contrato criado com sucesso!');
      
      return {
        ...contract,
        clauses: (contract.clauses as unknown as ContractClause[]) || [],
        variables: (contract.variables as Record<string, string>) || {},
        client_ip_address: contract.client_ip_address ? String(contract.client_ip_address) : undefined
      } as Contract;
    } catch (err: any) {
      toast.error('Erro ao criar contrato: ' + err.message);
      return null;
    }
  };

  const updateContract = async (id: string, data: Partial<Contract>): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.clauses !== undefined) updateData.clauses = data.clauses as unknown as Json;
      if (data.variables !== undefined) updateData.variables = data.variables as unknown as Json;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.contractor_name !== undefined) updateData.contractor_name = data.contractor_name;
      if (data.contracted_name !== undefined) updateData.contracted_name = data.contracted_name;
      if (data.full_price !== undefined) updateData.full_price = data.full_price;
      
      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchContracts();
      toast.success('Contrato atualizado!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao atualizar contrato: ' + err.message);
      return false;
    }
  };

  const deleteContract = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchContracts();
      toast.success('Contrato excluído!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao excluir contrato: ' + err.message);
      return false;
    }
  };

  const sendContract = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchContracts();
      toast.success('Contrato enviado!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao enviar contrato: ' + err.message);
      return false;
    }
  };

  const duplicateContract = async (contract: Contract): Promise<Contract | null> => {
    return createContract({
      ...contract,
      title: `${contract.title} (Cópia)`,
      status: 'draft'
    });
  };

  const createTemplate = async (data: Partial<ContractTemplate>): Promise<ContractTemplate | null> => {
    if (!currentAgencyId || !user) return null;
    
    try {
      const { data: template, error } = await supabase
        .from('contract_templates')
        .insert({
          agency_id: currentAgencyId,
          created_by: user.id,
          name: data.name || 'Novo Modelo',
          description: data.description,
          contract_type: data.contract_type || 'single_optimization',
          clauses: data.clauses as unknown as Json || [],
          variables: data.variables as unknown as Json || {},
          is_default: data.is_default || false
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchTemplates();
      toast.success('Modelo salvo com sucesso!');
      
      return {
        ...template,
        clauses: (template.clauses as unknown as ContractClause[]) || [],
        variables: (template.variables as Record<string, string>) || {}
      } as ContractTemplate;
    } catch (err: any) {
      toast.error('Erro ao criar modelo: ' + err.message);
      return null;
    }
  };

  const getContractByToken = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('record_contract_view', { p_token: token });
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error getting contract:', err);
      return null;
    }
  };

  const signContract = async (token: string, signatureName: string, signatureCpf: string) => {
    try {
      const { data, error } = await supabase.rpc('sign_contract', {
        p_token: token,
        p_signature_name: signatureName,
        p_signature_cpf: signatureCpf
      });
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error signing contract:', err);
      return null;
    }
  };

  return {
    contracts,
    templates,
    loading,
    error,
    createContract,
    updateContract,
    deleteContract,
    sendContract,
    duplicateContract,
    createTemplate,
    getContractByToken,
    signContract,
    refreshContracts: fetchContracts,
    refreshTemplates: fetchTemplates
  };
}
