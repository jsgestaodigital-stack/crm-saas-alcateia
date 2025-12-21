import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Users,
  Shield,
  UserPlus,
  Trash2,
  Key,
  Copy,
  Check,
  Search,
  ArrowLeft,
  Crown,
  Eye,
  Settings,
  AlertCircle,
  Loader2,
  Target,
  Briefcase,
  DollarSign,
  CalendarCheck,
  RefreshCw,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/clientUtils";
import grankLogo from "@/assets/grank-logo.png";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type UserStatus = Database["public"]["Enums"]["user_status"];

interface UserWithRole {
  id: string;
  full_name: string;
  avatar_url: string | null;
  status: UserStatus;
  last_login: string | null;
  created_at: string;
  email: string;
  role: AppRole;
  permissions: {
    can_sales: boolean;
    can_ops: boolean;
    can_admin: boolean;
    can_finance: boolean;
    can_recurring: boolean;
  };
}

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  operador: "Operador",
  visualizador: "Visualizador",
  super_admin: "Super Admin",
  owner: "Proprietário",
  manager: "Gerente",
  sales_rep: "Vendedor",
  support: "Suporte",
};

const roleColors: Record<AppRole, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  operador: "bg-status-info/20 text-status-info border-status-info/30",
  visualizador: "bg-muted text-muted-foreground border-border/30",
  super_admin: "bg-destructive/20 text-destructive border-destructive/30",
  owner: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  manager: "bg-warning/20 text-warning border-warning/30",
  sales_rep: "bg-green-500/20 text-green-500 border-green-500/30",
  support: "bg-blue-500/20 text-blue-500 border-blue-500/30",
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  admin: <Crown className="w-3 h-3" />,
  operador: <Settings className="w-3 h-3" />,
  visualizador: <Eye className="w-3 h-3" />,
  super_admin: <Crown className="w-3 h-3" />,
  owner: <Crown className="w-3 h-3" />,
  manager: <Settings className="w-3 h-3" />,
  sales_rep: <Eye className="w-3 h-3" />,
  support: <Settings className="w-3 h-3" />,
};

