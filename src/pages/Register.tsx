import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Sparkles,
  Users,
  Target,
  BarChart3,
  Clock,
  ArrowRight,
} from "lucide-react";
import grankLogo from "@/assets/grank-logo.png";

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
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    agencyName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
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

      // Insert pending registration
      const { error } = await supabase
        .from("pending_registrations")
        .insert({
          agency_name: formData.agencyName.trim(),
          agency_slug: slug,
          owner_name: formData.ownerName.trim(),
          owner_email: formData.ownerEmail.trim().toLowerCase(),
          owner_phone: formData.ownerPhone?.trim() || null,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe uma solicitação com esse nome de agência ou email");
        } else {
          console.error("Registration error:", error);
          toast.error("Erro ao enviar solicitação: " + error.message);
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Solicitação enviada com sucesso!");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="border-primary/20 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-fade-in-scale">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Solicitação Enviada!</CardTitle>
              <CardDescription className="text-base">
                Sua solicitação de cadastro foi recebida com sucesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Registration Details */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/50">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Agência</p>
                    <p className="font-medium">{formData.agencyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável</p>
                    <p className="font-medium">{formData.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{formData.ownerEmail}</p>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Próximos Passos
                </h3>
                <div className="space-y-2">
                  {[
                    { step: 1, text: "Nossa equipe irá analisar sua solicitação" },
                    { step: 2, text: "Você receberá um email com suas credenciais" },
                    { step: 3, text: "Acesse o sistema e configure sua agência" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {step}
                      </div>
                      <span className="text-muted-foreground">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="bg-status-info/10 rounded-lg p-3 border border-status-info/20">
                <p className="text-sm text-status-info flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    <strong>Tempo estimado:</strong> até 24 horas úteis
                  </span>
                </p>
              </div>

              {/* Action Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate("/auth")}
              >
                Ir para Login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: Features */}
        <div className="hidden lg:block space-y-8 pr-8">
          <div>
            <img
              src={grankLogo}
              alt="G-Rank CRM"
              className="h-16 object-contain mb-6"
            />
            <h1 className="text-3xl font-bold text-foreground mb-3">
              CRM completo para sua agência
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie leads, clientes e entregas em uma única plataforma inteligente.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Target, title: "Funil de Vendas", description: "Pipeline visual para acompanhar cada lead" },
              { icon: Users, title: "Gestão de Clientes", description: "Kanban de entregas com checklist completo" },
              { icon: Sparkles, title: "Agentes de IA", description: "Análises automáticas de SEO e recuperação" },
              { icon: BarChart3, title: "Relatórios", description: "Métricas e insights para gestores" },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-surface-2/50 border border-border/30">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <Card className="border-primary/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <img
              src={grankLogo}
              alt="G-Rank CRM"
              className="h-12 mx-auto object-contain lg:hidden"
            />
            <div>
              <CardTitle className="text-2xl">Cadastre sua Agência</CardTitle>
              <CardDescription className="text-base mt-2">
                Preencha os dados abaixo para solicitar acesso ao sistema.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Agency Name */}
              <div className="space-y-2">
                <Label htmlFor="agencyName" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Nome da Agência *
                </Label>
                <Input
                  id="agencyName"
                  placeholder="Ex: Agência Digital XYZ"
                  value={formData.agencyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                  disabled={isLoading}
                  className={errors.agencyName ? "border-destructive" : ""}
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
                  <User className="w-4 h-4 text-primary" />
                  Seu Nome Completo *
                </Label>
                <Input
                  id="ownerName"
                  placeholder="Ex: João Silva"
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  disabled={isLoading}
                  className={errors.ownerName ? "border-destructive" : ""}
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
                  <Mail className="w-4 h-4 text-primary" />
                  Email *
                </Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  disabled={isLoading}
                  className={errors.ownerEmail ? "border-destructive" : ""}
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
                  <Phone className="w-4 h-4 text-primary" />
                  WhatsApp (opcional)
                </Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                  disabled={isLoading}
                  className={errors.ownerPhone ? "border-destructive" : ""}
                />
                {errors.ownerPhone && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.ownerPhone}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Solicitar Cadastro
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate("/auth")}
                >
                  Fazer Login
                </Button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
