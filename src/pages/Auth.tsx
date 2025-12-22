import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Mail, Lock, LogIn, AlertCircle, Loader2, UserPlus, ShieldAlert, Clock, ArrowLeft, KeyRound, CheckCircle2, XCircle, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ThemeLogo } from "@/components/ThemeLogo";
import { supabase } from "@/integrations/supabase/client";
import { useSecurityCheck } from "@/hooks/useSecurityCheck";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { validatePassword, getStrengthLabel, PASSWORD_REQUIREMENTS } from "@/lib/passwordValidation";
import { classifyError, formatErrorForContext, logError, ErrorType } from "@/lib/errorHandler";

const loginSchema = z.object({
  email: z.string().trim().email({
    message: "E-mail inválido"
  }),
  password: z.string().trim().min(8, {
    message: "Senha deve ter pelo menos 8 caracteres"
  })
});

const emailSchema = z.object({
  email: z.string().trim().email({
    message: "E-mail inválido"
  })
});

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'reset-success';

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    agencyName?: string;
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
    // If user arrived from password recovery link, show reset form instead of redirecting.
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const hash = location.hash || '';

    if (mode === 'reset' || hash.includes('type=recovery') || hash.includes('access_token=')) {
      setAuthMode('reset-password');
    }
  }, [location.search, location.hash]);

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      if (!authLoading && user) {
        // Check URL directly to prevent race condition with authMode state
        const params = new URLSearchParams(location.search);
        const mode = params.get('mode');
        const hash = location.hash || '';
        const isPasswordReset = mode === 'reset' || 
                                 hash.includes('type=recovery') || 
                                 hash.includes('access_token=') ||
                                 authMode === 'reset-password';
        
        if (isPasswordReset) {
          // Stay on page to allow password update
          setAuthMode('reset-password');
          return;
        }

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
  }, [authLoading, user, authMode, navigate, location, checkUserStatus, logLoginSuccess]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate all fields
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse({ email });
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0]?.message;
    }
    
    if (!fullName.trim()) {
      newErrors.fullName = "Nome é obrigatório";
    }
    
    if (!agencyName.trim()) {
      newErrors.agencyName = "Nome da agência é obrigatório";
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não conferem";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("self-reset-password", {
        body: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          agency_name: agencyName.trim(),
          new_password: password,
        },
      });

      if (error) {
        console.error("Self reset error:", error);
        toast.error("Erro ao processar solicitação. Tente novamente.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Senha alterada com sucesso! Faça login com a nova senha.");
      setAuthMode('login');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setAgencyName('');
    } catch (err) {
      console.error("Self reset catch:", err);
      toast.error("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação de senha forte
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setErrors({ password: passwordValidation.errors[0] });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'As senhas não conferem' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        logError(error, 'reset-password');
        const classified = classifyError(error);
        toast.error(formatErrorForContext(error, 'auth'));
        return;
      }

      toast.success('Senha atualizada! Faça login com a nova senha.');

      // Clear URL (remove tokens/mode) and reset UI
      navigate('/auth', { replace: true });
      setAuthMode('login');
      setPassword('');
      setConfirmPassword('');
      await supabase.auth.signOut();
    } catch (err) {
      logError(err, 'reset-password');
      toast.error(formatErrorForContext(err, 'auth'));
    } finally {
      setIsLoading(false);
    }
  };

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
    if (authMode === 'login') {
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
      if (authMode === 'signup') {
        // Validação de senha forte no signup
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          setErrors({ password: passwordValidation.errors[0] });
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) {
          logError(error, 'signup');
          if (error.message.includes("already registered")) {
            toast.error("Este e-mail já está cadastrado. Tente fazer login.");
          } else {
            toast.error(formatErrorForContext(error, 'auth'));
          }
          return;
        }
        toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        setAuthMode('login');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          logError(error, 'login');
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

          // Tratamento de erro diferenciado
          const classified = classifyError(error);
          if (classified.type === ErrorType.Authentication || 
              error.message.includes("Invalid login credentials")) {
            toast.error("E-mail ou senha incorretos");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("E-mail não confirmado. Verifique sua caixa de entrada.");
          } else if (classified.type === ErrorType.RateLimit) {
            toast.error("Muitas tentativas. Aguarde antes de tentar novamente.");
          } else if (classified.type === ErrorType.Network) {
            toast.error("Erro de conexão. Verifique sua internet.");
          } else {
            toast.error(classified.userMessage);
          }
          return;
        }
        // O useEffect vai cuidar do redirecionamento após verificar status
      }
    } catch (err) {
      logError(err, 'auth-submit');
      toast.error(formatErrorForContext(err, 'auth'));
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const passwordStrength = useMemo(() => {
    if (!password || authMode === 'login') return null;
    return validatePassword(password);
  }, [password, authMode]);

  const strengthLabel = useMemo(() => {
    if (!passwordStrength) return null;
    return getStrengthLabel(passwordStrength.score);
  }, [passwordStrength]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 safe-area-inset-top safe-area-inset-bottom">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <ThemeLogo className="h-16 sm:h-20 md:h-24 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">GRank CRM</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-xs mx-auto px-2">CRM para vendas e gestão de perfis da empresa no Google</p>
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
                onClick={() => window.location.href = 'mailto:suporte@grank.com.br?subject=Solicitação de Reativação de Conta'}
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

        <div className="bg-surface-2 border border-border/50 rounded-xl p-4 sm:p-6 neon-border">
          {/* Reset Password Form (from recovery link) */}
          {authMode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Definir nova senha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha uma nova senha (mínimo 8 caracteres)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm text-foreground">
                  Nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background border-border/50 focus:border-primary"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm text-foreground">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-background border-border/50 focus:border-primary"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Salvar nova senha
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setAuthMode('login');
                  setPassword('');
                  setConfirmPassword('');
                  navigate('/auth', { replace: true });
                }}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para login
              </Button>
            </form>
          )}

          {/* Forgot Password Success */}
          {authMode === 'reset-success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">E-mail enviado!</h2>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAuthMode('login');
                  setEmail('');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para login
              </Button>
            </div>
          )}

          {/* Forgot Password Form - Self Service */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Recuperar senha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirme seus dados para criar uma nova senha
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm text-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="pl-10 bg-background border-border/50 focus:border-primary" 
                    disabled={isLoading} 
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
                <Label htmlFor="reset-name" className="text-sm text-foreground">
                  Seu nome
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="reset-name" 
                    type="text" 
                    placeholder="Nome como está no cadastro" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    className="pl-10 bg-background border-border/50 focus:border-primary" 
                    disabled={isLoading} 
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-agency" className="text-sm text-foreground">
                  Nome da agência
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="reset-agency" 
                    type="text" 
                    placeholder="Nome da sua agência" 
                    value={agencyName} 
                    onChange={e => setAgencyName(e.target.value)} 
                    className="pl-10 bg-background border-border/50 focus:border-primary" 
                    disabled={isLoading} 
                  />
                </div>
                {errors.agencyName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.agencyName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-new-password" className="text-sm text-foreground">
                  Nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="reset-new-password" 
                    type="password" 
                    placeholder="Mínimo 8 caracteres" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="pl-10 bg-background border-border/50 focus:border-primary" 
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password" className="text-sm text-foreground">
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="reset-confirm-password" 
                    type="password" 
                    placeholder="Confirme a nova senha" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="pl-10 bg-background border-border/50 focus:border-primary" 
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Redefinir senha
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setAuthMode('login');
                  setFullName('');
                  setAgencyName('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para login
              </Button>
            </form>
          )}

          {/* Login / Signup Form */}
          {(authMode === 'login' || authMode === 'signup') && (
            <>
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
                  
                  {/* Indicador de força de senha - apenas no signup */}
                  {authMode === 'signup' && password && passwordStrength && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Força da senha:</span>
                        <span className={strengthLabel?.color}>{strengthLabel?.label}</span>
                      </div>
                      <Progress value={(passwordStrength.score / 4) * 100} className="h-1" />
                      <ul className="text-xs space-y-1 mt-2">
                        <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {password.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          Mínimo 8 caracteres
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {/[A-Z]/.test(password) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          Uma letra maiúscula
                        </li>
                        <li className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {/[a-z]/.test(password) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          Uma letra minúscula
                        </li>
                        <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {/[0-9]/.test(password) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          Um número
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Forgot Password Link - only show on login */}
                {authMode === 'login' && (
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
                      onClick={() => {
                        setAuthMode('forgot-password');
                        setErrors({});
                      }}
                    >
                      Esqueceu sua senha?
                    </Button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow" 
                  disabled={isLoading || rateLimitInfo?.isBlocked}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {authMode === 'signup' ? "Criando conta..." : "Entrando..."}
                    </>
                  ) : rateLimitInfo?.isBlocked ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Aguarde {formatTime(rateLimitInfo.remainingSeconds)}
                    </>
                  ) : authMode === 'signup' ? (
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
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                  disabled={isLoading}
                >
                  {authMode === 'signup' ? "Já tem conta? Fazer login" : "Não tem conta? Criar conta"}
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} G Rank CRM. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
