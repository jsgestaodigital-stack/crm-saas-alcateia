import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImpersonateBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentAgency, setCurrentAgency] = useState<{ id: string; name: string } | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      // Check if super admin
      const { data: permissions } = await supabase
        .from("user_permissions")
        .select("is_super_admin")
        .eq("user_id", user.id)
        .single();

      if (permissions?.is_super_admin) {
        setIsSuperAdmin(true);

        // Check if currently in impersonate mode (has current_agency_id set)
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_agency_id")
          .eq("id", user.id)
          .single();

        if (profile?.current_agency_id) {
          // Get agency name
          const { data: agency } = await supabase
            .from("agencies")
            .select("id, name")
            .eq("id", profile.current_agency_id)
            .single();

          if (agency) {
            setCurrentAgency(agency);
          }
        }
      }
    };

    checkStatus();
  }, [user]);

  const handleExitImpersonate = async () => {
    setIsExiting(true);
    try {
      const { error } = await supabase.rpc("exit_impersonate");
      if (error) throw error;
      toast({ title: "Modo impersonate desativado" });
      window.location.href = "/super-admin";
    } catch (error) {
      toast({ 
        title: "Erro ao sair do modo impersonate", 
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive" 
      });
      setIsExiting(false);
    }
  };

  // Only show if super admin AND in impersonate mode
  if (!isSuperAdmin || !currentAgency) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the banner */}
      <div className="h-12 sm:h-10" />
      <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium shadow-lg">
        <div className="flex items-center gap-2 text-center">
          <Shield className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Modo Super Admin ativo como:</span>
          <span className="sm:hidden">Super Admin:</span>
          <span className="font-bold truncate max-w-[120px] sm:max-w-none">{currentAgency.name}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-white/20 border-amber-700/30 text-amber-950 hover:bg-white/30 text-xs sm:text-sm h-7 sm:h-8"
          onClick={handleExitImpersonate}
          disabled={isExiting}
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Voltar ao Super Admin</span>
          <span className="sm:hidden">Sair</span>
        </Button>
      </div>
    </>
  );
}
