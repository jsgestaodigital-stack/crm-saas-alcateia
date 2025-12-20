import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useScheduledTasks,
  useLeadTaskSuggestions,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from '@/hooks/useScheduledTasks';
import { cn } from '@/lib/utils';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  ClipboardList,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskStatus = Database['public']['Enums']['task_status'];

interface LeadTasksTabProps {
  leadId: string;
}

export function LeadTasksTab({ leadId }: LeadTasksTabProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium' as TaskPriority,
  });

  const { tasks, loading, createTask, completeTask } = useScheduledTasks({
    leadId,
    status: statusFilter,
    priority: priorityFilter,
  });

  const {
    suggestion,
    loading: suggestionLoading,
    fetchSuggestion,
    reset: resetSuggestion,
  } = useLeadTaskSuggestions(leadId);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    const task = await createTask({
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date,
      priority: newTask.priority,
      lead_id: leadId,
    });

    if (task) {
      setNewTask({
        title: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        priority: 'medium',
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleCreateFromSuggestion = async () => {
    if (!suggestion) return;

    // Parse suggestion to extract priority and title
    const match = suggestion.match(/\[([^\]]+)\]\s*(.+)/);
    let priority: TaskPriority = 'medium';
    let title = suggestion;

    if (match) {
      const suggestedPriority = match[1].toLowerCase();
      title = match[2];

      if (suggestedPriority.includes('alta') || suggestedPriority.includes('high')) {
        priority = 'high';
      } else if (suggestedPriority.includes('urgente') || suggestedPriority.includes('urgent')) {
        priority = 'urgent';
      } else if (suggestedPriority.includes('baixa') || suggestedPriority.includes('low')) {
        priority = 'low';
      }
    }

    await createTask({
      title: title.trim(),
      due_date: format(new Date(), 'yyyy-MM-dd'),
      priority,
      lead_id: leadId,
    });

    resetSuggestion();
  };

  const getDateDisplay = (dateStr: string) => {
    const date = parseISO(dateStr);
    const isOverdue = isPast(date) && !isToday(date);
    const isTodayDate = isToday(date);

    return {
      text: format(date, "dd/MM/yy", { locale: ptBR }),
      isOverdue,
      isToday: isTodayDate,
    };
  };

  const filteredTasks = tasks;

  return (
    <div className="space-y-4">
      {/* Header with Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.emoji} {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Prioridades</SelectItem>
              {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.emoji} {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Suggestion Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestion}
            disabled={suggestionLoading}
            className="gap-1 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            {suggestionLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Sugerir Próxima Ação
          </Button>

          {/* Add Task Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                    placeholder="O que precisa ser feito?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Detalhes adicionais..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v as TaskPriority }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.emoji} {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateTask} className="w-full" disabled={!newTask.title.trim()}>
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Suggestion Card */}
      {suggestion && (
        <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">Sugestão da IA</span>
          </div>
          <p className="text-sm text-foreground">{suggestion}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateFromSuggestion} className="gap-1">
              <Plus className="h-3 w-3" />
              Criar Tarefa
            </Button>
            <Button size="sm" variant="ghost" onClick={resetSuggestion}>
              Descartar
            </Button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Tarefas ({filteredTasks.length})
        </h4>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const statusConfig = TASK_STATUS_CONFIG[task.status];
              const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
              const dateInfo = getDateDisplay(task.due_date);
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={cn(
                    "p-3 rounded-lg border border-border/30 bg-surface-1/50 transition-all",
                    isCompleted && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isCompleted && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px]", priorityConfig.color)}>
                          {priorityConfig.emoji} {priorityConfig.label}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px]", statusConfig.color)}>
                          {statusConfig.emoji} {statusConfig.label}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span
                            className={cn(
                              dateInfo.isOverdue && !isCompleted && "text-red-400 font-semibold",
                              dateInfo.isToday && !isCompleted && "text-amber-400 font-semibold"
                            )}
                          >
                            {dateInfo.isOverdue && !isCompleted && (
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                            )}
                            {dateInfo.isToday && !isCompleted && (
                              <Clock className="h-3 w-3 inline mr-1" />
                            )}
                            {dateInfo.text}
                          </span>
                        </span>
                        <span>por {task.user_name}</span>
                        {task.completed_by_name && (
                          <span className="text-green-400">
                            ✓ Concluída por {task.completed_by_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isCompleted && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => completeTask(task.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
