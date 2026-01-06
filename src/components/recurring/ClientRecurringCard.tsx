import { useState, useMemo } from "react";
import { format, parseISO, differenceInDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
  Image,
  MessageSquare,
  BarChart3,
  FileText,
  Zap,
  SkipForward,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  MoreVertical,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RecurringClient, RecurringTask, RecurringRoutine } from "@/hooks/useRecurring";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  engagement: MessageSquare,
  content: Image,
  analytics: BarChart3,
  report: FileText,
  reviews: Star,
  default: Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  engagement: "text-blue-400 bg-blue-500/10",
  content: "text-green-400 bg-green-500/10",
  analytics: "text-purple-400 bg-purple-500/10",
  report: "text-orange-400 bg-orange-500/10",
  reviews: "text-amber-400 bg-amber-500/10",
  default: "text-gray-400 bg-gray-500/10",
};

interface ClientRecurringCardProps {
  client: RecurringClient;
  tasks: RecurringTask[];
  onCompleteTask: (taskId: string, userName: string) => Promise<boolean>;
  onSkipTask: (taskId: string, notes?: string) => Promise<boolean>;
  onReopenTask: (taskId: string) => Promise<boolean>;
  onPauseClient?: (clientId: string) => Promise<boolean>;
  onResumeClient?: (clientId: string) => Promise<boolean>;
  onRemoveClient?: (clientId: string) => Promise<boolean>;
  compact?: boolean;
}

