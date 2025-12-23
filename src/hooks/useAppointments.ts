import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFunnelMode, FunnelMode } from "@/contexts/FunnelModeContext";
import { useEffect } from "react";

export interface Appointment {
  id: string;
  agency_id: string;
  user_id: string;
  title: string;
  date: string;
  time: string;
  funnel_type: FunnelMode;
  client_id: string | null;
  lead_id: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateAppointmentInput {
  title: string;
  date: string;
  time: string;
  funnel_type: FunnelMode;
  client_id?: string | null;
  lead_id?: string | null;
  notes?: string | null;
}

interface UpdateAppointmentInput {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  completed?: boolean;
  notes?: string | null;
}

interface UseAppointmentsOptions {
  funnelFilter?: FunnelMode | "all";
  userFilter?: string | "all"; // For managers to filter by team member
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { user, currentAgencyId, derived } = useAuth();
  const queryClient = useQueryClient();
  
  const { funnelFilter = "all", userFilter = "all" } = options;
  
  const isManager = derived?.canAdminOrIsAdmin ?? false;

  // Fetch appointments
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["appointments", currentAgencyId, funnelFilter, userFilter],
    queryFn: async () => {
      if (!currentAgencyId || !user) return [];
      
      let query = supabase
        .from("appointments")
        .select("*")
        .eq("agency_id", currentAgencyId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      
      // Filter by funnel if specified
      if (funnelFilter !== "all") {
        query = query.eq("funnel_type", funnelFilter);
      }
      
      // Filter by user if specified (only managers can filter by other users)
      if (userFilter !== "all" && isManager) {
        query = query.eq("user_id", userFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
      
      return data as Appointment[];
    },
    enabled: !!currentAgencyId && !!user,
  });

  // Fetch team members for manager dropdown
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId || !isManager) return [];
      
      const { data, error } = await supabase
        .from("agency_members")
        .select(`
          user_id,
          profiles!inner(id, full_name)
        `)
        .eq("agency_id", currentAgencyId);
      
      if (error) {
        console.error("Error fetching team members:", error);
        return [];
      }
      
      return data.map((member: any) => ({
        id: member.user_id,
        name: member.profiles?.full_name || "Usuário",
      }));
    },
    enabled: !!currentAgencyId && isManager,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentAgencyId) return;

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `agency_id=eq.${currentAgencyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAgencyId, queryClient]);

  // Create appointment
  const createMutation = useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      if (!user || !currentAgencyId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          agency_id: currentAgencyId,
          user_id: user.id,
          title: input.title,
          date: input.date,
          time: input.time,
          funnel_type: input.funnel_type,
          client_id: input.client_id || null,
          lead_id: input.lead_id || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  // Update appointment
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateAppointmentInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  // Delete appointment
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  // Toggle completed status
  const toggleCompleted = async (id: string, currentCompleted: boolean) => {
    await updateMutation.mutateAsync({ id, completed: !currentCompleted });
  };

  return {
    appointments,
    isLoading,
    refetch,
    teamMembers,
    isManager,
    currentUserId: user?.id,
    createAppointment: createMutation.mutateAsync,
    updateAppointment: updateMutation.mutateAsync,
    deleteAppointment: deleteMutation.mutateAsync,
    toggleCompleted,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
