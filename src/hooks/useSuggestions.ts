import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_name: string;
  target_level: 'admin' | 'super_admin';
  status: 'new' | 'read' | 'archived';
  created_at: string;
  updated_at: string;
  read_at: string | null;
  archived_at: string | null;
}

export function useSuggestions() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's isSuperAdmin status
  const { data: isSuperAdmin = false } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_permissions")
        .select("is_super_admin")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking super admin status:", error);
        return false;
      }
      return data?.is_super_admin ?? false;
    },
    enabled: !!user,
  });

  // Determine user role for the suggestion system
  const getUserRole = (): 'super_admin' | 'admin' | 'collaborator' => {
    if (isSuperAdmin) return 'super_admin';
    if (isAdmin) return 'admin';
    return 'collaborator';
  };

  // Determine target level based on user role
  const getTargetLevel = (): 'admin' | 'super_admin' => {
    const role = getUserRole();
    if (role === 'admin') return 'super_admin'; // Admins send to super_admin
    return 'admin'; // Collaborators send to admin
  };

  // Fetch suggestions sent by the current user
  const { data: sentSuggestions = [], isLoading: loadingSent } = useQuery({
    queryKey: ["suggestions", "sent", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sent suggestions:", error);
        throw error;
      }
      return data as Suggestion[];
    },
    enabled: !!user,
  });

  // Fetch suggestions received (only for admins and super admins)
  const { data: receivedSuggestions = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["suggestions", "received", user?.id, isAdmin, isSuperAdmin],
    queryFn: async () => {
      if (!user) return [];
      
      // Only admins and super admins can receive suggestions
      if (!isAdmin && !isSuperAdmin) return [];

      // The RLS policies handle the filtering:
      // - Admins see suggestions with target_level = 'admin'
      // - Super admins see suggestions with target_level = 'super_admin'
      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .neq("author_id", user.id) // Don't show own suggestions in received
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching received suggestions:", error);
        throw error;
      }
      return data as Suggestion[];
    },
    enabled: !!user && (isAdmin || isSuperAdmin),
  });

  // Create a new suggestion
  const createMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const targetLevel = getTargetLevel();

      const { data, error } = await supabase
        .from("suggestions")
        .insert({
          title,
          description,
          author_id: user.id,
          author_name: profile?.full_name || user.email || "Usuário",
          target_level: targetLevel,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Sugestão enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (error) => {
      console.error("Error creating suggestion:", error);
      toast.error("Erro ao enviar sugestão");
    },
  });

  // Mark suggestion as read
  const markAsReadMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from("suggestions")
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq("id", suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (error) => {
      console.error("Error marking suggestion as read:", error);
      toast.error("Erro ao marcar como lida");
    },
  });

  // Archive suggestion
  const archiveMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from("suggestions")
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq("id", suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sugestão arquivada");
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (error) => {
      console.error("Error archiving suggestion:", error);
      toast.error("Erro ao arquivar sugestão");
    },
  });

  // Stats
  const newCount = receivedSuggestions.filter(s => s.status === 'new').length;
  const userRole = getUserRole();
  const canReceiveSuggestions = isAdmin || isSuperAdmin;
  const canSendToSuperAdmin = isAdmin && !isSuperAdmin;

  return {
    sentSuggestions,
    receivedSuggestions,
    isLoading: loadingSent || loadingReceived,
    createSuggestion: createMutation.mutate,
    isCreating: createMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    archive: archiveMutation.mutate,
    newCount,
    userRole,
    isSuperAdmin,
    canReceiveSuggestions,
    canSendToSuperAdmin,
    getTargetLevel,
  };
}
