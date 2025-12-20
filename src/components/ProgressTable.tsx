import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, formatDate, getStatusColor, getStatusLabel, getDaysAgo } from "@/lib/clientUtils";
import { Progress } from "@/components/ui/progress";
import { COLUMNS } from "@/types/client";
import { ChevronRight, ExternalLink } from "lucide-react";

export function ProgressTable() {
  const { clients, setSelectedClient } = useClientStore();

  const sortedClients = [...clients].sort((a, b) => {
    const columnOrder = COLUMNS.map(c => c.id);
    return columnOrder.indexOf(a.columnId) - columnOrder.indexOf(b.columnId);
  });

  return (
    <div className="p-6">
      <div className="bg-surface-1 border border-border/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-surface-2/50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">
                  Empresa
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">
                  Etapa
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">
                  Progresso
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">
                  Início
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">
                  Responsável
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">
                  Última Ação
                </th>
                <th className="w-10 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client) => {
                const progress = calculateProgress(client);
                const column = COLUMNS.find(c => c.id === client.columnId);

                return (
                  <tr 
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="border-b border-border/30 hover:bg-secondary/20 cursor-pointer transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {client.companyName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {client.companyName}
                          </p>
                          <p className="text-xs text-muted-foreground">{client.mainCategory}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span>{column?.emoji}</span>
                        <span className="text-sm text-foreground">{column?.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Progress value={progress} className="h-2 w-24" />
                        <span className="text-sm font-mono text-primary">{progress}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">{formatDate(client.startDate)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">{client.responsible}</span>
                    </td>
                    <td className="p-4">
                      <span className={`status-badge ${getStatusColor(client.status)}`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{getDaysAgo(client.lastUpdate)}</span>
                    </td>
                    <td className="p-4">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
