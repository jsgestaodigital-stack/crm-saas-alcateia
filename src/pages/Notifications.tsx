import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Shield,
  RefreshCw,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SecurityAlert {
  id: string;
  event_type: string;
  severity: string;
  details: Record<string, unknown> | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

const eventLabels: Record<string, { label: string; icon: React.ElementType }> = {
  suspicious_login: { label: "Login Suspeito", icon: AlertTriangle },
  limit_abuse: { label: "Tentativa de Abuso", icon: XCircle },
  password_changed: { label: "Senha Alterada", icon: Shield },
  new_device: { label: "Novo Dispositivo", icon: Info },
  multiple_failed_logins: { label: "Falhas de Login", icon: AlertTriangle },
};

const severityColors: Record<string, string> = {
  low: "bg-status-info/20 text-status-info",
  medium: "bg-warning/20 text-warning",
  high: "bg-status-danger/20 text-status-danger",
  critical: "bg-destructive text-destructive-foreground",
};

export default function Notifications() {
  const { user, isLoading: authLoading, derived } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchAlerts();
    }
  }, [user, authLoading, navigate]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("security_alerts")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAlerts((data as SecurityAlert[]) || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      toast.error("Erro ao carregar alertas");
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("security_alerts")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alerta resolvido");
      fetchAlerts();
    } catch (err) {
      console.error("Error resolving alert:", err);
      toast.error("Erro ao resolver alerta");
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "pending") return !alert.resolved_at;
    if (activeTab === "resolved") return !!alert.resolved_at;
    return true;
  });

  const pendingCount = alerts.filter((a) => !a.resolved_at).length;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Alertas de segurança e notificações do sistema
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAlerts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              Todos ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolvidos ({alerts.length - pendingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-status-success mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === "pending"
                      ? "Nenhum alerta pendente"
                      : "Nenhuma notificação encontrada"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => {
                const eventInfo = eventLabels[alert.event_type] || {
                  label: alert.event_type,
                  icon: Info,
                };
                const Icon = eventInfo.icon;

                return (
                  <Card
                    key={alert.id}
                    className={cn(
                      "transition-all",
                      !alert.resolved_at && "border-l-4 border-l-warning"
                    )}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              severityColors[alert.severity] || "bg-muted"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{eventInfo.label}</h4>
                              <Badge
                                variant="outline"
                                className={cn("text-xs", severityColors[alert.severity])}
                              >
                                {alert.severity}
                              </Badge>
                              {alert.resolved_at && (
                                <Badge variant="secondary" className="text-xs">
                                  Resolvido
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(alert.detected_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                            {alert.details && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {JSON.stringify(alert.details)}
                              </p>
                            )}
                          </div>
                        </div>
                        {!alert.resolved_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
