import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  ArrowLeft,
  Filter,
  Crown,
  Shield,
  Settings,
  Briefcase,
  HeadphonesIcon,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import TeamMemberCard from "@/components/team/TeamMemberCard";
import InviteMemberDialog from "@/components/team/InviteMemberDialog";
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

const roleIcons: Record<AppRole, React.ReactNode> = {
  super_admin: <Crown className="w-4 h-4" />,
  owner: <Crown className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
  manager: <Settings className="w-4 h-4" />,
  sales_rep: <Briefcase className="w-4 h-4" />,
  operador: <Settings className="w-4 h-4" />,
  support: <HeadphonesIcon className="w-4 h-4" />,
  visualizador: <Eye className="w-4 h-4" />,
};

export default function Equipe() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, derived } = useAuth();
  const {
    myRole,
    members,
    isLoading,
    assignRole,
    removeMember,
    refetchMembers,
    canManageTeam,
    canAssignRoles,
  } = useTeamPermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  // Filter members
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((member) => {
      const matchesSearch = member.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === "all" || member.app_role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  // Count by role
  const roleCounts = useMemo(() => {
    if (!members) return {};
    return members.reduce((acc, member) => {
      const role = member.app_role || "visualizador";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [members]);

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    assignRole.mutate({ targetUserId: userId, newRole });
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(memberId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Equipe</h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os membros da sua agência
                  </p>
                </div>
              </div>
            </div>

            {canManageTeam && (
              <InviteMemberDialog onSuccess={refetchMembers} />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <div
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              roleFilter === "all"
                ? "bg-primary/10 border-primary"
                : "bg-card border-border hover:border-primary/50"
            }`}
            onClick={() => setRoleFilter("all")}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Todos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{members?.length || 0}</p>
          </div>

          {Object.entries(roleLabels).map(([role, label]) => {
            const count = roleCounts[role] || 0;
            if (count === 0) return null;
            return (
              <div
                key={role}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  roleFilter === role
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
                onClick={() => setRoleFilter(role)}
              >
                <div className="flex items-center gap-2">
                  {roleIcons[role as AppRole]}
                  <span className="text-sm font-medium truncate">{label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              {Object.entries(roleLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {roleIcons[key as AppRole]}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Members list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum membro encontrado</h3>
            <p className="text-muted-foreground">
              {searchQuery || roleFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Adicione membros à sua equipe"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                canAssignRoles={canAssignRoles}
                canRemove={canManageTeam}
                isCurrentUser={member.user_id === user?.id}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {/* Current role indicator */}
        {myRole && (
          <div className="fixed bottom-4 right-4">
            <Badge variant="outline" className="bg-background/95 backdrop-blur">
              Seu role: {roleLabels[myRole]}
            </Badge>
          </div>
        )}
      </main>
    </div>
  );
}
