import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  User, 
  ChevronRight,
  TrendingUp,
  Users,
  CheckCircle2,
  LayoutList,
  Users2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client, COLUMNS } from "@/types/client";
import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, getDaysAgo, getDaysSinceUpdate } from "@/lib/clientUtils";
import { cn } from "@/lib/utils";

type ViewMode = "clients" | "tasks";
type FilterResponsible = "all" | string;
type FilterPending = "all" | "client" | "stalled";

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

// Helper functions
function getCurrentStage(client: Client): string {
  const incompleteSection = client.checklist?.find(section => 
    section?.items?.some(item => !item.completed)
  );
  return incompleteSection?.title || "Concluído";
}

function getPendingTasks(client: Client): number {
  return client.checklist?.reduce((acc, section) => 
    acc + (section?.items?.filter(item => !item.completed)?.length || 0), 0
  ) || 0;
}

function isStalled(client: Client): boolean {
  const daysDiff = getDaysSinceUpdate(client.lastUpdate);
  return daysDiff >= 3;
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return "text-status-success";
  if (progress >= 40) return "text-status-warning";
  return "text-status-danger";
}

function getProgressBgColor(progress: number): string {
  if (progress >= 80) return "bg-status-success";
  if (progress >= 40) return "bg-status-warning";
  return "bg-status-danger";
}

