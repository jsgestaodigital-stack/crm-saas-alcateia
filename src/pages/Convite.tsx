import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Mail,
  Building2,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useInviteAcceptance } from "@/hooks/useInvites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

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

const emailSchema = z.string().email("E-mail inválido");
const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/\d/, "Senha deve conter pelo menos 1 número")
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/, "Senha deve conter pelo menos 1 símbolo");
const nameSchema = z.string().min(2, "Nome deve ter pelo menos 2 caracteres");

export default function Convite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { invite, isLoading, acceptInvite } = useInviteAcceptance(token);

  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  // Prefill email from invite
  useEffect(() => {
    if (invite?.email) {
      setEmail(invite.email);
    }
  }, [invite?.email]);

  // If user is already logged in, try to accept the invite directly
  useEffect(() => {
    if (user && invite && invite.status === "pending" && !invite.is_expired && !accepted) {
      handleAcceptInvite();
    }
  }, [user, invite, accepted]);

  const handleAcceptInvite = async () => {
    setIsSubmitting(true);
    try {
      await acceptInvite.mutateAsync();
      setAccepted(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setErrors({});
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) throw error;

      // Accept invite will be triggered by the useEffect when user state updates
      toast.success("Login realizado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    setErrors({});
    const validationErrors: typeof errors = {};

    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) validationErrors.name = nameResult.error.errors[0].message;

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) validationErrors.email = emailResult.error.errors[0].message;

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) validationErrors.password = passwordResult.error.errors[0].message;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/convite/${token}`,
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      toast.success("Conta criada! Verifique seu email para confirmar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Convite não encontrado</CardTitle>
            <CardDescription>
              Este link de convite é inválido ou já foi utilizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/auth")}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.is_expired || invite.status === "expired") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <CardTitle>Convite expirado</CardTitle>
            <CardDescription>
              Este convite não é mais válido. Solicite um novo convite ao administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/auth")}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.status !== "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Convite já utilizado</CardTitle>
            <CardDescription>
              Este convite já foi aceito ou cancelado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/auth")}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Convite aceito!</CardTitle>
            <CardDescription>
              Você agora faz parte de <strong>{invite.agency_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecionando para o dashboard...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in but invite email doesn't match
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Aceitar convite</CardTitle>
            <CardDescription>
              Você foi convidado para participar de
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{invite.agency_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Função: </span>
                <Badge variant="secondary">{roleLabels[invite.role]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{invite.email}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Convidado por <strong>{invite.invited_by_name}</strong>
            </p>

            <Button
              className="w-full"
              onClick={handleAcceptInvite}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Aceitar convite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in - show login/signup form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Você foi convidado!</CardTitle>
          <CardDescription>
            Para participar de <strong>{invite.agency_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Função:</span>
            </div>
            <Badge variant="secondary">{roleLabels[invite.role]}</Badge>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
              <TabsTrigger value="login">Já tenho conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome completo</Label>
                <Input
                  id="signup-name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Use o email para o qual o convite foi enviado
                </p>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deve conter letras, números e símbolos
                </p>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button
                className="w-full"
                onClick={handleSignup}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar conta e aceitar convite
              </Button>
            </TabsContent>

            <TabsContent value="login" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Entrar e aceitar convite
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground">
            Convidado por {invite.invited_by_name}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
