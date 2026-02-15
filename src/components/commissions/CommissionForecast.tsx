import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";

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

    const pendingTotal = commissions
      .filter(c => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const thisMonthPaid = commissions
      .filter(c => {
        if (c.status !== 'paid') return false;
        const date = c.delivered_at ? parseISO(c.delivered_at) : parseISO(c.created_at);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, c) => sum + Number(c.amount), 0);

    // Last 6 months for chart
    const monthlyData: { month: Date; paid: number; projected: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(addMonths(now, -i));
      const monthEnd = endOfMonth(addMonths(now, -i));
      
      const monthPaid = commissions
        .filter(c => {
          if (c.status !== 'paid') return false;
          const date = c.delivered_at ? parseISO(c.delivered_at) : parseISO(c.created_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const monthTotal = commissions
        .filter(c => {
          if (c.status === 'cancelled') return false;
          const date = c.delivered_at ? parseISO(c.delivered_at) : parseISO(c.created_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

      monthlyData.push({
        month: monthStart,
        paid: monthPaid,
        projected: monthTotal,
        label: format(monthStart, "MMM", { locale: ptBR }),
      });
    }

    const averageMonthly = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.projected, 0) / monthlyData.length
      : 0;

    const projectedMonths: { month: Date; projected: number; label: string }[] = [];
    for (let i = 1; i <= 3; i++) {
      const m = addMonths(now, i);
      projectedMonths.push({
        month: m,
        projected: averageMonthly,
        label: format(m, "MMM", { locale: ptBR }),
      });
    }

    const chartData = [
      ...monthlyData.map(m => ({
        name: m.label,
        Pago: m.paid,
        Projetado: m.projected,
      })),
      ...projectedMonths.map(m => ({
        name: m.label,
        Pago: 0,
        Projetado: m.projected,
      })),
    ];

    return {
      pendingTotal,
      thisMonthPaid,
      averageMonthly,
      projectedMonths,
      totalProjected: projectedMonths.reduce((sum, m) => sum + m.projected, 0),
      chartData,
    };
  }, [commissions]);

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

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

        {/* Bar Chart - Projected vs Paid */}
        {forecast.chartData.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Pago vs Projetado (6 meses + projeção)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={forecast.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Pago" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Projetado" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Projetado" stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Average */}
        <div className="p-3 rounded-lg bg-surface-1/50 border border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Média mensal (6 meses)</span>
            <span className="text-sm font-semibold">
              R$ {forecast.averageMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {showMonthlyBreakdown && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Projeção 3 meses
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
        )}
      </CardContent>
    </Card>
  );
}