const statusColors: Record<UserStatus, string> = {
  ativo: "bg-status-success/20 text-status-success",
  suspenso: "bg-status-warning/20 text-status-warning",
  excluido: "bg-status-danger/20 text-status-danger",
};

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading, derived } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New user dialog state
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("operador");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Reset password dialog state
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithRole | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Password strength validation schema
  const passwordSchema = useMemo(() => z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/\d/, "Senha deve conter pelo menos 1 número")
    .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/, "Senha deve conter pelo menos 1 símbolo (!@#$%^&*)"), []);

  const emailSchema = useMemo(() => z.string().email("E-mail inválido"), []);
  const nameSchema = useMemo(() => z.string().min(2, "Nome deve ter pelo menos 2 caracteres"), []);

  const canAccessAdmin = derived?.canAdminOrIsAdmin ?? isAdmin;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && !canAccessAdmin) {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      navigate("/dashboard");
      return;
    }

    if (user && canAccessAdmin) {
      fetchUsers();
    }
  }, [user, canAccessAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .neq("status", "excluido");

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from("user_permissions")
        .select("*");

      if (permissionsError) throw permissionsError;

      // Combine data - we need to get emails from auth
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        const userPermissions = permissions.find((p) => p.user_id === profile.id);
        return {
          ...profile,
          email: "", // Will be filled later
          role: userRole?.role ?? "visualizador",
          permissions: {
            can_sales: userPermissions?.can_sales ?? false,
            can_ops: userPermissions?.can_ops ?? false,
            can_admin: userPermissions?.can_admin ?? false,
            can_finance: userPermissions?.can_finance ?? false,
            can_recurring: (userPermissions as any)?.can_recurring ?? false,
          },
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Reset errors
    setFormErrors({});
    
    // Validate inputs
    const errors: { name?: string; email?: string; password?: string } = {};
    
    const nameResult = nameSchema.safeParse(newUserName.trim());
    if (!nameResult.success) {
      errors.name = nameResult.error.errors[0].message;
    }
    
    const emailResult = emailSchema.safeParse(newUserEmail.trim());
    if (!emailResult.success) {
      errors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(newUserPassword);
    if (!passwordResult.success) {
      errors.password = passwordResult.error.errors[0].message;
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword,
          full_name: newUserName.trim(),
          role: newUserRole,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao criar usuário");
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Usuário ${newUserEmail} criado com sucesso!`);
      setIsNewUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("operador");
      setFormErrors({});
      fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao criar usuário");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Soft delete - just update status
      const { error } = await supabase
        .from("profiles")
        .update({ status: "excluido" as UserStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Usuário excluído com sucesso");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Erro ao excluir usuário");
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Nível de acesso atualizado");
      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error("Erro ao atualizar nível de acesso");
    }
  };

  const handlePermissionChange = async (userId: string, permission: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from("user_permissions")
        .update({ [permission]: value })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Permissão atualizada");
      fetchUsers();
    } catch (err) {
      console.error("Error updating permission:", err);
      toast.error("Erro ao atualizar permissão");
    }
  };

  const copyLoginLink = (userId: string) => {
    const link = `${window.location.origin}/auth`;
    navigator.clipboard.writeText(link);
    setCopiedId(userId);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openResetPasswordDialog = (user: UserWithRole) => {
    setResetPasswordUser(user);
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetPasswordError(null);
    setGeneratedPassword(null);
    setShowGeneratedPassword(false);
    setCopiedPassword(false);
    setIsResetPasswordOpen(true);
  };

  // Generate a strong random password
  const generateRandomPassword = () => {
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numbers = "23456789";
    const symbols = "!@#$%&*";
    
    let password = "";
    // Ensure at least one of each required type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest (12 chars total)
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 0; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split("").sort(() => Math.random() - 0.5).join("");
  };

  const handleGenerateAndSetPassword = async () => {
    if (!resetPasswordUser) return;

    const newPassword = generateRandomPassword();
    setIsResettingPassword(true);
    setResetPasswordError(null);

    try {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: {
          user_id: resetPasswordUser.id,
          new_password: newPassword,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao gerar senha");
      }

      if (data?.error) {
        setResetPasswordError(data.error);
        return;
      }

      setGeneratedPassword(newPassword);
      setShowGeneratedPassword(true);
      toast.success("Senha temporária gerada com sucesso!");
    } catch (err) {
      console.error("Error generating password:", err);
      setResetPasswordError(err instanceof Error ? err.message : "Erro ao gerar senha");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyGeneratedPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopiedPassword(true);
      toast.success("Senha copiada para a área de transferência!");
      setTimeout(() => setCopiedPassword(false), 3000);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;

    // Validate passwords
    if (resetNewPassword !== resetConfirmPassword) {
      setResetPasswordError("As senhas não coincidem");
      return;
    }

    const passwordResult = passwordSchema.safeParse(resetNewPassword);
    if (!passwordResult.success) {
      setResetPasswordError(passwordResult.error.errors[0].message);
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordError(null);

    try {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: {
          user_id: resetPasswordUser.id,
          new_password: resetNewPassword,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao resetar senha");
      }

      if (data?.error) {
        setResetPasswordError(data.error);
        return;
      }

      toast.success(`Senha de ${resetPasswordUser.full_name} alterada com sucesso!`);
      setIsResetPasswordOpen(false);
      setResetPasswordUser(null);
      setResetNewPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      console.error("Error resetting password:", err);
      setResetPasswordError(err instanceof Error ? err.message : "Erro ao resetar senha");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-surface-1/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={grankLogo} alt="GRank CRM" className="h-8" />
            <div className="h-6 w-px bg-border/50" />
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Painel Admin
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-2 border border-border/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-2 border border-border/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-success/10">
                <Crown className="w-5 h-5 text-status-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-2 border border-border/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-info/10">
                <Settings className="w-5 h-5 text-status-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operadores</p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === "operador").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Management */}
        <div className="bg-surface-2 border border-border/30 rounded-xl">
          <div className="p-4 border-b border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Gerenciar Usuários
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64 bg-background"
                />
              </div>
              <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface-1 border-border/50 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Criar Novo Usuário</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Preencha os dados do novo usuário. A senha deve ser forte.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newUserName">Nome Completo</Label>
                      <Input
                        id="newUserName"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="João Silva"
                        className="bg-background"
                        disabled={isCreatingUser}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserEmail">E-mail</Label>
                      <Input
                        id="newUserEmail"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="usuario@empresa.com"
                        className="bg-background"
                        disabled={isCreatingUser}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserPassword">Senha</Label>
                      <Input
                        id="newUserPassword"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-background"
                        disabled={isCreatingUser}
                      />
                      {formErrors.password && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.password}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, incluindo 1 número e 1 símbolo (!@#$%^&*)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Nível de Acesso</Label>
                      <Select
                        value={newUserRole}
                        onValueChange={(v) => setNewUserRole(v as AppRole)}
                        disabled={isCreatingUser}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-1 border-border/50">
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2">
                              <Crown className="w-3 h-3" />
                              Admin
                            </span>
                          </SelectItem>
                          <SelectItem value="operador">
                            <span className="flex items-center gap-2">
                              <Settings className="w-3 h-3" />
                              Operador
                            </span>
                          </SelectItem>
                          <SelectItem value="visualizador">
                            <span className="flex items-center gap-2">
                              <Eye className="w-3 h-3" />
                              Visualizador
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsNewUserOpen(false);
                        setFormErrors({});
                      }}
                      disabled={isCreatingUser}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={isCreatingUser}
                      className="bg-primary"
                    >
                      {isCreatingUser ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Criar Usuário
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Reset Password Dialog */}
              <Dialog open={isResetPasswordOpen} onOpenChange={(open) => {
                setIsResetPasswordOpen(open);
                if (!open) {
                  setGeneratedPassword(null);
                  setShowGeneratedPassword(false);
                }
              }}>
                <DialogContent className="bg-surface-1 border-border/50 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Alterar Senha</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {showGeneratedPassword 
                        ? <>Senha temporária gerada para <strong>{resetPasswordUser?.full_name}</strong></>
                        : <>Defina uma nova senha para <strong>{resetPasswordUser?.full_name}</strong></>
                      }
                    </DialogDescription>
                  </DialogHeader>

                  {showGeneratedPassword && generatedPassword ? (
                    // Show generated password
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Senha temporária (copie agora!):</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-background rounded font-mono text-lg text-foreground tracking-wider select-all">
                            {generatedPassword}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyGeneratedPassword}
                            className="shrink-0"
                          >
                            {copiedPassword ? (
                              <Check className="w-4 h-4 text-status-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                        <p className="text-xs text-status-warning flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Esta senha não será exibida novamente. Copie e envie ao usuário.
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Show password form
                    <div className="space-y-4 py-4">
                      {/* Generate password button */}
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-3">
                          Gere uma senha forte automaticamente:
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleGenerateAndSetPassword}
                          disabled={isResettingPassword}
                          className="w-full border-primary/30 hover:bg-primary/10"
                        >
                          {isResettingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Gerar Senha Temporária
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="relative flex items-center gap-2">
                        <div className="flex-1 border-t border-border/30" />
                        <span className="text-xs text-muted-foreground px-2">ou defina manualmente</span>
                        <div className="flex-1 border-t border-border/30" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="resetNewPassword">Nova Senha</Label>
                        <Input
                          id="resetNewPassword"
                          type="password"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-background"
                          disabled={isResettingPassword}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resetConfirmPassword">Confirmar Nova Senha</Label>
                        <Input
                          id="resetConfirmPassword"
                          type="password"
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-background"
                          disabled={isResettingPassword}
                        />
                      </div>
                      {resetPasswordError && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {resetPasswordError}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, incluindo 1 número e 1 símbolo (!@#$%^&*)
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    {showGeneratedPassword ? (
                      <Button
                        onClick={() => {
                          setIsResetPasswordOpen(false);
                          setGeneratedPassword(null);
                          setShowGeneratedPassword(false);
                        }}
                        className="bg-primary"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Concluído
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsResetPasswordOpen(false);
                            setResetPasswordError(null);
                          }}
                          disabled={isResettingPassword}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleResetPassword}
                          disabled={isResettingPassword || !resetNewPassword || !resetConfirmPassword}
                          className="bg-primary"
                        >
                          {isResettingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Alterando...
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4 mr-2" />
                              Alterar Senha
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Usuário
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Nível de Acesso
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Permissões de Módulo
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Último Login
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border/20 hover:bg-surface-3/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/50">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {u.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{u.full_name}</p>
                            <p className="text-sm text-muted-foreground">{u.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u.id, value as AppRole)}
                        >
                          <SelectTrigger className="w-36 bg-background border-border/30">
                            <SelectValue>
                              <span className="flex items-center gap-2">
                                {roleIcons[u.role]}
                                {roleLabels[u.role]}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-surface-1 border-border/50">
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <Crown className="w-3 h-3" />
                                Admin
                              </span>
                            </SelectItem>
                            <SelectItem value="operador">
                              <span className="flex items-center gap-2">
                                <Settings className="w-3 h-3" />
                                Operador
                              </span>
                            </SelectItem>
                            <SelectItem value="visualizador">
                              <span className="flex items-center gap-2">
                                <Eye className="w-3 h-3" />
                                Visualizador
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {/* Vendas */}
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                            <Target className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-amber-400">Vendas</span>
                            <Switch
                              checked={u.permissions.can_sales}
                              onCheckedChange={(v) => handlePermissionChange(u.id, "can_sales", v)}
                              disabled={u.role === "admin"}
                              className="scale-75"
                            />
                          </div>
                          {/* Operacional */}
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                            <Briefcase className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-blue-400">Ops</span>
                            <Switch
                              checked={u.permissions.can_ops}
                              onCheckedChange={(v) => handlePermissionChange(u.id, "can_ops", v)}
                              disabled={u.role === "admin"}
                              className="scale-75"
                            />
                          </div>
                          {/* Recorrência */}
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
                            <CalendarCheck className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-purple-400">Recorrência</span>
                            <Switch
                              checked={u.permissions.can_recurring}
                              onCheckedChange={(v) => handlePermissionChange(u.id, "can_recurring", v)}
                              disabled={u.role === "admin"}
                              className="scale-75"
                            />
                          </div>
                          {/* Financeiro */}
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                            <DollarSign className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">Finance</span>
                            <Switch
                              checked={u.permissions.can_finance}
                              onCheckedChange={(v) => handlePermissionChange(u.id, "can_finance", v)}
                              disabled={u.role === "admin"}
                              className="scale-75"
                            />
                          </div>
                        </div>
                        {u.role === "admin" && (
                          <p className="text-[10px] text-muted-foreground mt-1">Admin tem acesso total</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${statusColors[u.status]} border-none`}>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {u.last_login ? formatDateTime(u.last_login) : "Nunca"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyLoginLink(u.id)}
                          >
                            {copiedId === u.id ? (
                              <Check className="w-4 h-4 text-status-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openResetPasswordDialog(u)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-surface-1 border-border/50">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">
                                  Excluir usuário?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Esta ação não pode ser desfeita. O usuário{" "}
                                  <strong>{u.full_name}</strong> será desativado do sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-secondary">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-surface-2 border border-primary/20 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Informações de Segurança
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Senhas são armazenadas de forma criptografada (bcrypt)</li>
            <li>• Roles são gerenciados em tabela separada por segurança</li>
            <li>• Row Level Security (RLS) protege todos os dados</li>
            <li>• Apenas administradores podem gerenciar usuários</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
