import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { usePendingRegistrations } from "@/hooks/usePendingRegistrations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
  RefreshCw,
  UserPlus,
  Mail,
  Phone,
  Loader2,
  Copy
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

  const {
    registrations,
    isLoading: isLoadingRegistrations,
    fetchRegistrations,
    approveRegistration,
    rejectRegistration,
  } = usePendingRegistrations();

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{ email: string; password: string } | null>(null);

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
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Aprovada</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitada</Badge>;
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
      approve_registration: "Aprovou solicitação",
      reject_registration: "Rejeitou solicitação",
      create_agency_owner: "Criou owner da agência",
    };
    return labels[action] || action;
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;
    setIsProcessing(true);
    try {
      const result = await approveRegistration(selectedRegistration.id, tempPassword || undefined);
      setApprovalResult({
        email: result.owner_email,
        password: result.temp_password,
      });
      refetchAgencies();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration) return;
    setIsProcessing(true);
    try {
      await rejectRegistration(selectedRegistration.id, rejectReason || "Não aprovado");
      setRejectDialogOpen(false);
      setSelectedRegistration(null);
      setRejectReason("");
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const pendingRegistrations = registrations.filter(r => r.status === "pending");

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
                fetchRegistrations();
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
                <UserPlus className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingRegistrations.length}</p>
                  <p className="text-xs text-muted-foreground">Solicitações</p>
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
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="registrations" className="relative">
              Solicitações
              {pendingRegistrations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {pendingRegistrations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="agencies">Agências</TabsTrigger>
            <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          </TabsList>

          {/* Solicitações Pendentes */}
          <TabsContent value="registrations" className="space-y-4">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Solicitações de Cadastro
                </CardTitle>
                <CardDescription>
                  Novas agências aguardando aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRegistrations ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação encontrada</p>
                    <p className="text-sm mt-1">Novas agências aparecerão aqui quando se cadastrarem em /register</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agência</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Solicitado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reg.agency_name}</p>
                              <p className="text-xs text-muted-foreground">/{reg.agency_slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>{reg.owner_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {reg.owner_email}
                              </div>
                              {reg.owner_phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {reg.owner_phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(reg.status)}</TableCell>
                          <TableCell>
                            {format(new Date(reg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {reg.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                    onClick={() => {
                                      setSelectedRegistration(reg);
                                      setTempPassword("");
                                      setApprovalResult(null);
                                      setApproveDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                                    onClick={() => {
                                      setSelectedRegistration(reg);
                                      setRejectReason("");
                                      setRejectDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agências */}
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

          {/* Logs */}
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setApproveDialogOpen(false);
          setSelectedRegistration(null);
          setApprovalResult(null);
          setTempPassword("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              {approvalResult 
                ? "Agência aprovada com sucesso! Guarde as credenciais abaixo."
                : `Aprovar a agência "${selectedRegistration?.agency_name}"?`
              }
            </DialogDescription>
          </DialogHeader>
          
          {approvalResult ? (
            <div className="space-y-4 py-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Credenciais do Owner</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-background/50 rounded px-3 py-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-mono text-sm">{approvalResult.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(approvalResult.email)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-3 py-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Senha Temporária</p>
                      <p className="font-mono text-sm">{approvalResult.password}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(approvalResult.password)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Envie essas credenciais para o responsável da agência.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setApproveDialogOpen(false);
                  setSelectedRegistration(null);
                  setApprovalResult(null);
                }}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><strong>Agência:</strong> {selectedRegistration?.agency_name}</p>
                  <p className="text-sm"><strong>Responsável:</strong> {selectedRegistration?.owner_name}</p>
                  <p className="text-sm"><strong>Email:</strong> {selectedRegistration?.owner_email}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempPassword">Senha Temporária (opcional)</Label>
                  <Input
                    id="tempPassword"
                    type="text"
                    placeholder="Deixe vazio para gerar automaticamente"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se não informada, uma senha aleatória será gerada.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleApprove} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar Agência
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Rejeitar a agência "{selectedRegistration?.agency_name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Motivo da Rejeição</Label>
              <Textarea
                id="rejectReason"
                placeholder="Ex: Dados incompletos, empresa não verificada..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReject} disabled={isProcessing} variant="destructive">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