export function ClientRecurringCard({
  client,
  tasks,
  onCompleteTask,
  onSkipTask,
  onReopenTask,
  onPauseClient,
  onResumeClient,
  onRemoveClient,
  compact = false,
}: ClientRecurringCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isActioning, setIsActioning] = useState(false);

  // Current week tasks
  const weekTasks = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    return tasks.filter(t => {
      const dueDate = parseISO(t.due_date);
      return dueDate >= weekStart && dueDate <= weekEnd;
    }).sort((a, b) => {
      // Sort: overdue first, then todo, then done, then skipped
      const aOverdue = a.status === 'todo' && differenceInDays(new Date(), parseISO(a.due_date)) > 0;
      const bOverdue = b.status === 'todo' && differenceInDays(new Date(), parseISO(b.due_date)) > 0;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.status === 'todo' && b.status !== 'todo') return -1;
      if (a.status !== 'todo' && b.status === 'todo') return 1;
      return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
    });
  }, [tasks]);

  // Stats
  const stats = useMemo(() => {
    const total = weekTasks.length;
    const completed = weekTasks.filter(t => t.status === 'done').length;
    const skipped = weekTasks.filter(t => t.status === 'skipped').length;
    const pending = weekTasks.filter(t => t.status === 'todo').length;
    const overdue = weekTasks.filter(t => 
      t.status === 'todo' && differenceInDays(new Date(), parseISO(t.due_date)) > 0
    ).length;
    const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, skipped, pending, overdue, complianceRate };
  }, [weekTasks]);

  // Group tasks by status for display
  const groupedTasks = useMemo(() => {
    const groups: { overdue: RecurringTask[], today: RecurringTask[], upcoming: RecurringTask[], done: RecurringTask[] } = {
      overdue: [],
      today: [],
      upcoming: [],
      done: [],
    };

    const todayStr = format(new Date(), "yyyy-MM-dd");

    weekTasks.forEach(task => {
      if (task.status === 'done' || task.status === 'skipped') {
        groups.done.push(task);
      } else if (differenceInDays(new Date(), parseISO(task.due_date)) > 0) {
        groups.overdue.push(task);
      } else if (task.due_date === todayStr) {
        groups.today.push(task);
      } else {
        groups.upcoming.push(task);
      }
    });

    return groups;
  }, [weekTasks]);

  const handleComplete = async (taskId: string) => {
    setIsActioning(true);
    const userName = user?.email?.split("@")[0] || "Usuário";
    await onCompleteTask(taskId, userName);
    setIsActioning(false);
  };

  const handleSkip = async (taskId: string) => {
    setIsActioning(true);
    await onSkipTask(taskId, "Pulada pelo usuário");
    setIsActioning(false);
  };

  const handleReopen = async (taskId: string) => {
    setIsActioning(true);
    await onReopenTask(taskId);
    setIsActioning(false);
  };

  const handlePause = async () => {
    if (!onPauseClient) return;
    const success = await onPauseClient(client.id);
    if (success) toast.success("Cliente pausado");
  };

  const handleResume = async () => {
    if (!onResumeClient) return;
    const success = await onResumeClient(client.id);
    if (success) toast.success("Cliente reativado");
  };

  const handleRemove = async () => {
    if (!onRemoveClient) return;
    const confirmed = window.confirm(`Remover ${client.company_name} da recorrência?`);
    if (confirmed) {
      const success = await onRemoveClient(client.id);
      if (success) toast.success("Cliente removido da recorrência");
    }
  };

  const renderTask = (task: RecurringTask) => {
    const category = (task.routine?.rules_json as any)?.category || 'default';
    const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
    const colorClasses = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
    const isOverdue = task.status === 'todo' && differenceInDays(new Date(), parseISO(task.due_date)) > 0;
    const isDone = task.status === 'done';
    const isSkipped = task.status === 'skipped';

    return (
      <div
        key={task.id}
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-lg transition-all",
          isDone && "bg-status-success/5 opacity-60",
          isSkipped && "bg-muted/30 opacity-50",
          isOverdue && "bg-status-danger/10 border border-status-danger/30",
          !isDone && !isSkipped && !isOverdue && "bg-surface-2/50 hover:bg-surface-2"
        )}
      >
        {/* Checkbox */}
        <Checkbox
          checked={isDone}
          disabled={isSkipped || isActioning}
          onCheckedChange={(checked) => {
            if (checked) handleComplete(task.id);
            else handleReopen(task.id);
          }}
          className={cn(
            "h-5 w-5",
            isDone && "bg-status-success border-status-success",
            isOverdue && !isDone && "border-status-danger"
          )}
        />

        {/* Icon */}
        <div className={cn("p-1.5 rounded", colorClasses)}>
          <Icon className="h-3.5 w-3.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
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
          <p className="text-[10px] text-muted-foreground">
            {format(parseISO(task.due_date), "EEEE, d MMM", { locale: ptBR })}
            {isDone && task.completed_by_name && (
              <span> • Feito por {task.completed_by_name}</span>
            )}
          </p>
        </div>

        {/* Actions */}
        {!isDone && !isSkipped && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                  onClick={() => handleSkip(task.id)}
                  disabled={isActioning}
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
                  onClick={() => handleReopen(task.id)}
                  disabled={isActioning}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reabrir tarefa</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  return (
    <Card className={cn(
      "glass-card transition-all",
      stats.overdue > 0 && "border-status-danger/30",
      stats.complianceRate >= 80 && stats.pending === 0 && "border-status-success/30",
      client.status === 'paused' && "opacity-60"
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {/* Client Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base truncate">{client.company_name}</CardTitle>
                  {client.status === 'paused' && (
                    <Badge variant="secondary" className="text-xs">Pausado</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {client.responsible_name}
                  </span>
                  {client.monthly_value && client.monthly_value > 0 && (
                    <span className="flex items-center gap-1 text-status-success">
                      <DollarSign className="h-3 w-3" />
                      {client.monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center gap-3">
              {/* Compliance */}
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2">
                  <Progress value={stats.complianceRate} className="w-16 h-1.5" />
                  <span className={cn(
                    "text-sm font-mono font-medium min-w-[36px]",
                    stats.complianceRate >= 80 ? "text-status-success" :
                    stats.complianceRate >= 50 ? "text-status-warning" : "text-status-danger"
                  )}>
                    {stats.complianceRate}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {stats.completed}/{stats.total} esta semana
                </p>
              </div>

              {/* Pending Badge */}
              {stats.pending > 0 && (
                <Badge 
                  variant={stats.overdue > 0 ? "destructive" : "secondary"} 
                  className="tabular-nums"
                >
                  {stats.overdue > 0 && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {stats.pending} pendente{stats.pending > 1 ? 's' : ''}
                </Badge>
              )}

              {/* All Done Badge */}
              {stats.pending === 0 && stats.total > 0 && (
                <Badge variant="outline" className="border-status-success/50 text-status-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Concluído
                </Badge>
              )}

              {/* Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {client.status === 'paused' && onResumeClient && (
                    <DropdownMenuItem onClick={handleResume}>
                      <Play className="h-4 w-4 mr-2" />
                      Reativar
                    </DropdownMenuItem>
                  )}
                  {client.status === 'active' && onPauseClient && (
                    <DropdownMenuItem onClick={handlePause}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onRemoveClient && (
                    <DropdownMenuItem 
                      onClick={handleRemove}
                      className="text-status-danger focus:text-status-danger"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Expand Toggle */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2 space-y-3">
            {/* Overdue Tasks */}
            {groupedTasks.overdue.length > 0 && (
              <div>
                <p className="text-xs font-medium text-status-danger mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Atrasadas ({groupedTasks.overdue.length})
                </p>
                <div className="space-y-1">
                  {groupedTasks.overdue.map(renderTask)}
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            {groupedTasks.today.length > 0 && (
              <div>
                <p className="text-xs font-medium text-violet-400 mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Hoje ({groupedTasks.today.length})
                </p>
                <div className="space-y-1">
                  {groupedTasks.today.map(renderTask)}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {groupedTasks.upcoming.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Próximas ({groupedTasks.upcoming.length})
                </p>
                <div className="space-y-1">
                  {groupedTasks.upcoming.map(renderTask)}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {groupedTasks.done.length > 0 && (
              <div>
                <p className="text-xs font-medium text-status-success mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Concluídas ({groupedTasks.done.length})
                </p>
                <div className="space-y-1">
                  {groupedTasks.done.map(renderTask)}
                </div>
              </div>
            )}

            {/* Empty State */}
            {weekTasks.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma tarefa esta semana</p>
                <p className="text-xs mt-1">As tarefas são geradas automaticamente. Clique em "Gerar Tarefas" no topo da página.</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Desde {format(parseISO(client.start_date), "d MMM yyyy", { locale: ptBR })}
              </span>
              <span>Variante {client.schedule_variant}</span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
