import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CommissionType = 'operational' | 'sales' | 'recurring';
export type CommissionModel = 'fixed' | 'percentage';
export type TriggerEvent = 'checklist_complete' | 'sale_completed' | 'recurring_active';

export interface CommissionConfig {
  id: string;
  collaborator_name: string;
  collaborator_user_id: string | null;
  commission_type: CommissionType;
  commission_model: CommissionModel;
  amount: number;
  trigger_event: TriggerEvent;
  initial_status: string;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCommissionConfigs() {
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('commission_configs')
        .select('*')
        .order('collaborator_name');

      if (error) throw error;
      setConfigs((data as unknown as CommissionConfig[]) || []);
    } catch (error) {
      console.error('Error fetching commission configs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const createConfig = async (config: Omit<CommissionConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('commission_configs')
        .insert(config as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`Configuração para ${config.collaborator_name} criada!`);
      await fetchConfigs();
      return data as unknown as CommissionConfig;
    } catch (error) {
      console.error('Error creating commission config:', error);
      toast.error('Erro ao criar configuração');
      return null;
    }
  };

  const updateConfig = async (id: string, updates: Partial<CommissionConfig>) => {
    try {
      const { error } = await supabase
        .from('commission_configs')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Configuração atualizada!');
      await fetchConfigs();
      return true;
    } catch (error) {
      console.error('Error updating commission config:', error);
      toast.error('Erro ao atualizar configuração');
      return false;
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('commission_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Configuração removida');
      await fetchConfigs();
      return true;
    } catch (error) {
      console.error('Error deleting commission config:', error);
      toast.error('Erro ao remover configuração');
      return false;
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    return updateConfig(id, { active });
  };

  // Get configs by trigger event (for automation)
  const getConfigsByTrigger = (trigger: TriggerEvent) => {
    return configs.filter(c => c.active && c.trigger_event === trigger);
  };

  return {
    configs,
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleActive,
    getConfigsByTrigger,
    refetch: fetchConfigs,
  };
}

// Static function to get configs for automation (doesn't need hook state)
export async function getActiveConfigsByTrigger(trigger: TriggerEvent): Promise<CommissionConfig[]> {
  try {
    const { data, error } = await supabase
      .from('commission_configs')
      .select('*')
      .eq('active', true)
      .eq('trigger_event', trigger);

    if (error) throw error;
    return (data as unknown as CommissionConfig[]) || [];
  } catch (error) {
    console.error('Error fetching configs for trigger:', trigger, error);
    return [];
  }
}
