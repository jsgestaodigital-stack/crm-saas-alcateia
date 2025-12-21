import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Mail, Lock, LogIn, AlertCircle, Loader2, UserPlus, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import alcateiaLogo from "@/assets/alcateia-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useSecurityCheck } from "@/hooks/useSecurityCheck";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().trim().email({
    message: "E-mail inválido"
  }),
  password: z.string().trim().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres"
  })
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    isBlocked: boolean;
    remainingSeconds: number;
    attempts: number;
    maxAttempts: number;
  } | null>(null);
  const [blockedUser, setBlockedUser] = useState<{
    blocked: boolean;
    reason?: string;
  } | null>(null);
  
  const {
    signIn,
    user,
    isLoading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkRateLimit, recordFailedLogin, checkUserStatus, logLoginSuccess } = useSecurityCheck();

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitInfo?.isBlocked && rateLimitInfo.remainingSeconds > 0) {
      const timer = setInterval(() => {
        setRateLimitInfo(prev => {
          if (!prev) return null;
          const newSeconds = prev.remainingSeconds - 1;
          if (newSeconds <= 0) {
            return null; // Clear the block
          }
          return { ...prev, remainingSeconds: newSeconds };
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitInfo?.isBlocked, rateLimitInfo?.remainingSeconds]);

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      if (!authLoading && user) {
        // Verificar status do usuário (bloqueado ou email não verificado)
        const status = await checkUserStatus();
        
        if (status?.blocked) {
          setBlockedUser({ blocked: true, reason: status.blocked_reason || undefined });
          await supabase.auth.signOut();
          return;
        }

        // Log successful login
        await logLoginSuccess();
        
        // Redirecionar para página original ou dashboard
        const from = (location.state as { from?: string })?.from || "/dashboard";
        navigate(from);
      }
    };

    checkAuthAndStatus();
  }, [authLoading, user, navigate, location, checkUserStatus, logLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setBlockedUser(null);

    const result = loginSchema.safeParse({
      email,
      password
    });
    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
      } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Verificar rate limit antes de tentar login
    if (!isSignUp) {
      const rateLimit = await checkRateLimit(email);
      if (rateLimit?.is_blocked) {
        setRateLimitInfo({
          isBlocked: true,
          remainingSeconds: rateLimit.remaining_lockout_seconds,
          attempts: rateLimit.email_attempts,
          maxAttempts: rateLimit.max_attempts
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este e-mail já está cadastrado. Tente fazer login.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          // Registrar tentativa de login falhada
          await recordFailedLogin(email);
          
          // Atualizar info de rate limit
          const rateLimit = await checkRateLimit(email);
          if (rateLimit) {
            setRateLimitInfo({
              isBlocked: rateLimit.is_blocked,
              remainingSeconds: rateLimit.remaining_lockout_seconds,
              attempts: rateLimit.email_attempts,
              maxAttempts: rateLimit.max_attempts
            });
          }

          if (error.message.includes("Invalid login credentials")) {
            toast.error("E-mail ou senha incorretos");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("E-mail não confirmado. Verifique sua caixa de entrada.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        // O useEffect vai cuidar do redirecionamento após verificar status
      }
    } catch {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={alcateiaLogo} alt="Alcateia Lobos do Google" className="h-24 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground">Plataforma Operacional Alcateia</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">Gestão de clientes, processos e execução diária — tudo em um só lugar.</p>
        </div>

        {/* Alerta de usuário bloqueado */}
        {blockedUser?.blocked && (
          <Alert variant="destructive" className="mb-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="font-semibold">Sua conta está bloqueada</p>
              {blockedUser.reason && <p className="text-sm mt-1">{blockedUser.reason}</p>}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.href = 'mailto:suporte@alcateia.com?subject=Solicitação de Reativação de Conta'}
              >
                Solicitar reativação
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de rate limit */}
        {rateLimitInfo?.isBlocked && (
          <Alert variant="destructive" className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="font-semibold">Muitas tentativas de login</p>
              <p className="text-sm mt-1">
                Aguarde {formatTime(rateLimitInfo.remainingSeconds)} antes de tentar novamente.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Aviso de tentativas restantes */}
        {rateLimitInfo && !rateLimitInfo.isBlocked && rateLimitInfo.attempts > 0 && (
          <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="ml-2 text-yellow-600 dark:text-yellow-400">
              {rateLimitInfo.maxAttempts - rateLimitInfo.attempts} tentativas restantes antes do bloqueio temporário.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-surface-2 border border-border/50 rounded-xl p-6 neon-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="pl-10 bg-background border-border/50 focus:border-primary" 
                  disabled={isLoading || rateLimitInfo?.isBlocked} 
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="pl-10 bg-background border-border/50 focus:border-primary" 
                  disabled={isLoading || rateLimitInfo?.isBlocked} 
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow" 
              disabled={isLoading || rateLimitInfo?.isBlocked}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? "Criando conta..." : "Entrando..."}
                </>
              ) : rateLimitInfo?.isBlocked ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Aguarde {formatTime(rateLimitInfo.remainingSeconds)}
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Conta
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/30 text-center">
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp ? "Já tem conta? Fazer login" : "Não tem conta? Criar conta"}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Alcateia Lobos do Google. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
