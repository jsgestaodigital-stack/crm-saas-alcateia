import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileCheck, 
  Calendar,
  Users,
  Briefcase,
  Camera,
  Wrench,
  PenTool,
  User,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Commission {
  id: string;
  client_name: string;
  amount: number;
  description: string;
  recipient_name: string;
  recipient_role_id: string | null;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  delivered_at: string | null;
  paid_at: string | null;
}

interface CommissionCardProps {
  commission: Commission;
  roleLabel: string;
  isAdmin?: boolean;
  onApprove?: () => void;
  onMarkAsPaid?: () => void;
  onCancel?: () => void;
  onClick?: () => void;
}

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-status-warning/20 text-status-warning border-status-warning/30", icon: Clock },
  approved: { label: "Aprovado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: FileCheck },
  paid: { label: "Pago", color: "bg-status-success/20 text-status-success border-status-success/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-status-danger/20 text-status-danger border-status-danger/30", icon: XCircle },
};

const ROLE_ICON_MAP: Record<string, any> = {
  'sdr': Users,
  'vendedor': Briefcase,
  'fotógrafo': Camera,
  'operacional': Wrench,
  'designer': PenTool,
  'freelancer': User,
  'avulso': Package,
};

const getRoleIcon = (label: string) => {
  const normalizedLabel = label.toLowerCase();
  return ROLE_ICON_MAP[normalizedLabel] || User;
};

const getRoleColor = (label: string): string => {
  const normalizedLabel = label.toLowerCase();
  const colorMap: Record<string, string> = {
    'sdr': "bg-blue-500/20 text-blue-400 border-blue-500/30",
    'vendedor': "bg-amber-500/20 text-amber-400 border-amber-500/30",
    'fotógrafo': "bg-purple-500/20 text-purple-400 border-purple-500/30",
    'operacional': "bg-green-500/20 text-green-400 border-green-500/30",
    'designer': "bg-pink-500/20 text-pink-400 border-pink-500/30",
    'freelancer': "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    'avulso': "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return colorMap[normalizedLabel] || "bg-muted/20 text-muted-foreground border-muted/30";
};

export function CommissionCard({ 
  commission, 
  roleLabel, 
  isAdmin = false,
  onApprove, 
  onMarkAsPaid, 
  onCancel, 
  onClick 
}: CommissionCardProps) {
  const statusConfig = STATUS_CONFIG[commission.status];
  const StatusIcon = statusConfig.icon;
  const RoleIcon = getRoleIcon(roleLabel);

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        onClick ? "cursor-pointer hover:bg-surface-2/50" : "",
        commission.status === 'cancelled' 
          ? "border-status-danger/20 bg-status-danger/5 opacity-70"
          : "border-border/30 bg-surface-1/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-semibold text-sm truncate">{commission.client_name}</span>
            <Badge className={cn("border text-[10px]", statusConfig.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge variant="outline" className={cn("text-[10px]", getRoleColor(roleLabel))}>
              <RoleIcon className="w-3 h-3 mr-1" />
              {roleLabel}
            </Badge>
            <span>{commission.recipient_name}</span>
            <span>•</span>
            <span className="truncate">{commission.description}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-primary text-base">
              R$ {Number(commission.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            {commission.delivered_at && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(commission.delivered_at), "dd/MM/yy", { locale: ptBR })}
              </span>
            )}
            {commission.paid_at && (
              <span className="text-status-success flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Pago {format(parseISO(commission.paid_at), "dd/MM/yy", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {commission.status === "pending" && onApprove && (
              <Button size="sm" variant="outline" onClick={onApprove} className="h-8 text-xs">
                Aprovar
              </Button>
            )}
            {commission.status === "approved" && onMarkAsPaid && (
              <Button 
                size="sm" 
                onClick={onMarkAsPaid} 
                className="h-8 text-xs bg-status-success hover:bg-status-success/90"
              >
                Pagar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
