import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PendingRegistration {
  id: string;
  agency_name: string;
  agency_slug: string;
  owner_email: string;
  owner_name: string;
  owner_phone: string | null;
  status: string;
  created_at: string;
  is_alcateia?: boolean;
  source?: string;
}

export function usePendingRegistrations() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_pending_registrations");
      
      if (error) throw error;
      
      setRegistrations(data || []);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setIsLoading(false);
    }
  };

  const approveRegistration = async (registrationId: string, tempPassword?: string) => {
    try {
      const { data, error } = await supabase.rpc("approve_registration", {
        _registration_id: registrationId,
        _temp_password: tempPassword || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; agency_id: string; owner_email: string; temp_password: string };

      // Criar/vincular usuário via backend function
      const { data: createData, error: createError } = await supabase.functions.invoke(
        "create-agency-owner",
        {
          body: {
            agencyId: result.agency_id,
            email: result.owner_email,
            password: result.temp_password,
            registrationId,
          },
        }
      );

      if (createError) {
        console.error("Error creating owner:", createError);
        toast.warning("Agência aprovada, mas erro ao configurar o usuário. Verifique no admin.");
      } else {
        const payload = createData as
          | { userCreated?: boolean; password?: string }
          | null
          | undefined;

        if (payload?.userCreated && payload?.password) {
          toast.success(`Agência aprovada! Senha temporária: ${payload.password}`);
        } else {
          toast.success(
            "Agência aprovada! O usuário já tinha conta — ele deve entrar com a senha que criou (ou usar 'Esqueceu sua senha')."
          );
        }
      }

      await fetchRegistrations();
      return result;
    } catch (error: any) {
      console.error("Error approving registration:", error);
      toast.error(error.message || "Erro ao aprovar solicitação");
      throw error;
    }
  };

  const rejectRegistration = async (registrationId: string, reason: string) => {
    try {
      const { error } = await supabase.rpc("reject_registration", {
        _registration_id: registrationId,
        _reason: reason,
      });

      if (error) throw error;

      toast.success("Solicitação rejeitada");
      await fetchRegistrations();
    } catch (error: any) {
      console.error("Error rejecting registration:", error);
      toast.error(error.message || "Erro ao rejeitar solicitação");
      throw error;
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  return {
    registrations,
    isLoading,
    fetchRegistrations,
    approveRegistration,
    rejectRegistration,
  };
}
