import { useState } from "react";
import {
  Crown,
  Eye,
  Settings,
  Briefcase,
  HeadphonesIcon,
  MoreVertical,
  Trash2,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/clientUtils";
import { TeamMember } from "@/hooks/useTeamPermissions";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface TeamMemberCardProps {
  member: TeamMember;
  canAssignRoles: boolean;
  canRemove: boolean;
  isCurrentUser: boolean;
  onRoleChange: (userId: string, newRole: AppRole) => void;
  onRemove: (memberId: string) => void;
}

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

const roleColors: Record<AppRole, string> = {
  super_admin: "bg-destructive/20 text-destructive border-destructive/30",
  owner: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  admin: "bg-primary/20 text-primary border-primary/30",
  manager: "bg-warning/20 text-warning border-warning/30",
  sales_rep: "bg-green-500/20 text-green-500 border-green-500/30",
  operador: "bg-status-info/20 text-status-info border-status-info/30",
  support: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  visualizador: "bg-muted text-muted-foreground border-border/30",
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  super_admin: <Crown className="w-3 h-3" />,
  owner: <Crown className="w-3 h-3" />,
  admin: <Shield className="w-3 h-3" />,
  manager: <Settings className="w-3 h-3" />,
  sales_rep: <Briefcase className="w-3 h-3" />,
  operador: <Settings className="w-3 h-3" />,
  support: <HeadphonesIcon className="w-3 h-3" />,
  visualizador: <Eye className="w-3 h-3" />,
};

const statusColors: Record<string, string> = {
  ativo: "bg-status-success/20 text-status-success",
  suspenso: "bg-status-warning/20 text-status-warning",
  excluido: "bg-status-danger/20 text-status-danger",
};

export default function TeamMemberCard({
  member,
  canAssignRoles,
  canRemove,
  isCurrentUser,
  onRoleChange,
  onRemove,
}: TeamMemberCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const role = member.app_role || "visualizador";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(member.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{member.full_name}</span>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  Você
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="outline"
                className={`${statusColors[member.status] || statusColors.ativo} text-xs`}
              >
                {member.status === "ativo" ? "Ativo" : member.status === "suspenso" ? "Suspenso" : "Excluído"}
              </Badge>
              {member.last_login && (
                <span className="text-xs">
                  Último acesso: {formatDateTime(member.last_login)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canAssignRoles && !isCurrentUser ? (
            <Select
              value={role}
              onValueChange={(value) => onRoleChange(member.user_id, value as AppRole)}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {roleIcons[role]}
                    <span>{roleLabels[role]}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
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
          ) : (
            <Badge
              variant="outline"
              className={`${roleColors[role]} flex items-center gap-1.5`}
            >
              {roleIcons[role]}
              {roleLabels[role]}
            </Badge>
          )}

          {canRemove && !isCurrentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowRemoveDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover da equipe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{member.full_name}</strong> da equipe?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onRemove(member.id)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
