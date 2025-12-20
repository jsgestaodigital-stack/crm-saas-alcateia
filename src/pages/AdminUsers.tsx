import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Users, Shield, RefreshCw, ArrowLeft } from "lucide-react";

interface AgencyMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string;
    status: string;
  };
  permissions?: {
    can_sales: boolean;
    can_ops: boolean;
    can_admin: boolean;
    can_finance: boolean;
    can_recurring: boolean;
  };
}

export default function AdminUsers() {
  const { user, isLoading: authLoading, isAdmin, permissions } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "member",
    canSales: false,
    canOps: false,
    canAdmin: false,
    canFinance: false,
    canRecurring: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!authLoading && user && !isAdmin && !permissions?.canAdmin) {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      navigate("/dashboard");
      return;
    }
    if (user) {
      fetchMembers();
    }
  }, [user, authLoading, isAdmin, permissions]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data: agencyMembers, error: membersError } = await supabase
        .from("agency_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      const enrichedMembers = await Promise.all(
        (agencyMembers || []).map(async (member) => {
          const [profileRes, permissionsRes] = await Promise.all([
            supabase.from("profiles").select("full_name, status").eq("id", member.user_id).single(),
            supabase.from("user_permissions").select("*").eq("user_id", member.user_id).single(),
          ]);

          return {
            ...member,
            profile: profileRes.data || undefined,
            permissions: permissionsRes.data || undefined,
          };
        })
      );

      setMembers(enrichedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Erro ao carregar colaboradores");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.fullName || !newUser.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUser.email.toLowerCase().trim(),
          password: newUser.password,
          fullName: newUser.fullName.trim(),
          role: newUser.role === "admin" ? "admin" : "operador",
          permissions: {
            can_sales: newUser.canSales,
            can_ops: newUser.canOps,
            can_admin: newUser.canAdmin,
            can_finance: newUser.canFinance,
            can_recurring: newUser.canRecurring,
          },
        },
      });

      if (error) throw error;

      toast.success("Colaborador criado com sucesso!");
      setDialogOpen(false);
      setNewUser({
        email: "",
        fullName: "",
        password: "",
        role: "member",
        canSales: false,
        canOps: false,
        canAdmin: false,
        canFinance: false,
        canRecurring: false,
      });
      fetchMembers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Erro ao criar colaborador");
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      owner: { variant: "default", label: "Proprietário" },
      admin: { variant: "default", label: "Admin" },
      member: { variant: "secondary", label: "Membro" },
    };
    const config = variants[role] || { variant: "outline" as const, label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPermissionBadges = (perms?: AgencyMember["permissions"]) => {
    if (!perms) return null;
    const badges = [];
    if (perms.can_sales) badges.push(<Badge key="sales" variant="outline" className="text-xs">Vendas</Badge>);
    if (perms.can_ops) badges.push(<Badge key="ops" variant="outline" className="text-xs">Ops</Badge>);
    if (perms.can_admin) badges.push(<Badge key="admin" variant="outline" className="text-xs">Admin</Badge>);
    if (perms.can_finance) badges.push(<Badge key="finance" variant="outline" className="text-xs">Financeiro</Badge>);
    if (perms.can_recurring) badges.push(<Badge key="recurring" variant="outline" className="text-xs">Recorrência</Badge>);
    return badges.length > 0 ? <div className="flex gap-1 flex-wrap">{badges}</div> : <span className="text-muted-foreground text-xs">Nenhuma</span>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Gerenciar Colaboradores
                </h1>
                <p className="text-sm text-muted-foreground">
                  Adicione e gerencie os usuários da sua agência
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchMembers} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Colaborador
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Adicionar Colaborador</DialogTitle>
                    <DialogDescription>
                      Crie uma conta para um novo membro da sua equipe
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        placeholder="Ex: Maria Silva"
                        value={newUser.fullName}
                        onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colaborador@email.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha Inicial *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Função</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Permissões
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canSales"
                            checked={newUser.canSales}
                            onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, canSales: !!checked }))}
                          />
                          <Label htmlFor="canSales" className="text-sm font-normal">Vendas</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canOps"
                            checked={newUser.canOps}
                            onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, canOps: !!checked }))}
                          />
                          <Label htmlFor="canOps" className="text-sm font-normal">Operações</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canFinance"
                            checked={newUser.canFinance}
                            onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, canFinance: !!checked }))}
                          />
                          <Label htmlFor="canFinance" className="text-sm font-normal">Financeiro</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="canRecurring"
                            checked={newUser.canRecurring}
                            onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, canRecurring: !!checked }))}
                          />
                          <Label htmlFor="canRecurring" className="text-sm font-normal">Recorrência</Label>
                        </div>
                        <div className="flex items-center space-x-2 col-span-2">
                          <Checkbox
                            id="canAdmin"
                            checked={newUser.canAdmin}
                            onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, canAdmin: !!checked }))}
                          />
                          <Label htmlFor="canAdmin" className="text-sm font-normal">Administrador</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateUser} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Colaborador"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Colaboradores</CardTitle>
            <CardDescription>
              {members.length} colaborador{members.length !== 1 ? "es" : ""} na sua agência
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum colaborador encontrado. Adicione o primeiro!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profile?.full_name || "—"}
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{getPermissionBadges(member.permissions)}</TableCell>
                      <TableCell>
                        <Badge variant={member.profile?.status === "ativo" ? "default" : "secondary"}>
                          {member.profile?.status || "ativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(member.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
