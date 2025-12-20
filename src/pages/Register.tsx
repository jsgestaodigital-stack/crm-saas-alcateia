import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Building2, User, Mail, Phone, CheckCircle, Loader2 } from "lucide-react";
import rankeiaLogo from "@/assets/rankeia-logo.png";

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
  });

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
    setIsLoading(true);

    try {
      // Validações
      if (!formData.agencyName.trim() || !formData.ownerName.trim() || !formData.ownerEmail.trim()) {
        toast.error("Preencha todos os campos obrigatórios");
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.ownerEmail)) {
        toast.error("Email inválido");
        setIsLoading(false);
        return;
      }

      const slug = generateSlug(formData.agencyName);

      // Inserir registro pendente (RLS permite INSERT para anon/authenticated)
      const { error } = await supabase
        .from("pending_registrations")
        .insert({
          agency_name: formData.agencyName.trim(),
          agency_slug: slug,
          owner_name: formData.ownerName.trim(),
          owner_email: formData.ownerEmail.trim().toLowerCase(),
          owner_phone: formData.ownerPhone.trim() || null,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe uma solicitação com esse nome de agência");
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Solicitação Enviada!</CardTitle>
            <CardDescription className="text-base">
              Sua solicitação de cadastro foi recebida e está sendo analisada.
              Você receberá um email em <strong>{formData.ownerEmail}</strong> assim que for aprovada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Agência:</strong> {formData.agencyName}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Responsável:</strong> {formData.ownerName}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <img
            src={rankeiaLogo}
            alt="Rankeia Logo"
            className="h-12 mx-auto object-contain"
          />
          <div>
            <CardTitle className="text-2xl">Cadastre sua Agência</CardTitle>
            <CardDescription className="text-base mt-2">
              Preencha os dados abaixo para solicitar acesso ao sistema.
              Após aprovação, você receberá as credenciais por email.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Agência */}
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
                required
              />
            </div>

            {/* Nome do Responsável */}
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
                required
              />
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
                required
              />
            </div>

            {/* Telefone */}
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
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Solicitar Cadastro"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/auth")}
              >
                Fazer Login
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
