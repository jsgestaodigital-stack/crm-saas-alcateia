import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errorHandler';
import { reportError } from '@/lib/reportError';
import { requireAgencyId } from '@/lib/guardAgency';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useClientsV2 — DEPRECATED SHIM
 *
 * `clients_v2` was abandoned empty. The source of truth is `public.clients`.
 * This hook keeps the ClientV2 shape consumed by ClientsV2List/ClientV2Dialog
 * but reads/writes against `clients` instead.
 */

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

type ClientsRow = {
  id: string;
  company_name: string;
  city: string | null;
  responsible: string | null;
  notes: string | null;
  plan_type: string | null;
  start_date: string | null;
  whatsapp_link: string | null;
  suspended_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  column_id: string | null;
};

function mapRow(row: ClientsRow): ClientV2 {
  let status: ClientV2['status'] = 'active';
  if (row.suspended_at) status = 'paused';
  if (row.column_id === 'finalized' || row.column_id === 'delivered') status = 'cancelled';

  return {
    id: row.id,
    company_name: row.company_name,
    contact_name: null,
    email: null,
    phone: null,
    whatsapp: row.whatsapp_link,
    city: row.city,
    status,
    start_date: row.start_date,
    end_date: null,
    monthly_value: null,
    plan_name: row.plan_type,
    responsible: row.responsible,
    custom_fields: {},
    tags: [],
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useClientsV2(options: UseClientsV2Options = {}) {
  const [clients, setClients] = useState<ClientV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { currentAgencyId } = useAuth();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('id, company_name, city, responsible, notes, plan_type, start_date, whatsapp_link, suspended_at, deleted_at, created_at, updated_at, column_id', { count: 'exact' })
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      if (options.status === 'paused') {
        query = query.not('suspended_at', 'is', null);
      } else if (options.status === 'active') {
        query = query.is('suspended_at', null);
      } else if (options.status === 'cancelled') {
        query = query.in('column_id', ['finalized', 'delivered']);
      }

      if (options.search) {
        query = query.ilike('company_name', `%${options.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setClients((data || []).map((r) => mapRow(r as ClientsRow)));
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast({ title: getErrorMessage(err), variant: 'destructive' });
      void reportError('hook_error', getErrorMessage(err), 'useClientsV2', { originalError: String(err) });
    } finally {
      setLoading(false);
    }
  }, [options.search, options.status, options.limit, options.offset, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (data: Partial<ClientV2>) => {
    try {
      requireAgencyId(currentAgencyId);

      const { data: result, error } = await supabase
        .from('clients')
        .insert({
          company_name: data.company_name!,
          city: data.city || null,
          responsible: data.responsible || null,
          notes: data.notes || null,
          plan_type: data.plan_name || null,
          whatsapp_link: data.whatsapp || null,
          column_id: 'briefing',
          status: 'on_track',
        } as never)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Cliente criado com sucesso' });
      fetchClients();
      return result;
    } catch (err) {
      console.error('Error creating client:', err);
      toast({ title: getErrorMessage(err), variant: 'destructive' });
      void reportError('hook_error', getErrorMessage(err), 'useClientsV2', { originalError: String(err) });
      return null;
    }
  };

  const updateClient = async (id: string, data: Partial<ClientV2>) => {
    try {
      const patch: Record<string, unknown> = {};
      if (data.company_name !== undefined) patch.company_name = data.company_name;
      if (data.city !== undefined) patch.city = data.city;
      if (data.responsible !== undefined) patch.responsible = data.responsible;
      if (data.notes !== undefined) patch.notes = data.notes;
      if (data.plan_name !== undefined) patch.plan_type = data.plan_name;
      if (data.whatsapp !== undefined) patch.whatsapp_link = data.whatsapp;
      if (data.status !== undefined) {
        patch.suspended_at = data.status === 'paused' ? new Date().toISOString() : null;
      }

      const { error } = await supabase.from('clients').update(patch as never).eq('id', id);
      if (error) throw error;
      toast({ title: 'Cliente atualizado' });
      fetchClients();
      return true;
    } catch (err) {
      console.error('Error updating client:', err);
      toast({ title: getErrorMessage(err), variant: 'destructive' });
      void reportError('hook_error', getErrorMessage(err), 'useClientsV2', { originalError: String(err) });
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Cliente removido' });
      fetchClients();
      return true;
    } catch (err) {
      console.error('Error deleting client:', err);
      toast({ title: getErrorMessage(err), variant: 'destructive' });
      void reportError('hook_error', getErrorMessage(err), 'useClientsV2', { originalError: String(err) });
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
