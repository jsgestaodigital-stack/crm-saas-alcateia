import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, formatDate, getDaysSinceUpdate } from "@/lib/clientUtils";
import { COLUMNS } from "@/types/client";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function TimelineView() {
  const { clients, setSelectedClient } = useClientStore();

  // Sort clients by start date
  const sortedClients = [...clients]
    .filter(c => c.columnId !== "finalized")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Group by month
  const groupedByMonth: Record<string, typeof clients> = {};
  sortedClients.forEach(client => {
    const date = new Date(client.startDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(client);
  });

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-6">Timeline de Projetos</h2>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/50" />

        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([monthKey, monthClients]) => {
            const [year, month] = monthKey.split("-");
            const monthName = monthNames[parseInt(month) - 1];

            return (
              <div key={monthKey} className="relative">
                {/* Month marker */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-primary-foreground">{monthName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{year}</span>
                </div>

                {/* Clients */}
                <div className="ml-12 space-y-3">
                  {monthClients.map(client => {
                    const progress = calculateProgress(client);
                    const column = COLUMNS.find(c => c.id === client.columnId);
                    const daysSinceUpdate = getDaysSinceUpdate(client.lastUpdate);
                    const isStalled = daysSinceUpdate >= 3;

                    return (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={cn(
                          "p-4 rounded-xl border bg-surface-1/50 cursor-pointer transition-all hover:bg-surface-2/50",
                          isStalled && "border-status-danger/50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {client.profileImage ? (
                              <img src={client.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{client.companyName.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-sm">{client.companyName}</h4>
                              <p className="text-xs text-muted-foreground">{client.mainCategory}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{column?.emoji}</span>
                            {isStalled && <AlertTriangle className="w-4 h-4 text-status-danger" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Progress value={progress} className="flex-1 h-1.5" />
                          <span className={cn(
                            "text-xs font-mono",
                            progress >= 80 ? "text-status-success" : progress >= 40 ? "text-status-warning" : "text-status-danger"
                          )}>
                            {progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
