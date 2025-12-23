import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnomalyDetection {
  id: string;
  anomaly_type: string;
  agency_id: string | null;
  details: Record<string, unknown>;
  severity: string;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

interface ActiveSession {
  id: string;
  user_id: string;
  agency_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  started_at: string;
  last_activity_at: string;
  is_active: boolean;
}

interface SecurityViolation {
  id: string;
  violation_type: string;
  user_id: string | null;
  attempted_agency_id: string | null;
  user_current_agency_id: string | null;
  table_name: string | null;
  function_name: string | null;
  details: Record<string, unknown>;
  severity: string;
  created_at: string;
}

export function useSecurityMonitoring() {
  const { permissions } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canAccess = permissions.canAdmin || permissions.isSuperAdmin;

  // Fetch anomalies (super admin vê todas, admin vê da agência)
  const { data: anomalies = [], isLoading: anomaliesLoading } = useQuery({
    queryKey: ['anomaly-detections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anomaly_detections')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AnomalyDetection[];
    },
    enabled: canAccess,
  });

  // Fetch active sessions
  const { data: activeSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as ActiveSession[];
    },
    enabled: canAccess,
  });

  // Fetch security violations
  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ['security-violations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt_security_violations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SecurityViolation[];
    },
    enabled: permissions.isSuperAdmin,
  });

  // Resolve anomaly
  const resolveAnomaly = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('anomaly_detections')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: notes,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomaly-detections'] });
      toast({
        title: 'Anomalia resolvida',
        description: 'A anomalia foi marcada como resolvida.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao resolver anomalia',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Force user logout
  const forceLogout = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { data, error } = await supabase
        .rpc('force_user_logout', { _user_id: userId, _reason: reason });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      toast({
        title: 'Logout forçado',
        description: `${count} sessão(ões) invalidada(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao forçar logout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get stats
  const unresolvedAnomalies = anomalies.filter(a => !a.resolved_at);
  const criticalViolations = violations.filter(v => v.severity === 'high' || v.severity === 'critical');

  return {
    anomalies,
    activeSessions,
    violations,
    unresolvedAnomalies,
    criticalViolations,
    isLoading: anomaliesLoading || sessionsLoading || violationsLoading,
    resolveAnomaly,
    forceLogout,
  };
}
