import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  User, 
  ChevronRight,
  TrendingUp,
  Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client, COLUMNS } from "@/types/client";
import { calculateProgress, getDaysAgo, formatDate } from "@/lib/clientUtils";

interface ChecklistOverviewTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
}

type FilterResponsible = "all" | string;
type FilterPending = "all" | "client" | "internal" | "stalled";

function getCurrentStage(client: Client): string {
  const incompleteSection = client.checklist.find(section => 
    section.items.some(item => !item.completed)
  );
  return incompleteSection?.title || "Concluído";
}

function getPendingTasks(client: Client): number {
  return client.checklist.reduce((acc, section) => 
    acc + section.items.filter(item => !item.completed).length, 0
  );
}

function getClientPendingCount(client: Client): number {
  // Tarefas do Admin que estão pendentes (geralmente são as que dependem do cliente)
  return client.checklist.reduce((acc, section) => 
    acc + section.items.filter(item => !item.completed && item.responsible === "Admin").length, 0
  );
}

function isStalled(client: Client): boolean {
  const lastUpdateDate = new Date(client.lastUpdate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 3;
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

export function ChecklistOverviewTable({ clients, onClientClick }: ChecklistOverviewTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResponsible, setFilterResponsible] = useState<FilterResponsible>("all");
  const [filterPending, setFilterPending] = useState<FilterPending>("all");

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search filter
      if (searchQuery && !client.companyName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Responsible filter
      if (filterResponsible !== "all") {
        const hasTasks = client.checklist.some(section =>
          section.items.some(item => !item.completed && item.responsible === filterResponsible)
        );
        if (!hasTasks) return false;
      }

      // Pending type filter
      if (filterPending === "client" && getClientPendingCount(client) === 0) {
        return false;
      }
      if (filterPending === "internal" && getClientPendingCount(client) > 0) {
        return false;
      }
      if (filterPending === "stalled" && !isStalled(client)) {
        return false;
      }

      return true;
    });
  }, [clients, searchQuery, filterResponsible, filterPending]);

  // Stats
  const totalPending = filteredClients.reduce((acc, c) => acc + getPendingTasks(c), 0);
  const stalledCount = filteredClients.filter(isStalled).length;
  const avgProgress = filteredClients.length > 0 
    ? Math.round(filteredClients.reduce((acc, c) => acc + calculateProgress(c), 0) / filteredClients.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header com stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-2 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              <p className="text-2xl font-bold text-foreground">{filteredClients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-2 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-warning/10">
              <Clock className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
              <p className="text-2xl font-bold text-foreground">{totalPending}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-2 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-danger/10">
              <AlertTriangle className="w-5 h-5 text-status-danger" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parados (+3 dias)</p>
              <p className="text-2xl font-bold text-status-danger">{stalledCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-2 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-success/10">
              <TrendingUp className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progresso Médio</p>
              <p className="text-2xl font-bold text-status-success">{avgProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
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
          <SelectTrigger className="w-[160px] bg-surface-2 border-border/30">
            <User className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-border/50">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Operador">Operador</SelectItem>
            <SelectItem value="Designer">Designer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPending} onValueChange={(v) => setFilterPending(v as FilterPending)}>
          <SelectTrigger className="w-[180px] bg-surface-2 border-border/30">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Pendência" />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-border/50">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="client">Do cliente</SelectItem>
            <SelectItem value="internal">Interna</SelectItem>
            <SelectItem value="stalled">Parados (+3d)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="bg-surface-2 border border-border/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-surface-3/50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Etapa Atual
                </th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Progresso
                </th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Pendentes
                </th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Do Cliente
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Última Ação
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const progress = calculateProgress(client);
                  const pendingTasks = getPendingTasks(client);
                  const clientPending = getClientPendingCount(client);
                  const stalled = isStalled(client);
                  const currentStage = getCurrentStage(client);
                  const column = COLUMNS.find(c => c.id === client.columnId);

                  return (
                    <tr
                      key={client.id}
                      onClick={() => onClientClick(client)}
                      className={`
                        border-b border-border/20 cursor-pointer transition-colors
                        ${stalled ? "bg-status-danger/5 hover:bg-status-danger/10" : "hover:bg-surface-3/30"}
                      `}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-2 h-2 rounded-full flex-shrink-0
                            ${stalled ? "bg-status-danger animate-pulse" : "bg-primary"}
                          `} />
                          <div>
                            <p className="font-medium text-foreground">{client.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {column?.emoji} {column?.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-foreground line-clamp-1">
                          {currentStage}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-lg font-bold font-mono ${getProgressColor(progress)}`}>
                            {progress}%
                          </span>
                          <div className="w-20 h-1.5 bg-surface-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getProgressBgColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge 
                          variant="outline" 
                          className={pendingTasks > 10 ? "border-status-danger text-status-danger" : ""}
                        >
                          {pendingTasks}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {clientPending > 0 ? (
                          <Badge className="bg-status-warning/20 text-status-warning border border-status-warning/30">
                            {clientPending}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {stalled && (
                            <AlertTriangle className="w-4 h-4 text-status-danger" />
                          )}
                          <span className={`text-sm ${stalled ? "text-status-danger" : "text-muted-foreground"}`}>
                            {getDaysAgo(client.lastUpdate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
