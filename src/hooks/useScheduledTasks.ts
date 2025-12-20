import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];

export interface ScheduledTask {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  agency_id: string;
  user_id: string | null;
  user_name: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  completed_at: string | null;
  completed_by: string | null;
  completed_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  leadId?: string;
  clientId?: string;
}

export function useScheduledTasks(filters: TaskFilters = {}) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';

  const fetchTasks = useCallback(async () => {
    try {
      let query = supabase
        .from('scheduled_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (filters.leadId) {
        query = query.eq('lead_id', filters.leadId);
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks((data as unknown as ScheduledTask[]) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, [filters.leadId, filters.clientId, filters.status, filters.priority]);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('scheduled-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scheduled_tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const createTask = async (taskData: {
    title: string;
    description?: string;
    due_date: string;
    priority?: TaskPriority;
    lead_id?: string;
    client_id?: string;
  }) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || null,
          due_date: taskData.due_date,
          priority: taskData.priority || 'medium',
          lead_id: taskData.lead_id || null,
          client_id: taskData.client_id || null,
          user_id: user.id,
          user_name: userName,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Tarefa criada!');
      return data as unknown as ScheduledTask;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
      return null;
    }
  };

  const completeTask = async (taskId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }

    try {
      // Use the RPC function
      const { error } = await supabase.rpc('complete_task', { p_task_id: taskId });

      if (error) throw error;
      toast.success('Tarefa concluída!');
      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Erro ao concluir tarefa');
      return false;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<ScheduledTask>) => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Tarefa atualizada');
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Tarefa excluída');
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao excluir tarefa');
      return false;
    }
  };

  return {
    tasks,
    loading,
    createTask,
    completeTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}

export function useLeadTaskSuggestions(leadId: string | null) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    if (!leadId) {
      setSuggestion(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('suggest_next_task', {
        p_lead_id: leadId,
      });

      if (rpcError) throw rpcError;
      setSuggestion(data as string);
    } catch (err) {
      console.error('Error fetching task suggestion:', err);
      setError('Erro ao buscar sugestão');
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  return {
    suggestion,
    loading,
    error,
    fetchSuggestion,
    reset: () => setSuggestion(null),
  };
}

// Priority and status configurations
export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; emoji: string }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400', emoji: '⏳' },
  completed: { label: 'Concluída', color: 'bg-green-500/20 text-green-400', emoji: '✅' },
  overdue: { label: 'Atrasada', color: 'bg-red-500/20 text-red-400', emoji: '⚠️' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-500/20 text-gray-400', emoji: '❌' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; emoji: string }> = {
  low: { label: 'Baixa', color: 'bg-slate-500/20 text-slate-400', emoji: '🔵' },
  medium: { label: 'Média', color: 'bg-amber-500/20 text-amber-400', emoji: '🟡' },
  high: { label: 'Alta', color: 'bg-orange-500/20 text-orange-400', emoji: '🟠' },
  urgent: { label: 'Urgente', color: 'bg-red-500/20 text-red-400', emoji: '🔴' },
};
