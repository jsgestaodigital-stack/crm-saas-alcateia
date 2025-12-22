import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Crown,
  Infinity,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Clock
} from "lucide-react";
import alcateiaLogo from "@/assets/alcateia-logo.png";
import grankLogoDark from "@/assets/grank-logo-dark.png";

// Validation schema
const registerSchema = z.object({
  agencyName: z.string()
    .min(3, "Nome da agência deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  ownerName: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  ownerEmail: z.string()
    .email("Email inválido")
    .max(255, "Email muito longo"),
  ownerPhone: z.string()
    .optional()
    .refine(
      (val) => !val || /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/.test(val.replace(/\s/g, "")),
      "Formato inválido. Use (11) 99999-9999"
    ),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(72, "Senha muito longa")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterAlcateia() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    agencyName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate with Zod
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof RegisterFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(formData.agencyName);

      // Call auto-register edge function with alcateia flag
      const { data, error } = await supabase.functions.invoke("auto-register-agency", {
        body: {
          agencyName: formData.agencyName.trim(),
          agencySlug: slug,
          ownerName: formData.ownerName.trim(),
          ownerEmail: formData.ownerEmail.trim().toLowerCase(),
          ownerPhone: formData.ownerPhone?.trim() || null,
          password: formData.password,
          isAlcateia: true, // Flag for lifetime access - goes to pending_registrations
        },
      });

      // Handle edge function errors
      if (error) {
        console.error("Registration error:", error);
        let errorMessage = "Erro ao criar conta. Tente novamente.";
        if (error.message?.includes("non-2xx")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Handle function response errors
      if (!data?.success) {
        const errorMessage = data?.error || "Erro ao criar conta. Tente novamente.";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Check if registration is pending (Alcateia flow)
      if (data?.pending) {
        setIsSuccess(true);
        setIsPendingApproval(true);
        toast.success("Solicitação enviada! Aguarde aprovação.");
        return;
      }

      // Fallback for immediate access (shouldn't happen for Alcateia)
      setIsSuccess(true);
      toast.success("Conta criada com sucesso! Bem-vindo à Alcateia!");
      
      // Auto-login the user with retry
      const attemptLogin = async (retries = 3): Promise<boolean> => {
        for (let i = 0; i < retries; i++) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.ownerEmail.trim().toLowerCase(),
            password: formData.password,
          });
          
          if (!signInError) {
            return true;
          }
          
          console.warn(`Login attempt ${i + 1} failed:`, signInError);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        return false;
      };

      setTimeout(async () => {
        const loginSuccess = await attemptLogin();
        if (loginSuccess) {
          navigate("/dashboard");
        } else {
          console.error("All login attempts failed");
          toast.error("Login automático falhou. Por favor, faça login manualmente.");
          navigate("/auth");
        }
      }, 1500);
      
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen - Pending Approval (Alcateia)
  if (isSuccess && isPendingApproval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="border-amber-300 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center animate-fade-in-scale">
                <Clock className="w-12 h-12 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Solicitação Recebida! 🐺</CardTitle>
              <CardDescription className="text-base">
                Seu pedido de acesso vitalício foi enviado para aprovação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Registration Details */}
              <div className="bg-amber-50 rounded-xl p-4 space-y-3 border border-amber-200">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Agência</p>
                    <p className="font-medium">{formData.agencyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="font-medium">{formData.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{formData.ownerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Pending Approval Info */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Aguardando Aprovação</p>
                    <p className="text-sm text-white/90">
                      Seu acesso será liberado em até 24 horas.
                    </p>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="bg-white border border-amber-200 rounded-lg p-4 space-y-3">
                <p className="font-medium text-sm text-foreground">O que acontece agora?</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Vamos verificar sua solicitação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Você receberá um email com os dados de acesso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>Prazo máximo: 24 horas úteis</span>
                  </li>
                </ul>
              </div>

              {/* Back to home */}
              <Link to="/alcateia">
                <Button variant="outline" className="w-full border-amber-300 hover:bg-amber-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para a página inicial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success Screen - Immediate access (fallback, shouldn't happen for Alcateia)
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="border-amber-300 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center animate-fade-in-scale">
                <Crown className="w-12 h-12 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Bem-vindo à Alcateia! 🐺</CardTitle>
              <CardDescription className="text-base">
                Seu acesso vitalício foi ativado com sucesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Registration Details */}
              <div className="bg-amber-50 rounded-xl p-4 space-y-3 border border-amber-200">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Agência</p>
                    <p className="font-medium">{formData.agencyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="font-medium">{formData.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{formData.ownerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Lifetime Access Info */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-3">
                  <Infinity className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Acesso Vitalício Ativado!</p>
                    <p className="text-sm text-white/90">
                      Você agora é um membro fundador do GBRank CRM.
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Entrando no sistema...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: Benefits */}
        <div className="hidden lg:block space-y-8 pr-8">
          <div>
            <Link to="/alcateia" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div className="flex items-center gap-3 mb-6">
              <img src={alcateiaLogo} alt="Alcateia" className="h-12" />
              <span className="text-amber-500 font-bold text-xl">×</span>
              <img src={grankLogoDark} alt="GRank" className="h-10" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Acesso Vitalício Alcateia
            </h1>
            <p className="text-muted-foreground text-lg">
              Você está prestes a se tornar um membro fundador do GRank CRM.
            </p>
          </div>

          {/* Exclusive Benefits */}
          <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-5 border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-foreground">O que você ganha:</span>
            </div>
            <ul className="space-y-3">
              {[
                { icon: Infinity, text: "Acesso vitalício — sem mensalidade, nunca" },
                { icon: Crown, text: "Status de membro fundador" },
                { icon: Sparkles, text: "Todas as funcionalidades desbloqueadas" },
                { icon: User, text: "Suporte direto no grupo da Alcateia" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-amber-700" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200">
            <p className="text-sm text-muted-foreground italic">
              "Vocês fazem parte da construção do GRank. Por isso, vocês ficam para sempre."
            </p>
            <p className="text-xs text-amber-600 mt-2 font-medium">— João Lobo</p>
          </div>
        </div>

        {/* Right: Form */}
        <Card className="border-amber-200 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 lg:hidden mb-2">
              <img src={alcateiaLogo} alt="Alcateia" className="h-10" />
              <span className="text-amber-500 font-bold">×</span>
              <img src={grankLogoDark} alt="GRank" className="h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                <Crown className="w-4 h-4" />
                Acesso Vitalício
              </div>
              <CardTitle className="text-2xl">Crie Sua Conta</CardTitle>
              <CardDescription className="text-base mt-2">
                Acesso imediato. Sem mensalidade. Para sempre.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agency Name */}
              <div className="space-y-2">
                <Label htmlFor="agencyName" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Nome da Agência *
                </Label>
                <Input
                  id="agencyName"
                  placeholder="Ex: Agência Digital XYZ"
                  value={formData.agencyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                  disabled={isLoading}
                  className={errors.agencyName ? "border-destructive" : "focus:border-amber-500"}
                />
                {errors.agencyName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.agencyName}
                  </p>
                )}
              </div>

              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="ownerName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  Seu Nome Completo *
                </Label>
                <Input
                  id="ownerName"
                  placeholder="Ex: João Silva"
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  disabled={isLoading}
                  className={errors.ownerName ? "border-destructive" : "focus:border-amber-500"}
                />
                {errors.ownerName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.ownerName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="ownerEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600" />
                  Email *
                </Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  disabled={isLoading}
                  className={errors.ownerEmail ? "border-destructive" : "focus:border-amber-500"}
                />
                {errors.ownerEmail && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.ownerEmail}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="ownerPhone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-600" />
                  WhatsApp (opcional)
                </Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                  disabled={isLoading}
                  className={errors.ownerPhone ? "border-destructive" : "focus:border-amber-500"}
                />
                {errors.ownerPhone && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.ownerPhone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isLoading}
                    className={errors.password ? "border-destructive pr-10" : "pr-10 focus:border-amber-500"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Confirmar Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    disabled={isLoading}
                    className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10 focus:border-amber-500"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    GARANTIR ACESSO VITALÍCIO
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/auth" className="text-amber-600 hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
