import { useState } from "react";
import { useSafeBack } from "@/hooks/useSafeBack";
import { ArrowLeft, Shield, Users, Check, X, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, permissionLabels, permissionDescriptions, RoleTemplate, GranularPermissions } from "@/hooks/usePermissions";
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

// Permissions grouped by category
const permissionGroups = {
  "Módulos Principais": ["can_sales", "can_ops", "can_admin", "can_finance", "can_recurring"],
  "Clientes": ["can_edit_clients", "can_delete_clients"],
  "Leads": ["can_view_leads", "can_edit_leads", "can_delete_leads"],
  "Gestão": ["can_manage_team", "can_manage_commissions", "can_manage_settings"],
  "Relatórios e Dados": ["can_view_reports", "can_view_audit_logs", "can_export_data"],
};

export default function AdminPermissions() {
  const goBack = useSafeBack();
  const { permissions: authPermissions } = useAuth();
  const { roleTemplates, isLoading, updateRoleTemplate, isSuperAdmin } = usePermissions();
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Partial<GranularPermissions>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Only super admins can access this page
  if (!authPermissions.isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Apenas Super Admins podem acessar esta página.
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

  const handleEditRole = (template: RoleTemplate) => {
    setEditingRole(template.role);
    setEditedPermissions({
      can_sales: template.can_sales,
      can_ops: template.can_ops,
      can_admin: template.can_admin,
      can_finance: template.can_finance,
      can_recurring: template.can_recurring,
      can_view_reports: template.can_view_reports,
      can_edit_clients: template.can_edit_clients,
      can_delete_clients: template.can_delete_clients,
      can_view_leads: template.can_view_leads,
      can_edit_leads: template.can_edit_leads,
      can_delete_leads: template.can_delete_leads,
      can_manage_team: template.can_manage_team,
      can_manage_commissions: template.can_manage_commissions,
      can_view_audit_logs: template.can_view_audit_logs,
      can_export_data: template.can_export_data,
      can_manage_settings: template.can_manage_settings,
    });
  };

  const handleSave = async () => {
    if (!editingRole) return;
    
    setIsSaving(true);
    try {
      await updateRoleTemplate.mutateAsync({
        role: editingRole,
        permissions: editedPermissions,
      });
      setEditingRole(null);
      setEditedPermissions({});
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
    setEditedPermissions({});
  };

  const togglePermission = (permission: keyof GranularPermissions) => {
    setEditedPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
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
                <Shield className="h-6 w-6 text-primary" />
                Gerenciar Permissões
              </h1>
              <p className="text-muted-foreground">
                Configure as permissões padrão para cada função do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Role Templates */}
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Templates de Função
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              {roleTemplates?.map((template) => (
                <Card key={template.id} className={editingRole === template.role ? "ring-2 ring-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={roleColors[template.role]}>
                          {roleLabels[template.role]}
                        </Badge>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {editingRole === template.role ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancel}
                              disabled={isSaving}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={isSaving}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRole(template)}
                            disabled={template.role === "super_admin" || template.role === "owner"}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(permissionGroups).map(([group, permissions]) => (
                        <div key={group}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">{group}</h4>
                          <div className="flex flex-wrap gap-2">
                            {permissions.map((perm) => {
                              const permKey = perm as keyof GranularPermissions;
                              const isEnabled = editingRole === template.role
                                ? editedPermissions[permKey]
                                : template[permKey as keyof RoleTemplate];
                              
                              return (
                                <TooltipProvider key={perm}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`
                                          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                                          transition-colors cursor-default
                                          ${isEnabled 
                                            ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                                            : "bg-muted text-muted-foreground border border-border"
                                          }
                                          ${editingRole === template.role ? "cursor-pointer hover:opacity-80" : ""}
                                        `}
                                        onClick={() => {
                                          if (editingRole === template.role) {
                                            togglePermission(permKey);
                                          }
                                        }}
                                      >
                                        {isEnabled ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <X className="h-3 w-3" />
                                        )}
                                        {permissionLabels[permKey]}
                                      </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Permissões</CardTitle>
                <CardDescription>
                  Visualização comparativa das permissões por função
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Permissão</th>
                        {roleTemplates?.map((t) => (
                          <th key={t.role} className="text-center py-3 px-2">
                            <Badge variant="outline" className={roleColors[t.role]}>
                              {roleLabels[t.role]}
                            </Badge>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(permissionLabels).filter(([key]) => key !== "is_super_admin").map(([key, label]) => (
                        <tr key={key} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2 flex items-center gap-2">
                            {label}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{permissionDescriptions[key as keyof GranularPermissions]}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          {roleTemplates?.map((t) => (
                            <td key={t.role} className="text-center py-2 px-2">
                              {t[key as keyof RoleTemplate] ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
