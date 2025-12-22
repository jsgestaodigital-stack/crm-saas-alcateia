import { useState } from "react";
import { useSafeBack } from "@/hooks/useSafeBack";
import { ArrowLeft, Shield, Users, Settings, Check, X, Info, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamPermissions, TeamMember } from "@/hooks/useTeamPermissions";
import { usePermissions, permissionLabels, permissionDescriptions, GranularPermissions } from "@/hooks/usePermissions";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  owner: "Dono",
  admin: "Admin",
  manager: "Gerente",
  operador: "Operador",
  sales_rep: "Vendedor",
  support: "Suporte",
  visualizador: "Visualizador",
};

const roleColors: Record<AppRole, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
  owner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  manager: "bg-green-500/10 text-green-500 border-green-500/20",
  operador: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  sales_rep: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  support: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  visualizador: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

// Roles that can be assigned by agency owners/admins
const assignableRoles: AppRole[] = ["admin", "manager", "operador", "sales_rep", "support", "visualizador"];

// Permissions grouped by category
const permissionGroups = {
  "Módulos Principais": ["can_sales", "can_ops", "can_admin", "can_finance", "can_recurring"],
  "Clientes": ["can_edit_clients", "can_delete_clients"],
  "Leads": ["can_view_leads", "can_edit_leads", "can_delete_leads"],
  "Gestão": ["can_manage_team", "can_manage_commissions", "can_manage_settings"],
  "Relatórios e Dados": ["can_view_reports", "can_view_audit_logs", "can_export_data"],
};

export default function AgencyPermissions() {
  const goBack = useSafeBack();
  const { user } = useAuth();
  const { members, isLoading: isLoadingMembers, canAssignRoles, myRole } = useTeamPermissions();
  const { roleTemplates, isLoading: isLoadingTemplates, updateMemberRole, isOwnerOrAdmin } = usePermissions();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Only owners and admins can access this page
  if (!isOwnerOrAdmin && myRole !== "owner" && myRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Apenas donos e administradores da agência podem acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRoleChange = async (memberId: string, userId: string, newRole: AppRole) => {
    await updateMemberRole.mutateAsync({
      targetUserId: userId,
      newRole,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleTemplate = (role: AppRole) => {
    return roleTemplates?.find((t) => t.role === role);
  };

  if (isLoadingMembers || isLoadingTemplates) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={goBack} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Permissões da Equipe
              </h1>
              <p className="text-muted-foreground">
                Gerencie as funções e permissões dos membros da sua agência
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Funções Disponíveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="grid gap-4">
              {members?.map((member) => {
                const isCurrentUser = member.user_id === user?.id;
                const memberRole = member.app_role as AppRole | null;
                const template = memberRole ? getRoleTemplate(memberRole) : null;

                return (
                  <Card 
                    key={member.id} 
                    className={selectedMember?.id === member.id ? "ring-2 ring-primary" : ""}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{member.full_name}</h3>
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">Você</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.status}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          {canAssignRoles && !isCurrentUser && memberRole !== "owner" ? (
                            <Select
                              value={memberRole || ""}
                              onValueChange={(value) => handleRoleChange(member.id, member.user_id, value as AppRole)}
                              disabled={updateMemberRole.isPending}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Selecionar função" />
                              </SelectTrigger>
                              <SelectContent>
                                {assignableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {roleLabels[role]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={memberRole ? roleColors[memberRole] : "bg-muted"}>
                              {memberRole ? roleLabels[memberRole] : "Sem função"}
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Permission details when selected */}
                      {selectedMember?.id === member.id && template && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Permissões da função {roleLabels[memberRole!]}
                          </h4>
                          <div className="space-y-3">
                            {Object.entries(permissionGroups).map(([group, permissions]) => (
                              <div key={group}>
                                <p className="text-xs text-muted-foreground mb-1">{group}</p>
                                <div className="flex flex-wrap gap-1">
                                  {permissions.map((perm) => {
                                    const permKey = perm as keyof GranularPermissions;
                                    const isEnabled = template[permKey as keyof typeof template];
                                    
                                    return (
                                      <TooltipProvider key={perm}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span
                                              className={`
                                                inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs
                                                ${isEnabled 
                                                  ? "bg-green-500/10 text-green-600" 
                                                  : "bg-muted text-muted-foreground"
                                                }
                                              `}
                                            >
                                              {isEnabled ? (
                                                <Check className="h-3 w-3" />
                                              ) : (
                                                <X className="h-3 w-3" />
                                              )}
                                              {permissionLabels[permKey]}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{permissionDescriptions[permKey]}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {(!members || members.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum membro encontrado</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {roleTemplates?.filter(t => assignableRoles.includes(t.role)).map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={roleColors[template.role]}>
                        {roleLabels[template.role]}
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(permissionGroups).map(([group, permissions]) => {
                        const enabledCount = permissions.filter(
                          perm => template[perm as keyof typeof template]
                        ).length;
                        
                        if (enabledCount === 0) return null;

                        return (
                          <div key={group}>
                            <p className="text-xs text-muted-foreground mb-1">{group}</p>
                            <div className="flex flex-wrap gap-1">
                              {permissions.map((perm) => {
                                const permKey = perm as keyof GranularPermissions;
                                const isEnabled = template[permKey as keyof typeof template];
                                
                                if (!isEnabled) return null;

                                return (
                                  <TooltipProvider key={perm}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-600">
                                          <Check className="h-3 w-3" />
                                          {permissionLabels[permKey]}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{permissionDescriptions[permKey]}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Sobre as funções</p>
                    <p className="text-sm text-muted-foreground">
                      As permissões são definidas globalmente pelo administrador do sistema. 
                      Ao alterar a função de um membro, as permissões correspondentes são aplicadas automaticamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
