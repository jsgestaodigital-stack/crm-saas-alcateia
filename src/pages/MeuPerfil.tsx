import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

import { DashboardHeader } from "@/components/DashboardHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Mail, Building2, Phone, Shield, Calendar, Menu } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Validation schema
const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  phone: z.string().trim().max(20, "Telefone muito longo").optional(),
});

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  last_login: string | null;
  created_at: string | null;
}

interface AgencyData {
  id: string;
  name: string;
}

export default function MeuPerfil() {
  const { user, isLoading: authLoading, userRole, permissions, currentAgencyId } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProfileData();
    }
  }, [user, authLoading, navigate]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, status, last_login, created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Erro ao carregar perfil");
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
      }
      
      // Fetch agency if user has one
      if (currentAgencyId) {
        const { data: agencyData } = await supabase
          .from("agencies")
          .select("id, name")
          .eq("id", currentAgencyId)
          .maybeSingle();
        
        if (agencyData) {
          setAgency(agencyData);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate
    const result = profileSchema.safeParse({ full_name: fullName, phone });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Erro ao salvar alterações");
        return;
      }

      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      });

      toast.success("Perfil atualizado com sucesso!");
      fetchProfileData();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const getRoleBadge = () => {
    if (permissions.isSuperAdmin) return <Badge variant="destructive">Super Admin</Badge>;
    if (userRole === "owner") return <Badge className="bg-primary">Proprietário</Badge>;
    if (userRole === "manager") return <Badge className="bg-primary">Gestor</Badge>;
    if (userRole === "operador") return <Badge variant="secondary">Operador</Badge>;
    if (userRole === "sales_rep") return <Badge variant="secondary">Vendedor</Badge>;
    return <Badge variant="outline">Usuário</Badge>;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar 
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <DashboardHeader />
        
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <main className="pt-20 pb-8 px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Meu Perfil</h1>
                <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
              </div>
              {getRoleBadge()}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Avatar Card */}
              <Card className="lg:col-span-1">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-lg">{fullName || "Usuário"}</CardTitle>
                  <CardDescription className="truncate">{user?.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  
                  {agency && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Agência:</span>
                      <span className="font-medium truncate">{agency.name}</span>
                    </div>
                  )}
                  
                  {profile?.last_login && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Último acesso:</span>
                      <span className="font-medium">
                        {format(new Date(profile.last_login), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  
                  {profile?.created_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Membro desde:</span>
                      <span className="font-medium">
                        {format(new Date(profile.created_at), "MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit Form Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Atualize seus dados de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className={errors.full_name ? "border-destructive" : ""}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-destructive">{errors.full_name}</p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      O e-mail não pode ser alterado
                    </p>
                  </div>

                  {/* Phone (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Permissions Summary */}
                  <div className="space-y-3">
                    <Label>Suas Permissões</Label>
                    <div className="flex flex-wrap gap-2">
                      {permissions.canSales && <Badge variant="outline">Vendas</Badge>}
                      {permissions.canOps && <Badge variant="outline">Operações</Badge>}
                      {permissions.canAdmin && <Badge variant="outline">Administração</Badge>}
                      {permissions.canFinance && <Badge variant="outline">Financeiro</Badge>}
                      {permissions.canRecurring && <Badge variant="outline">Recorrência</Badge>}
                      {!permissions.canSales && !permissions.canOps && !permissions.canAdmin && 
                       !permissions.canFinance && !permissions.canRecurring && (
                        <span className="text-sm text-muted-foreground">Permissões básicas</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[150px]">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
