import { useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  Building2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useRecurring, RecurringTask } from "@/hooks/useRecurring";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Compact Task Card
function TaskCard({ 
  task, 
  onComplete, 
  onSkip, 
  onReopen,
  showClient = true,
}: { 
  task: RecurringTask;
  onComplete: () => void;
  onSkip: () => void;
  onReopen: () => void;
  showClient?: boolean;
}) {
  const isOverdue = task.status === 'todo' && differenceInDays(new Date(), parseISO(task.due_date)) > 0;
  const isDone = task.status === 'done';
  const isSkipped = task.status === 'skipped';

  return (
    <div className={cn(
      "glass-card rounded-lg p-3 transition-all duration-200 hover:border-violet-500/30",
      isDone && "opacity-60 border-status-success/30",
      isSkipped && "opacity-50 border-muted/30",
      isOverdue && "border-status-danger/30 bg-status-danger/5"
    )}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <Checkbox
            checked={isDone}
            disabled={isSkipped}
            onCheckedChange={(checked) => {
              if (checked) onComplete();
              else onReopen();
            }}
            className={cn(
              "h-5 w-5",
              isDone && "bg-status-success border-status-success",
              isOverdue && !isDone && "border-status-danger"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "font-medium text-sm",
              isDone && "line-through text-muted-foreground"
            )}>
              {task.routine?.title || "Tarefa"}
            </span>
            {isOverdue && !isDone && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Atrasada
              </Badge>
            )}
          </div>

          {showClient && task.recurring_client && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{task.recurring_client.company_name}</span>
            </div>
          )}

          {isDone && task.completed_by_name && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Feito por {task.completed_by_name} • {task.completed_at && format(parseISO(task.completed_at), "HH:mm")}
            </p>
          )}
        </div>

        {!isDone && !isSkipped && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                  onClick={onSkip}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pular tarefa</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isSkipped && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-violet-400"
                  onClick={onReopen}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reabrir tarefa</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export function RecurringExecutionView() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    clients,
    stats,
    loading,
    completeTask,
    skipTask,
    reopenTask,
    getTodayTasks,
    getOverdueTasks,
    getClientStats,
  } = useRecurring();

  const todayTasks = useMemo(() => getTodayTasks(), [getTodayTasks]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks]);

  // Group today tasks by client
  const tasksByClient = useMemo(() => {
    const map = new Map<string, RecurringTask[]>();
    const allTasks = [...overdueTasks, ...todayTasks];
    
    allTasks.forEach(task => {
      const clientId = task.recurring_client?.id || 'unknown';
      if (!map.has(clientId)) {
        map.set(clientId, []);
      }
      map.get(clientId)!.push(task);
    });

    return Array.from(map.entries()).map(([clientId, tasks]) => ({
      client: tasks[0]?.recurring_client,
      tasks: tasks.sort((a, b) => {
        // Overdue first, then pending, then done
        if (a.status === 'todo' && differenceInDays(new Date(), parseISO(a.due_date)) > 0) return -1;
        if (b.status === 'todo' && differenceInDays(new Date(), parseISO(b.due_date)) > 0) return 1;
        if (a.status === 'todo' && b.status !== 'todo') return -1;
        if (b.status === 'todo' && a.status !== 'todo') return 1;
        return 0;
      })
    })).sort((a, b) => {
      // Sort by pending tasks count
      const aPending = a.tasks.filter(t => t.status === 'todo').length;
      const bPending = b.tasks.filter(t => t.status === 'todo').length;
      return bPending - aPending;
    });
  }, [todayTasks, overdueTasks]);

  // Handle task actions
  const handleComplete = async (taskId: string) => {
    const userName = user?.email?.split("@")[0] || "Usuário";
    const success = await completeTask(taskId, userName);
    if (success) {
      toast({ title: "Tarefa concluída!", description: "Bom trabalho!" });
    }
  };

  const handleSkip = async (taskId: string) => {
    const success = await skipTask(taskId, "Pulada pelo usuário");
    if (success) {
      toast({ title: "Tarefa pulada" });
    }
  };

  const handleReopen = async (taskId: string) => {
    const success = await reopenTask(taskId);
    if (success) {
      toast({ title: "Tarefa reaberta" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pendingToday = stats.todayTasks - stats.todayCompleted;
  const totalPending = pendingToday + stats.overdueTasks;

  return (
    <div className="p-4 space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 p-3 glass-card rounded-lg border-violet-500/20">
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

        {stats.overdueTasks > 0 && (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-status-danger/10">
              <AlertTriangle className="h-4 w-4 text-status-danger" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Atrasadas</p>
              <p className="text-lg font-bold font-mono text-status-danger">
                {stats.overdueTasks}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            stats.weeklyComplianceRate >= 80 ? "bg-status-success/10" : "bg-status-warning/10"
          )}>
            <TrendingUp className={cn(
              "h-4 w-4",
              stats.weeklyComplianceRate >= 80 ? "text-status-success" : "text-status-warning"
            )} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Compliance</p>
            <p className={cn(
              "text-lg font-bold font-mono",
              stats.weeklyComplianceRate >= 80 ? "text-status-success" : "text-status-warning"
            )}>
              {stats.weeklyComplianceRate}%
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Main Content */}
      {totalPending === 0 ? (
        <Card className="glass-card border-status-success/30">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-status-success/50" />
            <h3 className="text-xl font-semibold mb-2 text-status-success">Tudo em dia!</h3>
            <p className="text-muted-foreground">
              Todas as tarefas de hoje e atrasadas foram concluídas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasksByClient.map(({ client, tasks }) => {
            if (!client) return null;
            const pendingTasks = tasks.filter(t => t.status === 'todo');
            const clientStats = getClientStats(client.id);
            
            return (
              <Card key={client.id} className="glass-card border-violet-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <Building2 className="h-4 w-4 text-violet-400" />
                      </div>
                      <span>{client.company_name}</span>
                      {pendingTasks.length > 0 && (
                        <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">
                          {pendingTasks.length} pendentes
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Progress value={clientStats.complianceRate} className="w-20 h-1.5" />
                      <span className={cn(
                        "text-xs font-mono",
                        clientStats.complianceRate >= 80 ? "text-status-success" :
                        clientStats.complianceRate >= 50 ? "text-status-warning" : "text-status-danger"
                      )}>
                        {clientStats.complianceRate}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleComplete(task.id)}
                        onSkip={() => handleSkip(task.id)}
                        onReopen={() => handleReopen(task.id)}
                        showClient={false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}