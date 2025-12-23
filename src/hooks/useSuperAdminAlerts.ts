import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SuperAdminAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  details: Record<string, unknown> | null;
  agency_id: string | null;
  is_read: boolean;
  read_by: string | null;
  read_at: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface AuditRun {
  id: string;
  run_type: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  agencies_checked: number;
  issues_found: number;
  issues_repaired: number;
  summary: Record<string, unknown> | null;
}

interface SecurityViolation {
  id: string;
  violation_type: string;
  user_id: string | null;
  attempted_agency_id: string | null;
  user_current_agency_id: string | null;
  table_name: string | null;
  function_name: string | null;
  details: Record<string, unknown> | null;
  severity: string;
  created_at: string;
}

export function useSuperAdminAlerts() {
  const { user, permissions } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = permissions.isSuperAdmin;

  // Fetch super admin alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['super-admin-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching super admin alerts:', error);
        return [];
      }

      return data as SuperAdminAlert[];
    },
    enabled: !!user?.id && isSuperAdmin,
  });

  // Fetch latest audit runs
  const { data: auditRuns, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_audit_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching audit runs:', error);
        return [];
      }

      return data as AuditRun[];
    },
    enabled: !!user?.id && isSuperAdmin,
  });

  // Fetch security violations
  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ['security-violations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mt_security_violations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching security violations:', error);
        return [];
      }

      return data as SecurityViolation[];
    },
    enabled: !!user?.id && isSuperAdmin,
  });

  // Mark alert as read
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('super_admin_alerts')
        .update({
          is_read: true,
          read_by: user?.id,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-alerts'] });
    },
  });

  // Resolve alert
  const resolveAlertMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      const { error } = await supabase
        .from('super_admin_alerts')
        .update({
          is_resolved: true,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null,
          is_read: true,
          read_by: user?.id,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-alerts'] });
    },
  });

  // Trigger manual audit
  const triggerAuditMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-audit');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-runs'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['security-violations'] });
    },
  });

  // Stats
  const unreadCount = alerts?.filter(a => !a.is_read).length ?? 0;
  const unresolvedCount = alerts?.filter(a => !a.is_resolved).length ?? 0;
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical' && !a.is_resolved) ?? [];
  const latestAudit = auditRuns?.[0];

  return {
    // Alerts
    alerts: alerts ?? [],
    alertsLoading,
    unreadCount,
    unresolvedCount,
    criticalAlerts,
    markAsRead: markAsReadMutation.mutateAsync,
    resolveAlert: resolveAlertMutation.mutateAsync,
    isResolving: resolveAlertMutation.isPending,
    
    // Audit runs
    auditRuns: auditRuns ?? [],
    auditLoading,
    latestAudit,
    triggerAudit: triggerAuditMutation.mutateAsync,
    isAuditing: triggerAuditMutation.isPending,
    
    // Violations
    violations: violations ?? [],
    violationsLoading,
    
    // Combined loading
    isLoading: alertsLoading || auditLoading || violationsLoading,
  };
}