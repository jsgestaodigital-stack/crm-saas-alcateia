import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Monitor, Smartphone, Globe, Loader2, LogOut, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Session {
  id: string;
  session_token: string;
  user_agent: string | null;
  ip_address: any;
  last_activity_at: string | null;
  started_at: string | null;
  is_active: boolean | null;
}

function parseDevice(userAgent: string | null): { icon: typeof Monitor; label: string } {
  if (!userAgent) return { icon: Globe, label: "Desconhecido" };
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return { icon: Smartphone, label: "Celular" };
  }
  return { icon: Monitor, label: "Desktop" };
}

function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return "Navegador desconhecido";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Navegador";
}

export function ActiveSessionsCard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("active_sessions")
        .select("id, session_token, user_agent, ip_address, last_activity_at, started_at, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("last_activity_at", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
        return;
      }
      setSessions(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    try {
      const { error } = await supabase
        .from("active_sessions")
        .update({ is_active: false })
        .eq("id", sessionId);

      if (error) {
        toast.error("Erro ao encerrar sessão");
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Sessão encerrada com sucesso");
    } finally {
      setTerminatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sessões Ativas
        </CardTitle>
        <CardDescription>
          Dispositivos conectados à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma sessão ativa encontrada.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, idx) => {
              const device = parseDevice(session.user_agent);
              const DeviceIcon = device.icon;
              const browser = parseBrowser(session.user_agent);
              const isCurrent = idx === 0; // Most recent is likely current

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div className="rounded-full p-2 bg-muted">
                    <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{browser} • {device.label}</span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.last_activity_at
                        ? `Ativo ${formatDistanceToNow(new Date(session.last_activity_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}`
                        : "Sem atividade recente"}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => terminateSession(session.id)}
                      disabled={terminatingId === session.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {terminatingId === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
