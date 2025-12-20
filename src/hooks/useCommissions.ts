import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type PaymentStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface Commission {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  client_name: string;
  sale_value: number | null;
  recipient_type: string;
  recipient_role_id: string | null;
  recipient_name: string;
  recipient_id: string | null;
  description: string;
  amount: number;
  status: PaymentStatus;
  delivered_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionRole {
  id: string;
  label: string;
  active: boolean;
  sort_order: number;
}

interface UseCommissionsOptions {
  filterByUser?: boolean; // If true, only show commissions for current user
}

export function useCommissions(options: UseCommissionsOptions = {}) {
  const { filterByUser = false } = options;
  const { user, derived } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [roles, setRoles] = useState<CommissionRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  const isAdmin = derived?.canFinanceOrAdmin ?? false;
  const userName = user?.user_metadata?.full_name || user?.email || '';

  // Fetch commission roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('commission_roles')
          .select('*')
          .eq('active', true)
          .order('sort_order');

        if (error) throw error;
        setRoles((data as CommissionRole[]) || []);
      } catch (error) {
        console.error('Error fetching commission roles:', error);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Fetch commissions
  const fetchCommissions = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("commissions_v2" as any)
        .select("*")
        .order("created_at", { ascending: false });

      // If filtering by user (collaborator view), only show their commissions
      if (filterByUser && !isAdmin) {
        query = query.eq("recipient_name", userName);
      }

      const { data, error } = await (query as any);

      if (error) throw error;
      setCommissions((data as Commission[]) || []);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }, [user, filterByUser, isAdmin, userName]);

  useEffect(() => {
    fetchCommissions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('commissions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commissions_v2' },
        () => fetchCommissions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCommissions]);

  // Helper functions
  const getRoleById = useCallback((id: string | null): CommissionRole | undefined => {
    return roles.find(r => r.id === id);
  }, [roles]);

  const getRoleByLabel = useCallback((label: string): CommissionRole | undefined => {
    return roles.find(r => r.label.toLowerCase() === label.toLowerCase());
  }, [roles]);

  const getCommissionRoleLabel = useCallback((commission: Commission): string => {
    if (commission.recipient_role_id) {
      const role = getRoleById(commission.recipient_role_id);
      if (role) return role.label;
    }
    return commission.recipient_type.charAt(0).toUpperCase() + commission.recipient_type.slice(1);
  }, [getRoleById]);

  // Actions (admin only)
  const approveCommission = async (commissionId: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await (supabase
        .from("commissions_v2" as any)
        .update({ 
          status: "approved" as const, 
          approved_at: new Date().toISOString() 
        })
        .eq("id", commissionId) as any);

      if (error) throw error;
      toast.success("Comissão aprovada!");
      return true;
    } catch (error) {
      console.error("Error approving commission:", error);
      toast.error("Erro ao aprovar comissão");
      return false;
    }
  };

  const markAsPaid = async (commissionId: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await (supabase
        .from("commissions_v2" as any)
        .update({ 
          status: "paid" as const, 
          paid_at: new Date().toISOString() 
        })
        .eq("id", commissionId) as any);

      if (error) throw error;
      toast.success("Comissão paga!");
      return true;
    } catch (error) {
      console.error("Error marking commission as paid:", error);
      toast.error("Erro ao marcar como paga");
      return false;
    }
  };

  const cancelCommission = async (commissionId: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await (supabase
        .from("commissions_v2" as any)
        .update({ status: "cancelled" as const })
        .eq("id", commissionId) as any);

      if (error) throw error;
      toast.success("Comissão cancelada");
      return true;
    } catch (error) {
      console.error("Error cancelling commission:", error);
      toast.error("Erro ao cancelar comissão");
      return false;
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    const active = commissions.filter(c => c.status !== 'cancelled');
    
    const totalPending = active
      .filter(c => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalPaid = active
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const now = new Date();
    const thisMonthTotal = active
      .filter(c => {
        const date = new Date(c.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthTotal = active
      .filter(c => {
        const date = new Date(c.created_at);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const monthlyChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    return {
      totalPending,
      totalPaid,
      totalGenerated: totalPending + totalPaid,
      thisMonthTotal,
      lastMonthTotal,
      monthlyChange,
      count: {
        pending: active.filter(c => c.status === 'pending').length,
        approved: active.filter(c => c.status === 'approved').length,
        paid: active.filter(c => c.status === 'paid').length,
        total: active.length,
      }
    };
  }, [commissions]);

  return {
    commissions,
    roles,
    loading: loading || rolesLoading,
    isAdmin,
    stats,
    getRoleById,
    getRoleByLabel,
    getCommissionRoleLabel,
    approveCommission,
    markAsPaid,
    cancelCommission,
    refetch: fetchCommissions,
  };
}

// Helper function to create commission automatically (for external use)
export async function createAutoCommission(params: {
  leadId?: string;
  clientId?: string;
  clientName: string;
  saleValue: number;
  recipientName: string;
  recipientRoleLabel: string;
  amount: number;
  description: string;
  userId: string;
}) {
  const { leadId, clientId, clientName, saleValue, recipientName, recipientRoleLabel, amount, description, userId } = params;

  try {
    // Get role ID
    const { data: roleData } = await supabase
      .from('commission_roles')
      .select('id')
      .ilike('label', recipientRoleLabel)
      .maybeSingle();

    // Check for existing commission to prevent duplicates
    const checkQuery = supabase
      .from("commissions_v2" as any)
      .select("id");

    if (leadId) {
      (checkQuery as any).eq("lead_id", leadId);
    } else if (clientId) {
      (checkQuery as any).eq("client_id", clientId);
    }

    if (roleData?.id) {
      (checkQuery as any).eq("recipient_role_id", roleData.id);
    }

    const { data: existing } = await (checkQuery.maybeSingle() as any);

    if (existing) {
      console.log("Commission already exists, skipping creation");
      return null;
    }

    const { data, error } = await (supabase.from("commissions_v2" as any).insert({
      lead_id: leadId || null,
      client_id: clientId || null,
      client_name: clientName,
      sale_value: saleValue,
      recipient_role_id: roleData?.id || null,
      recipient_type: recipientRoleLabel.toLowerCase(),
      recipient_name: recipientName,
      description,
      amount,
      status: 'pending',
      delivered_at: new Date().toISOString(),
      created_by: userId,
    }).select().single() as any);

    if (error) throw error;

    toast.success(`Comissão de R$ ${amount.toLocaleString("pt-BR")} registrada automaticamente`, {
      description: `${recipientName} receberá quando o pagamento for confirmado`,
    });

    return data;
  } catch (error) {
    console.error("Error creating auto commission:", error);
    return null;
  }
}