export function UnifiedTasksView() {
  const { clients, setSelectedClient, setDetailOpen, toggleChecklistItem } = useClientStore();
  const [viewMode, setViewMode] = useState<ViewMode>("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResponsible, setFilterResponsible] = useState<FilterResponsible>("all");
  const [filterPending, setFilterPending] = useState<FilterPending>("all");

  // Clientes ativos
  const activeClients = useMemo(() => 
    clients.filter(c => !["delivered", "finalized", "suspended"].includes(c.columnId)),
    [clients]
  );

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    return activeClients.filter(client => {
      if (searchQuery && !client.companyName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterResponsible !== "all") {
        const hasTasks = client.checklist?.some(section =>
          section?.items?.some(item => !item.completed && item.responsible === filterResponsible)
        );
        if (!hasTasks) return false;
      }
      if (filterPending === "client" && client.status !== "pending_client") {
        return false;
      }
      if (filterPending === "stalled" && !isStalled(client)) {
        return false;
      }
      return true;
    });
  }, [activeClients, searchQuery, filterResponsible, filterPending]);

  // Todas as tarefas
  const allTasks = useMemo(() => {
    const tasks: TaskWithContext[] = [];
    
    filteredClients.forEach(client => {
      const daysSinceUpdate = getDaysSinceUpdate(client.lastUpdate);
      const progress = calculateProgress(client);
      
      (client.checklist || []).forEach(section => {
        (section?.items || [])
          .filter(item => !item.completed)
          .forEach(item => {
            if (filterResponsible === "all" || item.responsible === filterResponsible) {
              tasks.push({
                clientId: client.id,
                clientName: client.companyName,
                columnId: client.columnId,
                sectionId: section.id,
                sectionTitle: section.title,
                itemId: item.id,
                itemTitle: item.title,
                responsible: item.responsible,
                daysSinceUpdate,
                progress,
              });
            }
          });
      });
    });

    return tasks;
  }, [filteredClients, filterResponsible]);

  // Group tasks by client
  const tasksByClient = useMemo(() => {
    const grouped: Record<string, TaskWithContext[]> = {};
    allTasks.forEach(task => {
      if (!grouped[task.clientId]) {
        grouped[task.clientId] = [];
      }
      grouped[task.clientId].push(task);
    });
    return grouped;
  }, [allTasks]);

  // Stats
  const totalPending = allTasks.length;
  const stalledCount = filteredClients.filter(isStalled).length;
  const avgProgress = filteredClients.length > 0 
    ? Math.round(filteredClients.reduce((acc, c) => acc + calculateProgress(c), 0) / filteredClients.length)
    : 0;

  const handleClientClick = (client: Client | string) => {
    const targetClient = typeof client === "string" 
      ? clients.find(c => c.id === client) 
      : client;
    if (targetClient) {
      setSelectedClient(targetClient);
      setDetailOpen(true);
    }
  };

  const handleToggleTask = (task: TaskWithContext) => {
    toggleChecklistItem(task.clientId, task.sectionId, task.itemId);
  };

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Execução</h1>
            <p className="text-sm text-muted-foreground">
              {filteredClients.length} clientes • {totalPending} tarefas pendentes
            </p>
          </div>

          {/* View Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="bg-surface-2/50 p-1 rounded-lg"
          >
            <ToggleGroupItem 
              value="clients" 
              className={cn(
                "gap-2 px-4 data-[state=on]:bg-primary/20 data-[state=on]:text-primary",
              )}
            >
              <Users2 className="w-4 h-4" />
              <span className="hidden sm:inline">Por Cliente</span>
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="tasks"
              className={cn(
                "gap-2 px-4 data-[state=on]:bg-primary/20 data-[state=on]:text-primary",
              )}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Por Tarefa</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Clientes" value={filteredClients.length} color="primary" />
          <StatCard icon={Clock} label="Pendentes" value={totalPending} color="warning" />
          <StatCard icon={AlertTriangle} label="Parados" value={stalledCount} color="danger" />
          <StatCard icon={TrendingUp} label="Progresso" value={`${avgProgress}%`} color="success" />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface-2 border-border/30"
            />
          </div>

          <Select value={filterResponsible} onValueChange={(v) => setFilterResponsible(v as FilterResponsible)}>
            <SelectTrigger className="w-[140px] bg-surface-2 border-border/30">
              <User className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-1 border-border/50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Operador">Operador</SelectItem>
              <SelectItem value="Designer">Designer</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPending} onValueChange={(v) => setFilterPending(v as FilterPending)}>
            <SelectTrigger className="w-[160px] bg-surface-2 border-border/30">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-1 border-border/50">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="client">Pendente cliente</SelectItem>
              <SelectItem value="stalled">Parados (+3d)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content based on view mode */}
        {viewMode === "clients" ? (
          <ClientsTable 
            clients={filteredClients} 
            onClientClick={handleClientClick} 
          />
        ) : (
          <TasksList 
            tasksByClient={tasksByClient}
            clients={clients}
            onClientClick={handleClientClick}
            onToggleTask={handleToggleTask}
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string; 
  color: "primary" | "warning" | "danger" | "success";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-status-warning/10 text-status-warning",
    danger: "bg-status-danger/10 text-status-danger",
    success: "bg-status-success/10 text-status-success",
  };

  return (
    <div className="bg-surface-2 border border-border/30 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
          <p className="text-xl font-bold text-foreground font-mono">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Clients Table View
function ClientsTable({ clients, onClientClick }: { 
  clients: Client[]; 
  onClientClick: (client: Client) => void;
}) {
  if (clients.length === 0) {
    return (
      <div className="bg-surface-2 border border-border/30 rounded-xl p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground">Nenhum cliente encontrado</p>
        <p className="text-sm text-muted-foreground">Ajuste os filtros para ver resultados</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-border/30 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30 bg-surface-3/50">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Cliente
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                Etapa
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Progresso
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Pendentes
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                Última Ação
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const progress = calculateProgress(client);
              const pendingTasks = getPendingTasks(client);
              const stalled = isStalled(client);
              const currentStage = getCurrentStage(client);
              const column = COLUMNS.find(c => c.id === client.columnId);
              const isPendingClient = client.status === "pending_client";

              return (
                <tr
                  key={client.id}
                  onClick={() => onClientClick(client)}
                  className={cn(
                    "border-b border-border/20 cursor-pointer transition-colors",
                    stalled ? "bg-status-danger/5 hover:bg-status-danger/10" : "hover:bg-surface-3/30"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        stalled ? "bg-status-danger animate-pulse" : "bg-primary"
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{client.companyName}</p>
                          {isPendingClient && (
                            <Badge className="bg-status-danger/20 text-status-danger border-status-danger/30 text-[9px] px-1.5 py-0">
                              PENDENTE
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {column?.emoji} {column?.title}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-foreground line-clamp-1">
                      {currentStage.replace(/^\d+\.\s*/, '')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn("text-sm font-bold font-mono", getProgressColor(progress))}>
                        {progress}%
                      </span>
                      <div className="w-16 h-1 bg-surface-1 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", getProgressBgColor(progress))}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={cn(
                      "font-mono",
                      pendingTasks > 15 && "border-status-danger text-status-danger"
                    )}>
                      {pendingTasks}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      {stalled && <AlertTriangle className="w-3 h-3 text-status-danger" />}
                      <span className={cn("text-xs", stalled ? "text-status-danger" : "text-muted-foreground")}>
                        {getDaysAgo(client.lastUpdate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tasks List View
function TasksList({ tasksByClient, clients, onClientClick, onToggleTask }: {
  tasksByClient: Record<string, TaskWithContext[]>;
  clients: Client[];
  onClientClick: (clientId: string) => void;
  onToggleTask: (task: TaskWithContext) => void;
}) {
  const clientIds = Object.keys(tasksByClient);

  if (clientIds.length === 0) {
    return (
      <div className="bg-surface-2 border border-border/30 rounded-xl p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground">Tudo em dia!</p>
        <p className="text-sm text-muted-foreground">Não há tarefas pendentes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clientIds.map(clientId => {
        const tasks = tasksByClient[clientId];
        const firstTask = tasks[0];
        const column = COLUMNS.find(c => c.id === firstTask.columnId);
        const isClientStalled = firstTask.daysSinceUpdate >= 3;
        const client = clients.find(c => c.id === clientId);
        const isPendingClient = client?.status === "pending_client";

        return (
          <div
            key={clientId}
            className={cn(
              "bg-surface-2 border rounded-xl overflow-hidden",
              isClientStalled ? "border-status-warning/40" : "border-border/30"
            )}
          >
            {/* Client Header */}
            <button
              onClick={() => onClientClick(clientId)}
              className="w-full px-4 py-3 flex items-center gap-3 bg-surface-3/30 hover:bg-surface-3/50 transition-colors"
            >
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{firstTask.clientName}</span>
                  {isPendingClient && (
                    <Badge className="bg-status-danger/20 text-status-danger border-status-danger/30 text-[9px] px-1.5 py-0">
                      PENDENTE DO CLIENTE
                    </Badge>
                  )}
                  {isClientStalled && !isPendingClient && (
                    <Badge variant="outline" className="text-[10px] border-status-warning/40 text-status-warning">
                      {firstTask.daysSinceUpdate}d parado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {column?.emoji} {column?.title} • {firstTask.progress}% concluído
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {tasks.length}
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
                    onClick={() => onToggleTask(task)}
                    className="w-5 h-5 rounded border-2 border-muted-foreground/40 hover:border-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{task.itemTitle}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground">{task.sectionTitle.replace(/^\d+\.\s*/, '')}</p>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] px-1 py-0",
                          task.responsible?.toLowerCase().includes('gestor') || task.responsible?.toLowerCase().includes('comercial')
                            ? "border-blue-500/30 text-blue-400" 
                            : "border-purple-500/30 text-purple-400"
                        )}
                      >
                        {task.responsible}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length > 5 && (
                <button
                  onClick={() => onClientClick(clientId)}
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
  );
}
