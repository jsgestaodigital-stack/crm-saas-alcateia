import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HealthSummary {
  unresolved_count: number;
  critical_count: number;
  error_count: number;
  last_24h_count: number;
  last_hour_count: number;
  last_error_at: string | null;
}

interface HealthLog {
  id: string;
  agency_id: string | null;
  user_id: string | null;
  user_email: string | null;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  component: string | null;
  route: string | null;
  browser: string | null;
  device: string | null;
  metadata: Record<string, unknown>;
  severity: 'info' | 'warn' | 'error' | 'critical';
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useSystemHealth() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch health summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['system-health-summary'],
    queryFn: async (): Promise<HealthSummary> => {
      const { data, error } = await supabase.rpc('get_health_summary');
      
      if (error) {
        console.error('Error fetching health summary:', error);
        return {
          unresolved_count: 0,
          critical_count: 0,
          error_count: 0,
          last_24h_count: 0,
          last_hour_count: 0,
          last_error_at: null,
        };
      }
      
      // RPC returns an array, get first item
      const result = Array.isArray(data) ? data[0] : data;
      return result || {
        unresolved_count: 0,
        critical_count: 0,
        error_count: 0,
        last_24h_count: 0,
        last_hour_count: 0,
        last_error_at: null,
      };
    },
    enabled: !!user && isAdmin,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Fetch recent logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['system-health-logs'],
    queryFn: async (): Promise<HealthLog[]> => {
      const { data, error } = await supabase
        .from('system_health_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching health logs:', error);
        return [];
      }
      
      return (data || []) as HealthLog[];
    },
    enabled: !!user && isAdmin,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Resolve error mutation
  const resolveMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('system_health_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', logId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-health-summary'] });
      queryClient.invalidateQueries({ queryKey: ['system-health-logs'] });
    },
  });

  // Resolve all errors mutation
  const resolveAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('system_health_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('resolved', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-health-summary'] });
      queryClient.invalidateQueries({ queryKey: ['system-health-logs'] });
    },
  });

  // Calculate health score (0-100)
  const healthScore = summary ? Math.max(0, 100 - (summary.critical_count * 20) - (summary.error_count * 5) - (summary.last_hour_count * 2)) : 100;

  return {
    summary,
    logs,
    healthScore,
    isLoading: summaryLoading || logsLoading,
    resolveError: resolveMutation.mutate,
    resolveAllErrors: resolveAllMutation.mutate,
    isResolving: resolveMutation.isPending || resolveAllMutation.isPending,
  };
}
