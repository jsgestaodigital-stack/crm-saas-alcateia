import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface TeamMember {
  id: string;
  agency_id: string;
  user_id: string;
  member_role: string;
  created_at: string;
  full_name: string;
  avatar_url: string | null;
  status: string;
  last_login: string | null;
  app_role: AppRole | null;
  expires_at: string | null;
  role_notes: string | null;
  agency_name: string;
}

export function useTeamPermissions() {
  const { user, currentAgencyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user's role
  const { data: myRole, isLoading: isLoadingMyRole } = useQuery({
    queryKey: ["my-role", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return null;
      const { data, error } = await supabase.rpc("my_role");
      if (error) throw error;
      return data as AppRole | null;
    },
    enabled: !!user && !!currentAgencyId,
  });

  // Check if user can perform an action
  const checkPermission = async (permission: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("can", { _permission: permission });
      if (error) throw error;
      return data ?? false;
    } catch {
      return false;
    }
  };

  // Fetch team members
  const {
    data: members,
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["team-members", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];
      
      const { data, error } = await supabase
        .from("agency_members_with_roles")
        .select("*")
        .eq("agency_id", currentAgencyId);

      if (error) throw error;
      return (data || []) as TeamMember[];
    },
    enabled: !!user && !!currentAgencyId,
  });

  // Assign role mutation
  const assignRole = useMutation({
    mutationFn: async ({ targetUserId, newRole }: { targetUserId: string; newRole: AppRole }) => {
      const { data, error } = await supabase.rpc("assign_role", {
        _target_user_id: targetUserId,
        _role: newRole,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Role atualizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("agency_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Membro removido com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if current user can manage team
  const canManageTeam = myRole === "super_admin" || myRole === "owner" || myRole === "admin";
  const canAssignRoles = myRole === "super_admin" || myRole === "owner";

  return {
    myRole,
    members,
    isLoading: isLoadingMyRole || isLoadingMembers,
    checkPermission,
    assignRole,
    removeMember,
    refetchMembers,
    canManageTeam,
    canAssignRoles,
  };
}
