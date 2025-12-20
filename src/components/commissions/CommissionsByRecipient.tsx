import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Briefcase, Camera, Wrench, PenTool, User, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Commission {
  id: string;
  recipient_name: string;
  recipient_role_id: string | null;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
}

interface CommissionRole {
  id: string;
  label: string;
}

interface CommissionsByRecipientProps {
  commissions: Commission[];
  roles: CommissionRole[];
  getRoleById: (id: string | null) => CommissionRole | undefined;
}

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
    'sdr': "bg-blue-500/20 text-blue-400",
    'vendedor': "bg-amber-500/20 text-amber-400",
    'fotógrafo': "bg-purple-500/20 text-purple-400",
    'operacional': "bg-green-500/20 text-green-400",
    'designer': "bg-pink-500/20 text-pink-400",
    'freelancer': "bg-cyan-500/20 text-cyan-400",
    'avulso': "bg-gray-500/20 text-gray-400",
  };
  return colorMap[normalizedLabel] || "bg-muted/20 text-muted-foreground";
};

export function CommissionsByRecipient({ commissions, roles, getRoleById }: CommissionsByRecipientProps) {
  const byRecipient = useMemo(() => {
    const groups: Record<string, {
      name: string;
      roleLabel: string;
      total: number;
      pending: number;
      paid: number;
      count: number;
    }> = {};

    commissions.forEach(c => {
      if (c.status === 'cancelled') return;
      
      if (!groups[c.recipient_name]) {
        const role = getRoleById(c.recipient_role_id);
        groups[c.recipient_name] = {
          name: c.recipient_name,
          roleLabel: role?.label || 'Outro',
          total: 0,
          pending: 0,
          paid: 0,
          count: 0,
        };
      }
      
      groups[c.recipient_name].total += Number(c.amount);
      groups[c.recipient_name].count += 1;
      
      if (c.status === 'pending' || c.status === 'approved') {
        groups[c.recipient_name].pending += Number(c.amount);
      } else if (c.status === 'paid') {
        groups[c.recipient_name].paid += Number(c.amount);
      }
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [commissions, getRoleById]);

  const maxTotal = Math.max(...byRecipient.map(r => r.total), 1);

  if (byRecipient.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhum comissionado encontrado</p>
      </div>
    );
  }

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Comissões por Colaborador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {byRecipient.map((recipient) => {
          const RoleIcon = getRoleIcon(recipient.roleLabel);
          const paidPercent = recipient.total > 0 ? (recipient.paid / recipient.total) * 100 : 0;

          return (
            <div key={recipient.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", getRoleColor(recipient.roleLabel))}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{recipient.name}</span>
                    <Badge variant="outline" className="ml-2 text-[9px] py-0">
                      {recipient.roleLabel}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">
                    R$ {recipient.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <div className="text-[10px] text-muted-foreground">
                    {recipient.count} comissões
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Progress 
                  value={(recipient.total / maxTotal) * 100} 
                  className="h-1.5 bg-muted/20" 
                />
                <div 
                  className="absolute top-0 left-0 h-1.5 bg-status-success rounded-full"
                  style={{ width: `${(recipient.paid / maxTotal) * 100}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-status-success">
                  R$ {recipient.paid.toLocaleString("pt-BR")} pago ({paidPercent.toFixed(0)}%)
                </span>
                {recipient.pending > 0 && (
                  <span className="text-status-warning">
                    R$ {recipient.pending.toLocaleString("pt-BR")} pendente
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
