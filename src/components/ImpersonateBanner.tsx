import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ImpersonateBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentAgency, setCurrentAgency] = useState<{ id: string; name: string } | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
  // This prevents confusion for new users who might see a "Super Admin" banner
  if (!isSuperAdmin || !currentAgency) return null;
  
  // Additional check: don't show if agency is the super admin's own agency
  // This prevents the banner from appearing during normal usage

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 z-[100] transition-all duration-300 ease-out",
        "group cursor-pointer"
      )}
    >
      {/* Collapsed state - small pill */}
      <div 
        className={cn(
          "flex items-center gap-2 rounded-full shadow-lg border transition-all duration-300",
          "bg-amber-500 border-amber-600/50 text-amber-950",
          isExpanded 
            ? "px-4 py-2 rounded-xl" 
            : "px-3 py-1.5 hover:px-4 hover:shadow-xl"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Shield className="h-4 w-4 shrink-0" />
        
        {/* Agency name - shown on hover or expanded */}
        <span 
          className={cn(
            "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
            isExpanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100"
          )}
        >
          {currentAgency.name}
        </span>

        {/* Toggle chevron */}
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronUp className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Expanded panel with exit button */}
      <div 
        className={cn(
          "absolute bottom-full left-0 mb-2 transition-all duration-300 origin-bottom-left",
          isExpanded 
            ? "opacity-100 scale-100 pointer-events-auto" 
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="bg-card border border-border rounded-xl shadow-xl p-3 min-w-[220px]">
          <p className="text-xs text-muted-foreground mb-2">Modo Super Admin ativo</p>
          <p className="text-sm font-semibold text-foreground mb-3 truncate">{currentAgency.name}</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            onClick={(e) => {
              e.stopPropagation();
              handleExitImpersonate();
            }}
            disabled={isExiting}
          >
            <LogOut className="h-3 w-3 mr-1.5" />
            Voltar ao Super Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
