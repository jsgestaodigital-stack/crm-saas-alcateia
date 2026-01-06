import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isToday, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  CalendarDays,
  AlertTriangle,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  SkipForward,
  RotateCcw,
  Plus,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Calendar,
  Target,
  Zap,
  ChevronRight,
  Building2,
  MessageSquare,
  Image,
  Star,
  CalendarClock,
  Settings,
  Pencil,
  Trash2,
  Save,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRecurring, RecurringTask, RecurringRoutine } from "@/hooks/useRecurring";
import { useToast } from "@/hooks/use-toast";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { cn } from "@/lib/utils";
import { RecurrenceReportAgent } from "@/components/recurring/RecurrenceReportAgent";
import { RoutineConfigCard } from "@/components/recurring/RoutineConfigCard";

// Routine icon mapping
const ROUTINE_ICONS: Record<string, React.ElementType> = {
  'reviews': Star,
  'posts': Image,
  'engagement': MessageSquare,
  'checkin': Users,
  'reviews_reminder': Star,
  'holidays': Calendar,
};

// Routine color mapping
const ROUTINE_COLORS: Record<string, string> = {
  'reviews': 'text-amber-400 bg-amber-500/10',
  'posts': 'text-blue-400 bg-blue-500/10',
  'engagement': 'text-green-400 bg-green-500/10',
  'checkin': 'text-purple-400 bg-purple-500/10',
  'reviews_reminder': 'text-amber-400 bg-amber-500/10',
  'holidays': 'text-red-400 bg-red-500/10',
};

