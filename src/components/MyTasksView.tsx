import { useMemo, useState } from "react";
import { User, ChevronRight, Clock, CheckCircle2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useClientStore } from "@/stores/clientStore";
import { getDaysSinceUpdate, calculateProgress } from "@/lib/clientUtils";
import { COLUMNS } from "@/types/client";
import { cn } from "@/lib/utils";

interface TaskWithContext {
  clientId: string;
  clientName: string;
  columnId: string;
  sectionId: string;
  sectionTitle: string;
  itemId: string;
  itemTitle: string;
  responsible: string;
  daysSinceUpdate: number;
  progress: number;
}

export function MyTasksView() {
  const { clients, setSelectedClient, setDetailOpen, toggleChecklistItem } = useClientStore();
  const [responsible, setResponsible] = useState<string>("Operador");

  const allTasks = useMemo(() => {
    const tasks: TaskWithContext[] = [];
    
    clients
      .filter(c => !["delivered", "finalized", "suspended"].includes(c.columnId))
      .forEach(client => {
        const daysSinceUpdate = getDaysSinceUpdate(client.lastUpdate);
        const progress = calculateProgress(client);
        
        (client.checklist || []).forEach(section => {
          (section?.items || [])
            .filter(item => !item.completed)
            .forEach(item => {
              tasks.push({
                clientId: client.id,
                clientName: client.companyName,
                columnId: client.columnId,
                sectionId: section.id,
                sectionTitle: section.title,
                itemId: item.id,
                itemTitle: item.title,
                responsible: item?.responsible || 'N/A',
                daysSinceUpdate,
                progress,
              });
            });
        });
      });

    return tasks;
  }, [clients]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => task.responsible === responsible);
  }, [allTasks, responsible]);

  // Group by client
  const tasksByClient = useMemo(() => {
    const grouped: Record<string, TaskWithContext[]> = {};
    filteredTasks.forEach(task => {
      if (!grouped[task.clientId]) {
        grouped[task.clientId] = [];
      }
      grouped[task.clientId].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const clientIds = Object.keys(tasksByClient);
  const totalTasks = filteredTasks.length;

  const handleClientClick = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setDetailOpen(true);
    }
  };

  const handleToggleTask = (task: TaskWithContext) => {
    toggleChecklistItem(task.clientId, task.sectionId, task.itemId);
  };

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Minhas Tarefas</h1>
            <p className="text-sm text-muted-foreground">
              {totalTasks} tarefas pendentes em {clientIds.length} cliente{clientIds.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ToggleGroup
              type="single"
              value={responsible === "Admin" ? "admin" : responsible === "Designer" ? "designer" : "operador"}
              onValueChange={(val) => {
                if (val === "admin") setResponsible("Admin");
                else if (val === "designer") setResponsible("Designer");
                else if (val === "operador") setResponsible("Operador");
              }}
            >
              <ToggleGroupItem value="admin" aria-label="Admin" className="gap-2">
                <div className="w-5 h-5 rounded-full bg-status-info/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-status-info" />
                </div>
                Admin
              </ToggleGroupItem>
              <ToggleGroupItem value="operador" aria-label="Operador" className="gap-2">
                <div className="w-5 h-5 rounded-full bg-status-purple/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-status-purple" />
                </div>
                Operador
              </ToggleGroupItem>
              <ToggleGroupItem value="designer" aria-label="Designer" className="gap-2">
                <div className="w-5 h-5 rounded-full bg-status-success/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-status-success" />
                </div>
                Designer
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Task List by Client */}
        {clientIds.length === 0 ? (
          <div className="bg-surface-2 border border-border/30 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground">
              Não há tarefas pendentes para {responsible}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientIds.map(clientId => {
              const tasks = tasksByClient[clientId];
              const firstTask = tasks[0];
              const column = COLUMNS.find(c => c.id === firstTask.columnId);
              const isStalled = firstTask.daysSinceUpdate >= 3;

              return (
                <div
                  key={clientId}
                  className={cn(
                    "bg-surface-2 border rounded-xl overflow-hidden",
                    isStalled ? "border-status-warning/40" : "border-border/30"
                  )}
                >
                  {/* Client Header */}
                  <button
                    onClick={() => handleClientClick(clientId)}
                    className="w-full px-4 py-3 flex items-center gap-3 bg-surface-3/30 hover:bg-surface-3/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{firstTask.clientName}</span>
                        {isStalled && (
                          <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">
                            {firstTask.daysSinceUpdate}d parado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {column?.emoji} {column?.title} • {firstTask.progress}% concluído
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tasks.length} tarefa{tasks.length > 1 ? 's' : ''}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {/* Tasks */}
                  <div className="divide-y divide-border/20">
                    {tasks.slice(0, 5).map(task => (
                      <div
                        key={task.itemId}
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-3/20 transition-colors"
                      >
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="w-5 h-5 rounded border-2 border-muted-foreground/40 hover:border-primary flex items-center justify-center shrink-0 transition-colors"
                        >
                          {/* Empty checkbox */}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{task.itemTitle}</p>
                          <p className="text-[10px] text-muted-foreground">{task.sectionTitle.replace(/^\d+\.\s*/, '')}</p>
                        </div>
                      </div>
                    ))}
                    {tasks.length > 5 && (
                      <button
                        onClick={() => handleClientClick(clientId)}
                        className="w-full px-4 py-2 text-xs text-primary hover:bg-primary/5 transition-colors"
                      >
                        Ver mais {tasks.length - 5} tarefas →
                      </button>
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