import { useMemo } from "react";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Package,
  Users,
  Building2,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, getDaysSinceUpdate } from "@/lib/clientUtils";
import { Client } from "@/types/client";
import { cn } from "@/lib/utils";
import { UsageOverview } from "@/components/UsageOverview";
import { DayAgenda } from "@/components/DayAgenda";

// Simple funnel row
function FunnelRow({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string; 
  count: number; 
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <Badge variant="secondary" className="font-mono min-w-[32px] justify-center">
        {count}
      </Badge>
    </div>
  );
}

/**
 * ManagerOverview - Simplified for operators
 * Shows basic funnel status and immediate action items
 */
export function ManagerOverview() {
  const { clients, setSelectedClient, setDetailOpen } = useClientStore();

  // Active clients (not delivered/finalized)
  const activeClients = useMemo(() => 
    clients.filter(c => !["delivered", "finalized"].includes(c.columnId)),
    [clients]
  );

  // Stalled clients (2+ days without update)
  const stalledClients = useMemo(() => 
    activeClients
      .map(c => ({ ...c, daysSinceUpdate: getDaysSinceUpdate(c.lastUpdate) }))
      .filter(c => c.daysSinceUpdate >= 2 && c.columnId !== "suspended")
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
      .slice(0, 5),
    [activeClients]
  );

  // Ready to deliver
  const readyToDeliver = useMemo(() => 
    clients.filter(c => c.columnId === "ready_to_deliver"),
    [clients]
  );

  // Delivered this month
  const deliveredThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return clients.filter(c => 
      c.columnId === "delivered" && 
      new Date(c.lastUpdate) >= monthStart
    ).length;
  }, [clients]);

  // Clients by column
  const clientsByColumn = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      if (!["delivered", "finalized", "suspended"].includes(c.columnId)) {
        counts[c.columnId] = (counts[c.columnId] || 0) + 1;
      }
    });
    return counts;
  }, [clients]);

  // Average progress
  const avgProgress = useMemo(() => {
    if (activeClients.length === 0) return 0;
    const sum = activeClients.reduce((acc, c) => acc + calculateProgress(c), 0);
    return Math.round(sum / activeClients.length);
  }, [activeClients]);

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setDetailOpen(true);
  };

  const COLUMN_CONFIG = [
    { id: 'onboarding', label: 'Onboarding', color: 'bg-blue-500' },
    { id: 'optimization', label: 'Otimização', color: 'bg-amber-500' },
    { id: 'ready_to_deliver', label: 'Pronto p/ Entregar', color: 'bg-cyan-500' },
  ];

  const totalActive = Object.values(clientsByColumn).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Day Agenda - Urgent Actions + Calendar */}
      <DayAgenda />
      {/* Quick Stats - Simplified */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Ativos</p>
                <p className="text-lg font-bold font-mono text-primary">{activeClients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("glass-card", stalledClients.length > 0 ? "border-status-warning/30" : "border-muted/20")}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", stalledClients.length > 0 ? "bg-status-warning/10" : "bg-muted/10")}>
                <AlertTriangle className={cn("h-4 w-4", stalledClients.length > 0 ? "text-status-warning" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Parados</p>
                <p className={cn("text-lg font-bold font-mono", stalledClients.length > 0 ? "text-status-warning" : "text-muted-foreground")}>
                  {stalledClients.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-cyan-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Package className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Prontos</p>
                <p className="text-lg font-bold font-mono text-cyan-400">{readyToDeliver.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-status-success/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-status-success/10">
                <CheckCircle2 className="h-4 w-4 text-status-success" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Entregas (Mês)</p>
                <p className="text-lg font-bold font-mono text-status-success">{deliveredThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Funnel Distribution */}
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Funil de Otimização
              </CardTitle>
              <Badge variant="secondary" className={cn(
                "font-mono",
                avgProgress >= 60 ? "bg-status-success/20 text-status-success" :
                avgProgress >= 30 ? "bg-status-warning/20 text-status-warning" :
                "bg-status-danger/20 text-status-danger"
              )}>
                {avgProgress}% médio
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {COLUMN_CONFIG.map(({ id, label, color }) => (
              <FunnelRow
                key={id}
                label={label}
                count={clientsByColumn[id] || 0}
                total={totalActive}
                color={color}
              />
            ))}
          </CardContent>
        </Card>

        {/* Action Items */}
        <div className="space-y-4">
          {/* Stalled Clients */}
          {stalledClients.length > 0 && (
            <Card className="glass-card border-status-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-status-warning">
                  <Clock className="h-4 w-4" />
                  Clientes Parados ({stalledClients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {stalledClients.map((client) => (
                      <div 
                        key={client.id} 
                        onClick={() => handleClientClick(client)}
                        className="flex items-center justify-between p-2 rounded-lg bg-status-warning/5 border border-status-warning/20 cursor-pointer hover:bg-status-warning/10 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium truncate block">{client.companyName}</span>
                          <Progress value={calculateProgress(client)} className="h-1 mt-1 w-24" />
                        </div>
                        <Badge variant="outline" className="text-status-warning border-status-warning/30 text-[10px] shrink-0">
                          {client.daysSinceUpdate}d
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Ready to Deliver */}
          {readyToDeliver.length > 0 && (
            <Card className="glass-card border-cyan-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-cyan-400">
                  <Package className="h-4 w-4" />
                  Prontos para Entregar ({readyToDeliver.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {readyToDeliver.slice(0, 5).map((client) => (
                      <div 
                        key={client.id}
                        onClick={() => handleClientClick(client)}
                        className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 cursor-pointer hover:bg-cyan-500/10 transition-colors"
                      >
                        <span className="text-sm font-medium truncate">{client.companyName}</span>
                        <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* All Clear */}
          {stalledClients.length === 0 && readyToDeliver.length === 0 && (
            <Card className="glass-card border-status-success/30">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-status-success/50" />
                <h3 className="font-semibold text-status-success">Tudo fluindo!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum cliente parado no momento.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Usage Overview - Limites do Plano */}
          <UsageOverview />
        </div>
      </div>
    </div>
  );
}