import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Commission {
  id: string;
  client_name: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  delivered_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface CommissionTimelineProps {
  commissions: Commission[];
  maxItems?: number;
}

export function CommissionTimeline({ commissions, maxItems = 5 }: CommissionTimelineProps) {
  const recentCommissions = commissions.slice(0, maxItems);

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'approved':
        return 2;
      case 'paid':
        return 3;
      default:
        return 0;
    }
  };

  if (recentCommissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhuma comissão ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentCommissions.map((commission) => {
        const step = getStatusStep(commission.status);
        const isCancelled = commission.status === 'cancelled';

        return (
          <div
            key={commission.id}
            className={cn(
              "p-4 rounded-xl border transition-all",
              isCancelled
                ? "border-status-danger/20 bg-status-danger/5 opacity-60"
                : "border-border/30 bg-surface-1/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm truncate flex-1">
                {commission.client_name}
              </span>
              <span className="font-bold text-primary ml-2">
                R$ {Number(commission.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {!isCancelled && (
              <div className="flex items-center gap-1">
                {/* Step 1 - Gerada */}
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      step >= 1
                        ? "bg-status-success text-white"
                        : "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Gerada</span>
                </div>

                <ArrowRight className="w-3 h-3 text-muted-foreground/50 mx-1" />

                {/* Step 2 - Aprovada */}
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      step >= 2
                        ? "bg-blue-500 text-white"
                        : "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    {step >= 2 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Aprovada</span>
                </div>

                <ArrowRight className="w-3 h-3 text-muted-foreground/50 mx-1" />

                {/* Step 3 - Paga */}
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      step >= 3
                        ? "bg-primary text-white"
                        : "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    {step >= 3 ? (
                      <DollarSign className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Paga</span>
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="text-xs text-status-danger">Cancelada</div>
            )}

            <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
              <span>
                {commission.delivered_at
                  ? format(parseISO(commission.delivered_at), "dd/MM/yy", { locale: ptBR })
                  : format(parseISO(commission.created_at), "dd/MM/yy", { locale: ptBR })}
              </span>
              {commission.paid_at && (
                <span className="text-status-success">
                  Pago em {format(parseISO(commission.paid_at), "dd/MM/yy", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
