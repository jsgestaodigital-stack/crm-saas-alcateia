import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface GranularPermissions {
  can_sales: boolean;
  can_ops: boolean;
  can_admin: boolean;
  can_finance: boolean;
  can_recurring: boolean;
  is_super_admin: boolean;
  can_view_reports: boolean;
  can_edit_clients: boolean;
  can_delete_clients: boolean;
  can_view_leads: boolean;
  can_edit_leads: boolean;
  can_delete_leads: boolean;
  can_manage_team: boolean;
  can_manage_commissions: boolean;
  can_view_audit_logs: boolean;
  can_export_data: boolean;
  can_manage_settings: boolean;
}

export interface UserPermissionData {
  user_id: string;
  agency_id: string | null;
  role: AppRole | null;
  role_label: string;
  permissions: GranularPermissions;
}

export interface RoleTemplate {
  id: string;
  role: AppRole;
  description: string | null;
  can_sales: boolean;
  can_ops: boolean;
  can_admin: boolean;
  can_finance: boolean;
  can_recurring: boolean;
  can_view_reports: boolean;
  can_edit_clients: boolean;
  can_delete_clients: boolean;
  can_view_leads: boolean;
  can_edit_leads: boolean;
  can_delete_leads: boolean;
  can_manage_team: boolean;
  can_manage_commissions: boolean;
  can_view_audit_logs: boolean;
  can_export_data: boolean;
  can_manage_settings: boolean;
}

const defaultPermissions: GranularPermissions = {
  can_sales: false,
  can_ops: false,
  can_admin: false,
  can_finance: false,
  can_recurring: false,
  is_super_admin: false,
  can_view_reports: false,
  can_edit_clients: false,
  can_delete_clients: false,
  can_view_leads: false,
  can_edit_leads: false,
  can_delete_leads: false,
  can_manage_team: false,
  can_manage_commissions: false,
  can_view_audit_logs: false,
  can_export_data: false,
  can_manage_settings: false,
};

export const permissionLabels: Record<keyof GranularPermissions, string> = {
  can_sales: "Vendas",
  can_ops: "Operações",
  can_admin: "Administração",
  can_finance: "Financeiro",
  can_recurring: "Recorrência",
  is_super_admin: "Super Admin",
  can_view_reports: "Ver Relatórios",
  can_edit_clients: "Editar Clientes",
  can_delete_clients: "Excluir Clientes",
  can_view_leads: "Ver Leads",
  can_edit_leads: "Editar Leads",
  can_delete_leads: "Excluir Leads",
  can_manage_team: "Gerenciar Equipe",
  can_manage_commissions: "Gerenciar Comissões",
  can_view_audit_logs: "Ver Logs de Auditoria",
  can_export_data: "Exportar Dados",
  can_manage_settings: "Gerenciar Configurações",
};

export const permissionDescriptions: Record<keyof GranularPermissions, string> = {
  can_sales: "Acesso ao módulo de vendas e pipeline comercial",
  can_ops: "Acesso às operações e execução de tarefas",
  can_admin: "Permissões administrativas gerais",
  can_finance: "Acesso a dados financeiros e comissões",
  can_recurring: "Gerenciamento de clientes recorrentes",
  is_super_admin: "Acesso total ao sistema (todas as agências)",
  can_view_reports: "Visualizar relatórios e métricas",
  can_edit_clients: "Criar e editar informações de clientes",
  can_delete_clients: "Excluir clientes permanentemente",
  can_view_leads: "Visualizar leads e oportunidades",
  can_edit_leads: "Criar e editar leads",
  can_delete_leads: "Excluir leads permanentemente",
  can_manage_team: "Adicionar, remover e gerenciar membros da equipe",
  can_manage_commissions: "Configurar e aprovar comissões",
  can_view_audit_logs: "Visualizar histórico de ações",
  can_export_data: "Exportar dados em CSV/PDF",
  can_manage_settings: "Alterar configurações da agência",
};

