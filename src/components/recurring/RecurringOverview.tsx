import { useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarCheck, 
  CalendarDays, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRecurring } from '@/hooks/useRecurring';

export function RecurringOverview() {
  const {
    clients,
    stats,
    loading,
    getTodayTasks,
    getOverdueTasks,
    getClientStats,
  } = useRecurring();

  const todayTasks = useMemo(() => getTodayTasks(), [getTodayTasks]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks]);

  // Clients needing attention (low compliance)
  const atRiskClients = useMemo(() => {
    return clients
      .map(client => ({
        client,
        stats: getClientStats(client.id)
      }))
      .filter(c => c.stats.complianceRate < 60)
      .sort((a, b) => a.stats.complianceRate - b.stats.complianceRate)
      .slice(0, 5);
  }, [clients, getClientStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pendingToday = stats.todayTasks - stats.todayCompleted;

  return (
    <div className="p-4 space-y-4">
      {/* Quick Stats - Simplified */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-violet-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <CalendarCheck className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Hoje</p>
                <p className="text-lg font-bold font-mono text-violet-400">
                  {stats.todayCompleted}/{stats.todayTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("glass-card", stats.overdueTasks > 0 ? "border-status-danger/30" : "border-muted/20")}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", stats.overdueTasks > 0 ? "bg-status-danger/10" : "bg-muted/10")}>
                <AlertTriangle className={cn("h-4 w-4", stats.overdueTasks > 0 ? "text-status-danger" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Atrasadas</p>
                <p className={cn("text-lg font-bold font-mono", stats.overdueTasks > 0 ? "text-status-danger" : "text-muted-foreground")}>
                  {stats.overdueTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("glass-card", stats.weeklyComplianceRate >= 80 ? "border-status-success/20" : stats.weeklyComplianceRate >= 50 ? "border-status-warning/20" : "border-status-danger/20")}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", stats.weeklyComplianceRate >= 80 ? "bg-status-success/10" : stats.weeklyComplianceRate >= 50 ? "bg-status-warning/10" : "bg-status-danger/10")}>
                <TrendingUp className={cn("h-4 w-4", stats.weeklyComplianceRate >= 80 ? "text-status-success" : stats.weeklyComplianceRate >= 50 ? "text-status-warning" : "text-status-danger")} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Compliance</p>
                <p className={cn("text-lg font-bold font-mono", stats.weeklyComplianceRate >= 80 ? "text-status-success" : stats.weeklyComplianceRate >= 50 ? "text-status-warning" : "text-status-danger")}>
                  {stats.weeklyComplianceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-status-success/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-status-success/10">
                <Users className="h-4 w-4 text-status-success" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Clientes</p>
                <p className="text-lg font-bold font-mono text-status-success">{stats.activeClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's Progress */}
        <Card className="glass-card border-violet-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-violet-400" />
              Progresso de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.todayTasks === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma tarefa para hoje</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold font-mono text-violet-400">
                    {Math.round((stats.todayCompleted / stats.todayTasks) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.todayCompleted} de {stats.todayTasks} concluídas
                  </p>
                </div>
                <Progress value={(stats.todayCompleted / stats.todayTasks) * 100} className="h-3" />
                
                {pendingToday > 0 ? (
                  <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <p className="text-sm text-violet-400 font-medium">
                      {pendingToday} tarefa{pendingToday > 1 ? 's' : ''} pendente{pendingToday > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Continue o bom trabalho!
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-center">
                    <CheckCircle2 className="h-6 w-6 text-status-success mx-auto mb-1" />
                    <p className="text-sm text-status-success font-medium">Tudo concluído!</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        <div className="space-y-4">
          {/* Overdue Tasks */}
          {stats.overdueTasks > 0 && (
            <Card className="glass-card border-status-danger/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-status-danger">
                  <AlertTriangle className="h-4 w-4" />
                  Tarefas Atrasadas ({stats.overdueTasks})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[100px]">
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-status-danger/5 border border-status-danger/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{task.recurring_client?.company_name}</span>
                        </div>
                        <Badge variant="destructive" className="text-[10px] shrink-0">
                          {differenceInDays(new Date(), parseISO(task.due_date))}d
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* At Risk Clients */}
          {atRiskClients.length > 0 && (
            <Card className="glass-card border-status-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-status-warning">
                  <Users className="h-4 w-4" />
                  Clientes com Baixo Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[100px]">
                  <div className="space-y-2">
                    {atRiskClients.map(({ client, stats }) => (
                      <div key={client.id} className="flex items-center justify-between p-2 rounded-lg bg-status-warning/5 border border-status-warning/20">
                        <span className="text-sm truncate">{client.company_name}</span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "font-mono",
                            stats.complianceRate < 30 ? "bg-status-danger/20 text-status-danger" : "bg-status-warning/20 text-status-warning"
                          )}
                        >
                          {stats.complianceRate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* All Clear */}
          {stats.overdueTasks === 0 && atRiskClients.length === 0 && (
            <Card className="glass-card border-status-success/30">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-status-success/50" />
                <h3 className="font-semibold text-status-success">Excelente!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhuma tarefa atrasada e todos os clientes com bom compliance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}