import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface FinancialProjectionProps {
  title: string;
  description?: string;
  data: { month: string; valor: number; projecao?: number }[];
  currency?: boolean;
}

export const FinancialProjection = ({
  title,
  description,
  data,
  currency = true,
}: FinancialProjectionProps) => {
  const formatValue = (value: number) => {
    if (!currency) return value.toLocaleString("pt-BR");
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
  };

  const lastActual = data.filter((d) => d.valor > 0).pop();
  const lastProjection = data.filter((d) => d.projecao).pop();
  
  const growth = lastActual && lastProjection && lastActual.valor > 0
    ? (((lastProjection.projecao || 0) - lastActual.valor) / lastActual.valor) * 100
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {growth > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-500">+{growth.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">crescimento projetado</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) =>
                  currency ? `R$ ${(value / 1000).toFixed(0)}k` : value.toString()
                }
              />
              <Tooltip
                formatter={(value: number) => [formatValue(value), ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValor)"
                strokeWidth={2}
                name="Realizado"
              />
              <Area
                type="monotone"
                dataKey="projecao"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorProjecao)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Projeção"
              />
              {lastActual && (
                <ReferenceLine
                  x={lastActual.month}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: "Hoje", position: "top", fontSize: 10 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
