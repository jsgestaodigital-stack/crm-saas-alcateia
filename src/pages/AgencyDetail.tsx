import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Target, 
  Briefcase, 
  HardDrive,
  Save,
  Loader2,
  Mail,
  User,
  Pencil
} from "lucide-react";

interface AgencyDetails {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo_url: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  limits_max_users: number;
  limits_max_clients: number;
  limits_max_leads: number;
  limits_max_recurring_clients: number;
  limits_storage_mb: number;
  usage_current_users: number;
  usage_current_clients: number;
  usage_current_leads: number;
  usage_current_recurring_clients: number;
  usage_storage_used_mb: number;
  members_count: number;
  owner_name: string | null;
  owner_email: string | null;
  owner_id: string | null;
}

export default function AgencyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxClients, setMaxClients] = useState(100);
  const [maxLeads, setMaxLeads] = useState(500);
  const [maxRecurring, setMaxRecurring] = useState(50);
  const [storageMb, setStorageMb] = useState(5120);
  
  // Email change dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  // Check super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!isAuthLoading && !user) {
        navigate("/auth");
        return;
      }

      if (user) {
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

  // Fetch agency details
  const { data: agency, isLoading } = useQuery({
    queryKey: ["agency-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agency_details", { _agency_id: id });
      if (error) throw error;
      return (data as AgencyDetails[])?.[0] || null;
    },
    enabled: !!id,
  });

  // Populate form when data loads
  useEffect(() => {
    if (agency) {
      setName(agency.name);
      setStatus(agency.status);
      setMaxUsers(agency.limits_max_users);
      setMaxClients(agency.limits_max_clients);
      setMaxLeads(agency.limits_max_leads);
      setMaxRecurring(agency.limits_max_recurring_clients);
      setStorageMb(agency.limits_storage_mb);
    }
  }, [agency]);

  // Update mutation
  const updateAgency = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("update_agency", {
        _agency_id: id,
        _name: name,
        _status: status,
        _max_users: maxUsers,
        _max_clients: maxClients,
        _max_leads: maxLeads,
        _max_recurring_clients: maxRecurring,
        _storage_mb: storageMb,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agência atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["agency-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-agencies"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", { description: error.message });
    },
  });

  // Change email mutation
  const changeEmail = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("admin-change-email", {
        body: { user_id: agency?.owner_id, new_email: newEmail },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      toast.success("E-mail alterado com sucesso!");
      setEmailDialogOpen(false);
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["agency-detail", id] });
    },
    onError: (error) => {
      toast.error("Erro ao alterar e-mail", { description: error.message });
    },
  });

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

  const calcUsagePercent = (used: number, max: number) => 
    max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Agência não encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/super-admin")}>
            Voltar
          </Button>
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
              <Button variant="ghost" size="icon" onClick={() => navigate("/super-admin")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{agency.name}</h1>
                  <p className="text-sm text-muted-foreground">/{agency.slug}</p>
                </div>
              </div>
              {getStatusBadge(agency.status)}
            </div>
            <Button 
              onClick={() => updateAgency.mutate()}
              disabled={updateAgency.isPending}
            >
              {updateAgency.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6 max-w-4xl">
        {/* Owner Info */}
        {agency.owner_name && (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner da Agência
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                {agency.owner_name}
              </div>
              {agency.owner_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {agency.owner_email}
                </div>
              )}
              {agency.owner_id && (
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Pencil className="h-3 w-3 mr-1" />
                      Alterar E-mail
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar E-mail do Owner</DialogTitle>
                      <DialogDescription>
                        E-mail atual: <strong>{agency.owner_email}</strong>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="newEmail">Novo E-mail</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          placeholder="novo@email.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={() => changeEmail.mutate()}
                        disabled={!newEmail || changeEmail.isPending}
                      >
                        {changeEmail.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirmar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}

        {/* Basic Info */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados gerais da agência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="suspended">Suspensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Limites do Plano</CardTitle>
            <CardDescription>Configure os limites de recursos da agência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxUsers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Máximo de Usuários
                </Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(Number(e.target.value))}
                />
                <div className="space-y-1">
                  <Progress value={calcUsagePercent(agency.usage_current_users, maxUsers)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {agency.usage_current_users} / {maxUsers} em uso
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxClients" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Máximo de Clientes
                </Label>
                <Input
                  id="maxClients"
                  type="number"
                  value={maxClients}
                  onChange={(e) => setMaxClients(Number(e.target.value))}
                />
                <div className="space-y-1">
                  <Progress value={calcUsagePercent(agency.usage_current_clients, maxClients)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {agency.usage_current_clients} / {maxClients} em uso
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLeads" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Máximo de Leads
                </Label>
                <Input
                  id="maxLeads"
                  type="number"
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(Number(e.target.value))}
                />
                <div className="space-y-1">
                  <Progress value={calcUsagePercent(agency.usage_current_leads, maxLeads)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {agency.usage_current_leads} / {maxLeads} em uso
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRecurring" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Máximo Recorrência
                </Label>
                <Input
                  id="maxRecurring"
                  type="number"
                  value={maxRecurring}
                  onChange={(e) => setMaxRecurring(Number(e.target.value))}
                />
                <div className="space-y-1">
                  <Progress value={calcUsagePercent(agency.usage_current_recurring_clients, maxRecurring)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {agency.usage_current_recurring_clients} / {maxRecurring} em uso
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageMb" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Armazenamento (MB)
              </Label>
              <Input
                id="storageMb"
                type="number"
                value={storageMb}
                onChange={(e) => setStorageMb(Number(e.target.value))}
              />
              <div className="space-y-1">
                <Progress value={calcUsagePercent(agency.usage_storage_used_mb, storageMb)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {agency.usage_storage_used_mb} MB / {storageMb} MB em uso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