// Task Card Component
function TaskCard({ 
  task, 
  onComplete, 
  onSkip, 
  onReopen,
  showClient = true,
  compact = false 
}: { 
  task: RecurringTask;
  onComplete: () => void;
  onSkip: () => void;
  onReopen: () => void;
  showClient?: boolean;
  compact?: boolean;
}) {
  const category = (task.routine?.rules_json as any)?.category || 'default';
  const Icon = ROUTINE_ICONS[category] || CheckCircle2;
  const colorClasses = ROUTINE_COLORS[category] || 'text-primary bg-primary/10';
  const isOverdue = task.status === 'todo' && differenceInDays(new Date(), parseISO(task.due_date)) > 0;
  const isDone = task.status === 'done';
  const isSkipped = task.status === 'skipped';

  return (
    <div className={cn(
      "glass-card rounded-lg p-3 transition-all duration-200 hover:border-primary/30",
      isDone && "opacity-60 border-status-success/30",
      isSkipped && "opacity-50 border-muted/30",
      isOverdue && "border-status-danger/30 bg-status-danger/5",
      compact ? "p-2" : "p-3"
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("p-1 rounded", colorClasses)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
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

          {task.routine?.description && !compact && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {task.routine.description}
            </p>
          )}

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

        {/* Actions */}
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
              <TooltipContent>Pular esta tarefa</TooltipContent>
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
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
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

// Stats Card Component
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  trend,
  description 
}: { 
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; positive: boolean };
  description?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4 hover-lift">
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-lg", `bg-${color}/10`)}>
          <Icon className={cn("h-5 w-5", `text-${color}`)} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className={cn("text-2xl font-bold font-mono", `text-${color}`)}>{value}</p>
            {trend && (
              <span className={cn(
                "text-xs",
                trend.positive ? "text-status-success" : "text-status-danger"
              )}>
                {trend.positive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-[10px] text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Client Row Component
function ClientRow({ 
  client, 
  stats, 
  onClick 
}: { 
  client: any;
  stats: any;
  onClick: () => void;
}) {
  const lastActionDays = stats.lastAction 
    ? differenceInDays(new Date(), parseISO(stats.lastAction))
    : null;

  return (
    <div 
      className="glass-card rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{client.company_name}</p>
            <p className="text-xs text-muted-foreground">
              {client.responsible_name} • Variante {client.schedule_variant}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Compliance Rate */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Compliance</p>
            <div className="flex items-center gap-2">
              <Progress 
                value={stats.complianceRate} 
                className="w-16 h-1.5"
              />
              <span className={cn(
                "text-sm font-mono font-medium",
                stats.complianceRate >= 80 ? "text-status-success" :
                stats.complianceRate >= 50 ? "text-status-warning" : "text-status-danger"
              )}>
                {stats.complianceRate}%
              </span>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="text-right min-w-[60px]">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className={cn(
              "text-sm font-mono font-medium",
              stats.pendingTasks > 0 ? "text-status-warning" : "text-muted-foreground"
            )}>
              {stats.pendingTasks}
            </p>
          </div>

          {/* Last Action */}
          <div className="text-right min-w-[80px]">
            <p className="text-xs text-muted-foreground">Última ação</p>
            <p className={cn(
              "text-sm font-mono",
              lastActionDays && lastActionDays > 7 ? "text-status-danger" :
              lastActionDays && lastActionDays > 3 ? "text-status-warning" : "text-muted-foreground"
            )}>
              {lastActionDays !== null ? `${lastActionDays}d atrás` : "—"}
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function Recorrencia() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, derived, isAdmin } = useAuth();
  const { setMode } = useFunnelMode();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hoje");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  
  // Note: Routine management state is now handled by RoutineConfigCard component

  const {
    clients,
    tasks,
    stats,
    loading,
    allRoutines,
    fetchData,
    generateAllTasks,
    completeTask,
    skipTask,
    reopenTask,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getTodayTasks,
    getWeekTasks,
    getOverdueTasks,
    getClientStats,
  } = useRecurring();

  // Check permissions
  const canAccessRecurring = derived?.canRecurringOrAdmin ?? isAdmin;

  // Redirect if no access
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Get filtered tasks
  const todayTasks = useMemo(() => getTodayTasks(), [getTodayTasks]);
  const weekTasks = useMemo(() => getWeekTasks(), [getWeekTasks]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks]);

  // Group week tasks by day
  const weekTasksByDay = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const days: Record<string, RecurringTask[]> = {};
    
    for (let d = weekStart; d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = format(new Date(d), "yyyy-MM-dd");
      days[dateStr] = weekTasks.filter(t => t.due_date === dateStr);
    }
    
    return days;
  }, [weekTasks]);

  // Handle task actions
  const handleComplete = async (taskId: string) => {
    const userName = user?.email?.split("@")[0] || "Usuário";
    const success = await completeTask(taskId, userName);
    if (success) {
      toast({
        title: "Tarefa concluída!",
        description: "Bom trabalho! Continue assim.",
      });
    }
  };

  const handleSkip = async (taskId: string) => {
    const success = await skipTask(taskId, "Pulada pelo usuário");
    if (success) {
      toast({
        title: "Tarefa pulada",
        description: "A tarefa foi marcada como pulada.",
      });
    }
  };

  const handleReopen = async (taskId: string) => {
    const success = await reopenTask(taskId);
    if (success) {
      toast({
        title: "Tarefa reaberta",
        description: "A tarefa voltou para pendente.",
      });
    }
  };

  const handleGenerateTasks = async () => {
    toast({
      title: "Gerando tarefas...",
      description: "Aguarde enquanto as tarefas são geradas.",
    });
    await generateAllTasks();
    toast({
      title: "Tarefas geradas!",
      description: "Todas as tarefas foram criadas com sucesso.",
    });
  };

  // Note: Routine CRUD handlers are now in RoutineConfigCard component

  const handleBackNavigation = () => {
    setMode('delivery');
    navigate("/dashboard");
  };

  const FREQUENCY_LABELS: Record<string, string> = {
    daily: "Diária",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando recorrência...</p>
        </div>
      </div>
    );
  }

  if (!canAccessRecurring) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="glass-card max-w-md">
          <CardHeader>
            <CardTitle className="text-status-danger">Acesso Restrito</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar o módulo de Recorrência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackNavigation}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <CalendarCheck className="h-6 w-6 text-primary" />
                  Recorrência
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie tarefas periódicas dos seus clientes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RecurrenceReportAgent />
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateTasks}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Gerar Tarefas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            label="Tarefas Hoje"
            value={`${stats.todayCompleted}/${stats.todayTasks}`}
            icon={CalendarCheck}
            color="primary"
            description={stats.todayTasks > 0 ? `${Math.round((stats.todayCompleted / stats.todayTasks) * 100)}% concluído` : "Nenhuma tarefa"}
          />
          <StatCard
            label="Esta Semana"
            value={`${stats.weekCompleted}/${stats.weekTasks}`}
            icon={CalendarDays}
            color="blue-400"
            description={`${stats.weeklyComplianceRate}% compliance`}
          />
          <StatCard
            label="Atrasadas"
            value={stats.overdueTasks}
            icon={AlertTriangle}
            color={stats.overdueTasks > 0 ? "status-danger" : "muted-foreground"}
          />
          <StatCard
            label="Clientes Ativos"
            value={stats.activeClients}
            icon={Users}
            color="status-success"
          />
          <StatCard
            label="Compliance Semanal"
            value={`${stats.weeklyComplianceRate}%`}
            icon={TrendingUp}
            color={stats.weeklyComplianceRate >= 80 ? "status-success" : stats.weeklyComplianceRate >= 50 ? "status-warning" : "status-danger"}
          />
          <StatCard
            label="Taxa de Conclusão"
            value={stats.weekTasks > 0 ? `${Math.round((stats.weekCompleted / stats.weekTasks) * 100)}%` : "—"}
            icon={Target}
            color="purple-400"
          />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="hoje" className="gap-2 data-[state=active]:bg-primary/20">
              <CalendarCheck className="h-4 w-4" />
              Hoje
              {stats.todayTasks - stats.todayCompleted > 0 && (
                <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary">
                  {stats.todayTasks - stats.todayCompleted}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="semana" className="gap-2 data-[state=active]:bg-primary/20">
              <CalendarDays className="h-4 w-4" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="atrasadas" className="gap-2 data-[state=active]:bg-primary/20">
              <AlertTriangle className="h-4 w-4" />
              Atrasadas
              {stats.overdueTasks > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {stats.overdueTasks}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clientes" className="gap-2 data-[state=active]:bg-primary/20">
              <Users className="h-4 w-4" />
              Por Cliente
            </TabsTrigger>
            <TabsTrigger value="indicadores" className="gap-2 data-[state=active]:bg-primary/20">
              <TrendingUp className="h-4 w-4" />
              Indicadores
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="configuracoes" className="gap-2 data-[state=active]:bg-violet-500/20">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            )}
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="hoje" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  Tarefas de Hoje
                  <Badge variant="outline" className="ml-2">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {todayTasks.length === 0 
                    ? "Nenhuma tarefa programada para hoje"
                    : `${stats.todayCompleted} de ${stats.todayTasks} tarefas concluídas`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma tarefa para hoje!</p>
                    <p className="text-sm">Aproveite para verificar a semana.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleComplete(task.id)}
                        onSkip={() => handleSkip(task.id)}
                        onReopen={() => handleReopen(task.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Week Tab */}
          <TabsContent value="semana" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(weekTasksByDay).map(([dateStr, dayTasks]) => {
                const date = parseISO(dateStr);
                const isTodays = isToday(date);
                const isPast = date < new Date() && !isTodays;
                const completedCount = dayTasks.filter(t => t.status === 'done').length;

                return (
                  <Card key={dateStr} className={cn(
                    "glass-card",
                    isTodays && "border-primary/50 bg-primary/5"
                  )}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className={cn(
                          isTodays && "text-primary"
                        )}>
                          {format(date, "EEEE", { locale: ptBR })}
                        </span>
                        {isTodays && (
                          <Badge variant="default" className="text-[10px]">Hoje</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {format(date, "d 'de' MMMM", { locale: ptBR })}
                        {dayTasks.length > 0 && (
                          <span className="ml-2">
                            • {completedCount}/{dayTasks.length}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {dayTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Sem tarefas
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayTasks.map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onComplete={() => handleComplete(task.id)}
                              onSkip={() => handleSkip(task.id)}
                              onReopen={() => handleReopen(task.id)}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="atrasadas" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-status-danger">
                  <AlertTriangle className="h-5 w-5" />
                  Tarefas Atrasadas
                </CardTitle>
                <CardDescription>
                  {overdueTasks.length === 0 
                    ? "Parabéns! Nenhuma tarefa atrasada."
                    : `${overdueTasks.length} tarefa(s) precisam de atenção`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overdueTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-status-success opacity-50" />
                    <p className="text-status-success">Tudo em dia!</p>
                    <p className="text-sm">Continue assim.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {overdueTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleComplete(task.id)}
                        onSkip={() => handleSkip(task.id)}
                        onReopen={() => handleReopen(task.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clientes" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Clientes Recorrentes
                </CardTitle>
                <CardDescription>
                  {clients.length} cliente(s) com recorrência ativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cliente com recorrência</p>
                    <p className="text-sm">Ative a recorrência em clientes existentes.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clients.map(client => (
                      <ClientRow
                        key={client.id}
                        client={client}
                        stats={getClientStats(client.id)}
                        onClick={() => setSelectedClientId(client.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Indicators Tab */}
          <TabsContent value="indicadores" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Compliance by Client */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Compliance por Cliente
                  </CardTitle>
                  <CardDescription>Taxa de conclusão semanal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clients.map(client => {
                      const clientStats = getClientStats(client.id);
                      return (
                        <div key={client.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate">{client.company_name}</span>
                            <span className={cn(
                              "font-mono font-medium",
                              clientStats.complianceRate >= 80 ? "text-status-success" :
                              clientStats.complianceRate >= 50 ? "text-status-warning" : "text-status-danger"
                            )}>
                              {clientStats.complianceRate}%
                            </span>
                          </div>
                          <Progress value={clientStats.complianceRate} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* At Risk Clients */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-status-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Clientes em Risco
                  </CardTitle>
                  <CardDescription>Clientes com baixa compliance ou sem atividade recente</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const atRiskClients = clients.filter(client => {
                      const clientStats = getClientStats(client.id);
                      const lastActionDays = clientStats.lastAction 
                        ? differenceInDays(new Date(), parseISO(clientStats.lastAction))
                        : 999;
                      return clientStats.complianceRate < 50 || lastActionDays > 7;
                    });

                    if (atRiskClients.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-status-success opacity-50" />
                          <p className="text-status-success">Nenhum cliente em risco!</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {atRiskClients.map(client => {
                          const clientStats = getClientStats(client.id);
                          const lastActionDays = clientStats.lastAction 
                            ? differenceInDays(new Date(), parseISO(clientStats.lastAction))
                            : null;

                          return (
                            <div key={client.id} className="flex items-center justify-between p-2 rounded-lg bg-status-warning/5 border border-status-warning/20">
                              <div>
                                <p className="font-medium text-sm">{client.company_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {clientStats.complianceRate < 50 && `Compliance: ${clientStats.complianceRate}%`}
                                  {clientStats.complianceRate < 50 && lastActionDays && lastActionDays > 7 && " • "}
                                  {lastActionDays && lastActionDays > 7 && `${lastActionDays} dias sem ação`}
                                </p>
                              </div>
                              <Badge variant="outline" className="border-status-warning/50 text-status-warning">
                                Atenção
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

          {/* Admin Configuration Tab */}
          {isAdmin && activeTab === "configuracoes" && (
            <RoutineConfigCard
              routines={allRoutines}
              onCreateRoutine={createRoutine}
              onUpdateRoutine={updateRoutine}
              onDeleteRoutine={deleteRoutine}
            />
          )}
      </main>

      {/* Note: Routine dialogs are now handled by RoutineConfigCard */}
    </div>
  );
}