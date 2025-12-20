import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Commission {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  created_at: string;
  delivered_at: string | null;
}

interface CommissionForecastProps {
  commissions: Commission[];
  showMonthlyBreakdown?: boolean;
}

export function CommissionForecast({ commissions, showMonthlyBreakdown = true }: CommissionForecastProps) {
  const forecast = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Pending commissions = forecast
    const pendingTotal = commissions
      .filter(c => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    // This month paid
    const thisMonthPaid = commissions
      .filter(c => {
        if (c.status !== 'paid') return false;
        const date = c.delivered_at ? parseISO(c.delivered_at) : parseISO(c.created_at);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, c) => sum + Number(c.amount), 0);

    // Last 3 months average for projection
    const monthlyData: { month: Date; total: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = startOfMonth(addMonths(now, -i));
      const monthEnd = endOfMonth(addMonths(now, -i));
      
      const monthTotal = commissions
        .filter(c => {
          if (c.status === 'cancelled') return false;
          const date = c.delivered_at ? parseISO(c.delivered_at) : parseISO(c.created_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

      monthlyData.push({ month: monthStart, total: monthTotal });
    }

    const averageMonthly = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length
      : 0;

    // Next 3 months projection
    const projectedMonths: { month: Date; projected: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      projectedMonths.push({
        month: addMonths(now, i),
        projected: averageMonthly,
      });
    }

    return {
      pendingTotal,
      thisMonthPaid,
      averageMonthly,
      monthlyData,
      projectedMonths,
      totalProjected: projectedMonths.reduce((sum, m) => sum + m.projected, 0),
    };
  }, [commissions]);

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Previsão Financeira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current pending */}
        <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-status-warning" />
              <span className="text-sm font-medium">A Pagar</span>
            </div>
            <span className="text-lg font-bold text-status-warning">
              R$ {forecast.pendingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Comissões pendentes e aprovadas
          </p>
        </div>

        {/* Average */}
        <div className="p-3 rounded-lg bg-surface-1/50 border border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Média mensal (3 meses)</span>
            <span className="text-sm font-semibold">
              R$ {forecast.averageMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {showMonthlyBreakdown && (
          <>
            {/* Past months */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Histórico
              </span>
              {forecast.monthlyData.map((month) => (
                <div
                  key={month.month.toISOString()}
                  className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm capitalize">
                      {format(month.month, "MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    R$ {month.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            {/* Projected months */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projeção
              </span>
              {forecast.projectedMonths.map((month) => (
                <div
                  key={month.month.toISOString()}
                  className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-sm capitalize">
                      {format(month.month, "MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    ~R$ {month.projected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}

              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Projetado (3 meses)</span>
                  <span className="text-lg font-bold text-primary">
                    R$ {forecast.totalProjected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