export function usePermissions() {
  const { user, currentAgencyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user's full permissions
  const { data: myPermissions, isLoading: isLoadingPermissions, refetch: refetchPermissions } = useQuery({
    queryKey: ["my-permissions", user?.id, currentAgencyId],
    queryFn: async (): Promise<UserPermissionData> => {
      if (!user?.id) {
        return {
          user_id: "",
          agency_id: null,
          role: null,
          role_label: "Sem função",
          permissions: defaultPermissions,
        };
      }

      const { data, error } = await supabase.rpc("get_user_permissions", {
        _user_id: user.id,
        _agency_id: currentAgencyId,
      }) as { data: UserPermissionData | null; error: Error | null };

      if (error) {
        console.error("Error fetching permissions:", error);
        return {
          user_id: user.id,
          agency_id: currentAgencyId,
          role: null,
          role_label: "Erro",
          permissions: defaultPermissions,
        };
      }

      return data as UserPermissionData;
    },
    enabled: !!user?.id,
  });

  // Fetch role templates
  const { data: roleTemplates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["role-templates"],
    queryFn: async (): Promise<RoleTemplate[]> => {
      const { data, error } = await supabase
        .from("role_permission_templates")
        .select("*")
        .order("role");

      if (error) {
        console.error("Error fetching role templates:", error);
        return [];
      }

      return data as RoleTemplate[];
    },
    enabled: !!user?.id,
  });

  // Check if user has a specific permission
  const hasPermission = (permission: keyof GranularPermissions): boolean => {
    if (!myPermissions) return false;
    
    // Super admin, owner, and admin have all permissions
    if (
      myPermissions.permissions.is_super_admin ||
      myPermissions.role === "owner" ||
      myPermissions.role === "admin"
    ) {
      return true;
    }

    return myPermissions.permissions[permission] ?? false;
  };

  // Check permission via RPC (for critical operations)
  const checkPermission = async (permission: string): Promise<boolean> => {
    if (!user?.id || !currentAgencyId) return false;

    try {
      const { data, error } = await supabase.rpc("is_allowed", {
        _user_id: user.id,
        _agency_id: currentAgencyId,
        _permission: permission,
      });

      if (error) throw error;
      return data ?? false;
    } catch {
      return false;
    }
  };

  // Update member role
  const updateMemberRole = useMutation({
    mutationFn: async ({ targetUserId, newRole }: { targetUserId: string; newRole: AppRole }) => {
      const { data, error } = await supabase.rpc("update_member_role", {
        _target_user_id: targetUserId,
        _new_role: newRole,
        _agency_id: currentAgencyId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Erro ao atualizar função");
      }

      return result;
    },
    onSuccess: () => {
      toast({ title: "Função atualizada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["my-permissions"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar função",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update role template (super admin only)
  const updateRoleTemplate = useMutation({
    mutationFn: async ({ role, permissions }: { role: AppRole; permissions: Partial<GranularPermissions> }) => {
      const { data, error } = await supabase.rpc("update_role_template", {
        _role: role,
        _permissions: permissions,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Erro ao atualizar template");
      }

      return result;
    },
    onSuccess: () => {
      toast({ title: "Template atualizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["role-templates"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convenience permission checks
  const canViewReports = hasPermission("can_view_reports");
  const canEditClients = hasPermission("can_edit_clients");
  const canDeleteClients = hasPermission("can_delete_clients");
  const canViewLeads = hasPermission("can_view_leads");
  const canEditLeads = hasPermission("can_edit_leads");
  const canDeleteLeads = hasPermission("can_delete_leads");
  const canManageTeam = hasPermission("can_manage_team");
  const canManageCommissions = hasPermission("can_manage_commissions");
  const canViewAuditLogs = hasPermission("can_view_audit_logs");
  const canExportData = hasPermission("can_export_data");
  const canManageSettings = hasPermission("can_manage_settings");
  const isSuperAdmin = myPermissions?.permissions.is_super_admin ?? false;
  const isOwnerOrAdmin = myPermissions?.role === "owner" || myPermissions?.role === "admin";

  return {
    myPermissions,
    roleTemplates,
    isLoading: isLoadingPermissions || isLoadingTemplates,
    hasPermission,
    checkPermission,
    updateMemberRole,
    updateRoleTemplate,
    refetchPermissions,
    // Convenience flags
    canViewReports,
    canEditClients,
    canDeleteClients,
    canViewLeads,
    canEditLeads,
    canDeleteLeads,
    canManageTeam,
    canManageCommissions,
    canViewAuditLogs,
    canExportData,
    canManageSettings,
    isSuperAdmin,
    isOwnerOrAdmin,
  };
}
