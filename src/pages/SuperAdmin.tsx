import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  Target, 
  CheckCircle, 
  Clock, 
  XCircle, 
  LogIn, 
  Shield,
  Activity,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    agencies,
    auditLogs,
    stats,
    isLoadingAgencies,
    isLoadingLogs,
    refetchAgencies,
    refetchLogs,
    approveAgency,
    suspendAgency,
    reactivateAgency,
    impersonateAgency,
  } = useSuperAdmin();

  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!isAuthLoading && !user) {
        navigate("/auth");
        return;
      }

      if (user) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("user_permissions")
          .select("is_super_admin")
          .eq("user_id", user.id)
          .single();

        if (!data?.is_super_admin) {
          navigate("/dashboard");
        }
      }
    };

    checkSuperAdmin();
  }, [user, isAuthLoading, navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativa</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendente</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Suspensa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      approve_agency: "Aprovou agência",
      suspend_agency: "Suspendeu agência",
      reactivate_agency: "Reativou agência",
      impersonate_agency: "Entrou como agência",
      exit_impersonate: "Saiu do modo impersonate",
    };
    return labels[action] || action;
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Super Admin</h1>
                <p className="text-sm text-muted-foreground">Controle global de agências</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                refetchAgencies();
                refetchLogs();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Agências</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.suspended}</p>
                  <p className="text-xs text-muted-foreground">Suspensas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="agencies" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="agencies">Agências</TabsTrigger>
            <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="agencies" className="space-y-4">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Todas as Agências
                </CardTitle>
                <CardDescription>
                  Gerencie todas as agências da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAgencies ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agência</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Membros</TableHead>
                        <TableHead className="text-center">Clientes</TableHead>
                        <TableHead className="text-center">Leads</TableHead>
                        <TableHead>Criada em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencies?.map((agency) => (
                        <TableRow key={agency.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{agency.name}</p>
                              <p className="text-xs text-muted-foreground">/{agency.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(agency.status)}</TableCell>
                          <TableCell className="text-center">{agency.members_count}</TableCell>
                          <TableCell className="text-center">{agency.clients_count}</TableCell>
                          <TableCell className="text-center">{agency.leads_count}</TableCell>
                          <TableCell>
                            {format(new Date(agency.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {agency.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                  onClick={() => approveAgency.mutate(agency.id)}
                                  disabled={approveAgency.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovar
                                </Button>
                              )}
                              {agency.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                                  onClick={() => suspendAgency.mutate(agency.id)}
                                  disabled={suspendAgency.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Suspender
                                </Button>
                              )}
                              {agency.status === "suspended" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                  onClick={() => reactivateAgency.mutate(agency.id)}
                                  disabled={reactivateAgency.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Reativar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => impersonateAgency.mutate(agency.id)}
                                disabled={impersonateAgency.isPending}
                              >
                                <LogIn className="h-4 w-4 mr-1" />
                                Entrar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!agencies || agencies.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhuma agência encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Logs de Auditoria
                </CardTitle>
                <CardDescription>
                  Histórico de ações do Super Admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Agência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{log.super_admin_name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                          </TableCell>
                          <TableCell>{log.agency_name || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {(!auditLogs || auditLogs.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Nenhum log de auditoria encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
