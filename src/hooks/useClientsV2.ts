import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientV2 {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  status: 'active' | 'paused' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  monthly_value: number | null;
  plan_name: string | null;
  responsible: string | null;
  custom_fields: Record<string, unknown>;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseClientsV2Options {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export function useClientsV2(options: UseClientsV2Options = {}) {
  const [clients, setClients] = useState<ClientV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients_v2')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      if (options.status) {
        query = query.eq('status', options.status as 'active' | 'paused' | 'cancelled');
      }

      if (options.search) {
        query = query.or(`company_name.ilike.%${options.search}%,contact_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      const mappedClients: ClientV2[] = (data || []).map((row) => ({
        id: row.id,
        company_name: row.company_name,
        contact_name: row.contact_name,
        email: row.email,
        phone: row.phone,
        whatsapp: row.whatsapp,
        city: row.city,
        status: row.status as 'active' | 'paused' | 'cancelled',
        start_date: row.start_date,
        end_date: row.end_date,
        monthly_value: row.monthly_value,
        plan_name: row.plan_name,
        responsible: row.responsible,
        custom_fields: (row.custom_fields as Record<string, unknown>) || {},
        tags: (row.tags as string[]) || [],
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      
      setClients(mappedClients);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast({ title: 'Erro ao carregar clientes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [options.search, options.status, options.limit, options.offset, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (data: Partial<ClientV2>) => {
    try {
      const { data: result, error } = await supabase
        .from('clients_v2')
        .insert({
          company_name: data.company_name!,
          contact_name: data.contact_name || null,
          email: data.email || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          city: data.city || null,
          status: data.status || 'active',
          monthly_value: data.monthly_value || null,
          plan_name: data.plan_name || null,
          responsible: data.responsible || null,
          notes: data.notes || null,
          // agency_id filled by trigger
        } as never)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Cliente criado com sucesso' });
      fetchClients();
      return result;
    } catch (err) {
      console.error('Error creating client:', err);
      toast({ title: 'Erro ao criar cliente', variant: 'destructive' });
      return null;
    }
  };

  const updateClient = async (id: string, data: Partial<ClientV2>) => {
    try {
      const { error } = await supabase
        .from('clients_v2')
        .update({
          company_name: data.company_name,
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          city: data.city,
          status: data.status,
          monthly_value: data.monthly_value,
          plan_name: data.plan_name,
          responsible: data.responsible,
          notes: data.notes,
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Cliente atualizado' });
      fetchClients();
      return true;
    } catch (err) {
      console.error('Error updating client:', err);
      toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' });
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients_v2')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Cliente removido' });
      fetchClients();
      return true;
    } catch (err) {
      console.error('Error deleting client:', err);
      toast({ title: 'Erro ao remover cliente', variant: 'destructive' });
      return false;
    }
  };

  return {
    clients,
    loading,
    totalCount,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}
