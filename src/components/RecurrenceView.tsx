import { useState, useMemo } from "react";
import { format, parseISO, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  CalendarDays,
  AlertTriangle,
  Users,
  TrendingUp,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  RefreshCw,
  Building2,
  Target,
  DollarSign,
  Settings,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
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
import { cn } from "@/lib/utils";

// Task Card Component
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

export function RecurrenceView() {
  const { user, isAdmin, derived } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hoje");
  
  // Routine management state
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RecurringRoutine | null>(null);
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);
  const [routineForm, setRoutineForm] = useState({
    title: "",
    description: "",
    frequency: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
    occurrences_per_period: 1,
    active: true,
  });

  const {
    clients,
    stats,
    loading,
    allRoutines,
    completeTask,
    skipTask,
    reopenTask,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    updateRecurringClient,
    getTodayTasks,
    getWeekTasks,
    getOverdueTasks,
    getClientStats,
  } = useRecurring();

  // State for editing monthly values
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const canAccessRecurring = derived?.canRecurringOrAdmin ?? isAdmin;

  // Get filtered tasks
  const todayTasks = useMemo(() => getTodayTasks(), [getTodayTasks]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks]);

  // Calculate monthly recurring value using actual client values
  const monthlyRecurringValue = useMemo(() => {
    return clients.reduce((sum, client) => {
      return sum + (client.monthly_value ?? 500); // Use actual value or default R$500
    }, 0);
  }, [clients]);

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

  // Handle monthly value update
  const handleSaveMonthlyValue = async (clientId: string) => {
    const numValue = parseFloat(editingValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(numValue) || numValue < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    const success = await updateRecurringClient(clientId, { monthly_value: numValue });
    if (success) {
      toast({ title: "Valor atualizado!" });
      setEditingClientId(null);
      setEditingValue("");
    }
  };

  const startEditingClient = (client: { id: string; monthly_value: number | null }) => {
    setEditingClientId(client.id);
    setEditingValue((client.monthly_value ?? 500).toString());
  };

  // Routine CRUD handlers
  const openNewRoutineDialog = () => {
    setEditingRoutine(null);
    setRoutineForm({
      title: "",
      description: "",
      frequency: "weekly",
      occurrences_per_period: 1,
      active: true,
    });
    setRoutineDialogOpen(true);
  };

  const openEditRoutineDialog = (routine: RecurringRoutine) => {
    setEditingRoutine(routine);
    setRoutineForm({
      title: routine.title,
      description: routine.description || "",
      frequency: routine.frequency,
      occurrences_per_period: routine.occurrences_per_period,
      active: routine.active,
    });
    setRoutineDialogOpen(true);
  };

  const handleSaveRoutine = async () => {
    if (!routineForm.title.trim()) {
      toast({ title: "Erro", description: "O título é obrigatório.", variant: "destructive" });
      return;
    }

    if (editingRoutine) {
      const success = await updateRoutine(editingRoutine.id, {
        title: routineForm.title,
        description: routineForm.description || null,
        frequency: routineForm.frequency,
        occurrences_per_period: routineForm.occurrences_per_period,
        active: routineForm.active,
      });
      if (success) {
        toast({ title: "Rotina atualizada!" });
        setRoutineDialogOpen(false);
      }
    } else {
      const newRoutine = await createRoutine({
        title: routineForm.title,
        description: routineForm.description,
        frequency: routineForm.frequency,
        occurrences_per_period: routineForm.occurrences_per_period,
        active: routineForm.active,
      });
      if (newRoutine) {
        toast({ title: "Rotina criada!" });
        setRoutineDialogOpen(false);
      }
    }
  };

  const handleDeleteRoutine = async () => {
    if (!deleteRoutineId) return;
    const success = await deleteRoutine(deleteRoutineId);
    if (success) {
      toast({ title: "Rotina excluída" });
    }
    setDeleteRoutineId(null);
  };

  const FREQUENCY_LABELS: Record<string, string> = {
    daily: "Diária",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
  };

  if (!canAccessRecurring) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground text-sm">Você não tem permissão para acessar o módulo de Recorrência.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Stats Row */}
      <div className={cn("grid gap-3", isAdmin ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5")}>
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

        <Card className="glass-card border-blue-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CalendarDays className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Semana</p>
                <p className="text-lg font-bold font-mono text-blue-400">
                  {stats.weekCompleted}/{stats.weekTasks}
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

        {/* MRR Card - Only for admins */}
        {isAdmin && (
          <Card className="glass-card border-emerald-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">MRR</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">
                    R${monthlyRecurringValue.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass-card p-1">
          <TabsTrigger value="hoje" className="gap-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            <CalendarCheck className="h-4 w-4" />
            Hoje
            {stats.todayTasks - stats.todayCompleted > 0 && (
              <Badge variant="secondary" className="ml-1 bg-violet-500/20 text-violet-400">
                {stats.todayTasks - stats.todayCompleted}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="atrasadas" className="gap-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            <AlertTriangle className="h-4 w-4" />
            Atrasadas
            {stats.overdueTasks > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.overdueTasks}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="financeiro" className="gap-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="configuracoes" className="gap-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          )}
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="hoje" className="space-y-4">
          <Card className="glass-card border-violet-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-violet-400" />
                Tarefas de Hoje
              </CardTitle>
              <CardDescription>
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-status-success/50" />
                  <p>Todas as tarefas de hoje foram concluídas!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {todayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleComplete(task.id)}
                        onSkip={() => handleSkip(task.id)}
                        onReopen={() => handleReopen(task.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="atrasadas" className="space-y-4">
          <Card className="glass-card border-status-danger/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-status-danger">
                <AlertTriangle className="h-5 w-5" />
                Tarefas Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-status-success/50" />
                  <p>Nenhuma tarefa atrasada!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {overdueTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleComplete(task.id)}
                        onSkip={() => handleSkip(task.id)}
                        onReopen={() => handleReopen(task.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clientes" className="space-y-4">
          <Card className="glass-card border-violet-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-400" />
                Clientes Recorrentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum cliente recorrente cadastrado</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {clients.map((client) => {
                      const clientStats = getClientStats(client.id);
                      const isEditing = editingClientId === client.id;
                      return (
                        <div key={client.id} className="glass-card rounded-lg p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                                <Building2 className="h-5 w-5 text-violet-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{client.company_name}</p>
                                <p className="text-xs text-muted-foreground">{client.responsible_name}</p>
                              </div>
                            </div>

                            {/* Monthly Value - Only visible to admins */}
                            {isAdmin && (
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-muted-foreground">R$</span>
                                    <Input
                                      type="text"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="w-24 h-8 text-sm"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveMonthlyValue(client.id);
                                        if (e.key === 'Escape') setEditingClientId(null);
                                      }}
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-status-success"
                                      onClick={() => handleSaveMonthlyValue(client.id)}
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-muted-foreground"
                                      onClick={() => setEditingClientId(null)}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => startEditingClient(client)}
                                          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-emerald-500/10 transition-colors group"
                                        >
                                          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                                          <span className="text-sm font-mono text-emerald-400">
                                            R${(client.monthly_value ?? 500).toLocaleString('pt-BR')}
                                          </span>
                                          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Clique para editar valor mensal</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}

                            {/* Compliance */}
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">Compliance</p>
                              <div className="flex items-center gap-2">
                                <Progress value={clientStats.complianceRate} className="w-16 h-1.5" />
                                <span className={cn(
                                  "text-sm font-mono",
                                  clientStats.complianceRate >= 80 ? "text-status-success" :
                                  clientStats.complianceRate >= 50 ? "text-status-warning" : "text-status-danger"
                                )}>
                                  {clientStats.complianceRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  Receita Recorrente Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-4xl font-bold text-emerald-400 font-mono">
                    R$ {monthlyRecurringValue.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats.activeClients} clientes ativos
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-violet-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-400" />
                  Projeção Anual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-4xl font-bold text-violet-400 font-mono">
                    R$ {(monthlyRecurringValue * 12).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Baseado no MRR atual
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="configuracoes" className="space-y-4">
            <Card className="glass-card border-violet-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-violet-400" />
                    Rotinas Configuradas
                  </CardTitle>
                  <CardDescription>
                    Defina as tarefas recorrentes para seus clientes
                  </CardDescription>
                </div>
                <Button onClick={openNewRoutineDialog} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rotina
                </Button>
              </CardHeader>
              <CardContent>
                {allRoutines.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma rotina configurada</p>
                    <Button variant="outline" className="mt-4" onClick={openNewRoutineDialog}>
                      Criar primeira rotina
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allRoutines.map((routine) => (
                      <div key={routine.id} className={cn(
                        "glass-card rounded-lg p-4 flex items-center justify-between",
                        !routine.active && "opacity-50"
                      )}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{routine.title}</p>
                            <Badge variant={routine.active ? "default" : "secondary"}>
                              {routine.active ? "Ativa" : "Inativa"}
                            </Badge>
                            <Badge variant="outline">
                              {FREQUENCY_LABELS[routine.frequency] || routine.frequency}
                            </Badge>
                          </div>
                          {routine.description && (
                            <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditRoutineDialog(routine)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-status-danger hover:text-status-danger" onClick={() => setDeleteRoutineId(routine.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Routine Dialog */}
      <Dialog open={routineDialogOpen} onOpenChange={setRoutineDialogOpen}>
        <DialogContent className="glass-card border-violet-500/20">
          <DialogHeader>
            <DialogTitle>{editingRoutine ? "Editar Rotina" : "Nova Rotina"}</DialogTitle>
            <DialogDescription>
              Configure uma tarefa recorrente para seus clientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={routineForm.title}
                onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                placeholder="Ex: Cobrar avaliações"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={routineForm.description}
                onChange={(e) => setRoutineForm({ ...routineForm, description: e.target.value })}
                placeholder="Descreva o que deve ser feito..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequência</Label>
                <Select
                  value={routineForm.frequency}
                  onValueChange={(v) => setRoutineForm({ ...routineForm, frequency: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vezes por período</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={routineForm.occurrences_per_period}
                  onChange={(e) => setRoutineForm({ ...routineForm, occurrences_per_period: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={routineForm.active}
                onCheckedChange={(checked) => setRoutineForm({ ...routineForm, active: checked })}
              />
              <Label>Rotina ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoutineDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveRoutine} className="bg-violet-600 hover:bg-violet-700">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRoutineId} onOpenChange={() => setDeleteRoutineId(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Rotina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As tarefas existentes serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoutine} className="bg-status-danger hover:bg-status-danger/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}