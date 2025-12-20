import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityAlert {
  id: string;
  agency_id: string | null;
  user_id: string | null;
  event_type: string;
  severity: string;
  details: Record<string, unknown> | null;
  resolved_at: string | null;
  resolved_by: string | null;
  detected_at: string;
}

export function useSecurityAlerts() {
  const { user, currentAgencyId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch security alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['security-alerts', currentAgencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      return data as SecurityAlert[];
    },
    enabled: !!user?.id,
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
    },
  });

  // Get unresolved alerts count
  const unresolvedCount = alerts?.filter(a => !a.resolved_at).length ?? 0;

  // Get alerts by severity
  const criticalAlerts = alerts?.filter(a => a.severity === 'high' && !a.resolved_at) ?? [];
  const mediumAlerts = alerts?.filter(a => a.severity === 'medium' && !a.resolved_at) ?? [];

  return {
    alerts: alerts ?? [],
    isLoading,
    unresolvedCount,
    criticalAlerts,
    mediumAlerts,
    resolveAlert: resolveAlertMutation.mutateAsync,
    isResolving: resolveAlertMutation.isPending,
  };
}
