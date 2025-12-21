import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelChartProps {
  title: string;
  data: { name: string; value: number; color: string }[];
  showLegend?: boolean;
}

export function FunnelPieChart({ title, data, showLegend = true }: FunnelChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Sem dados para exibir
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, "Total"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            {showLegend && (
              <Legend 
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Leads funnel chart
export function LeadsFunnelChart({ byStage }: { byStage: Record<string, number> }) {
  const data = [
    { name: "Novo", value: byStage.novo || 0, color: "#8b5cf6" },
    { name: "Contato", value: byStage.contato_inicial || 0, color: "#6366f1" },
    { name: "Qualificação", value: byStage.qualificacao || 0, color: "#3b82f6" },
    { name: "Apresentação", value: byStage.apresentacao || 0, color: "#0ea5e9" },
    { name: "Proposta", value: byStage.proposta || 0, color: "#14b8a6" },
    { name: "Negociação", value: byStage.negociacao || 0, color: "#22c55e" },
    { name: "Fechamento", value: byStage.fechamento || 0, color: "#84cc16" },
    { name: "Ganho", value: byStage.ganho || 0, color: "#10b981" },
    { name: "Perdido", value: byStage.perdido || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return <FunnelPieChart title="Funil de Leads" data={data} />;
}

// Temperature chart
export function TemperatureChart({ byTemperature }: { byTemperature: Record<string, number> }) {
  const data = [
    { name: "Frio", value: byTemperature.frio || 0, color: "#3b82f6" },
    { name: "Morno", value: byTemperature.morno || 0, color: "#f59e0b" },
    { name: "Quente", value: byTemperature.quente || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return <FunnelPieChart title="Temperatura dos Leads" data={data} />;
}

// Proposals chart
export function ProposalsStatusChart({ draft, sent, viewed, accepted, rejected, expired }: {
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
  expired: number;
}) {
  const data = [
    { name: "Rascunho", value: draft, color: "#6b7280" },
    { name: "Enviadas", value: sent, color: "#3b82f6" },
    { name: "Visualizadas", value: viewed, color: "#8b5cf6" },
    { name: "Aceitas", value: accepted, color: "#10b981" },
    { name: "Recusadas", value: rejected, color: "#ef4444" },
    { name: "Expiradas", value: expired, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  return <FunnelPieChart title="Status das Propostas" data={data} />;
}

// Contracts chart
export function ContractsTypeChart({ recurring, oneTime }: { recurring: number; oneTime: number }) {
  const data = [
    { name: "Recorrente", value: recurring, color: "#8b5cf6" },
    { name: "Avulso", value: oneTime, color: "#3b82f6" },
  ].filter(d => d.value > 0);

  return <FunnelPieChart title="Tipo de Contrato" data={data} />;
}

// Projects chart
export function ProjectsColumnChart({ byColumn }: { byColumn: Record<string, number> }) {
  const data = [
    { name: "Onboarding", value: byColumn.onboarding || 0, color: "#8b5cf6" },
    { name: "Briefing", value: byColumn.briefing || 0, color: "#6366f1" },
    { name: "Em Progresso", value: byColumn.in_progress || 0, color: "#3b82f6" },
    { name: "Revisão", value: byColumn.review || 0, color: "#f59e0b" },
    { name: "Pronto", value: byColumn.ready_to_deliver || 0, color: "#22c55e" },
    { name: "Entregue", value: byColumn.delivered || 0, color: "#10b981" },
    { name: "Finalizado", value: byColumn.finalized || 0, color: "#6b7280" },
  ].filter(d => d.value > 0);

  return <FunnelPieChart title="Projetos por Etapa" data={data} />;
}
