import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, getDaysAgo, getDaysSinceUpdate } from "@/lib/clientUtils";
import { COLUMNS } from "@/types/client";
import { cn } from "@/lib/utils";
import { Globe, FolderOpen, MessageCircle, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CardsView() {
  const { clients, setSelectedClient } = useClientStore();

  // Filter and sort: show active clients first, then by progress
  const sortedClients = [...clients]
    .filter(c => c.columnId !== "finalized" && c.columnId !== "suspended")
    .sort((a, b) => {
      // Stalled clients first
      const aStalledDays = getDaysSinceUpdate(a.lastUpdate);
      const bStalledDays = getDaysSinceUpdate(b.lastUpdate);
      if (aStalledDays >= 3 && bStalledDays < 3) return -1;
      if (bStalledDays >= 3 && aStalledDays < 3) return 1;
      // Then by progress (lower first - needs attention)
      return calculateProgress(a) - calculateProgress(b);
    });

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-6">Visão em Cards</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedClients.map(client => {
          const progress = calculateProgress(client);
          const column = COLUMNS.find(c => c.id === client.columnId);
          const daysSinceUpdate = getDaysSinceUpdate(client.lastUpdate);
          const isStalled = daysSinceUpdate >= 3;
          
          const allItems = client.checklist.flatMap(s => s.items);
          const completedItems = allItems.filter(i => i.completed).length;

          return (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={cn(
                "rounded-2xl border bg-surface-1 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/30",
                isStalled && "border-status-danger/50"
              )}
            >
              {/* Cover */}
              {client.coverConfig?.type === "solid" && client.coverConfig.color && (
                <div className="h-16" style={{ backgroundColor: client.coverConfig.color }} />
              )}
              {client.coverConfig?.type === "image" && client.coverConfig.imageUrl && (
                <div 
                  className="h-24 bg-cover bg-center"
                  style={{ backgroundImage: `url(${client.coverConfig.imageUrl})` }}
                />
              )}
              {(!client.coverConfig || client.coverConfig.type === "none") && (
                <div className="h-12 bg-gradient-to-r from-primary/20 to-primary/5" />
              )}

              {/* Profile Image - Overlapping */}
              <div className="px-4 -mt-6 relative z-10">
                {client.profileImage ? (
                  <img 
                    src={client.profileImage} 
                    alt="" 
                    className="w-12 h-12 rounded-xl object-cover border-2 border-background"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border-2 border-background flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {client.companyName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 pt-2">
                {/* Labels */}
                {client.labels && client.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {client.labels.map(label => (
                      <span 
                        key={label.id}
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                        style={{ backgroundColor: label.color, color: "#fff" }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{client.companyName}</h3>
                    <p className="text-xs text-muted-foreground">{client.mainCategory}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {column?.emoji} {column?.title}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{completedItems}/{allItems.length} tarefas</span>
                    <span className={cn(
                      "font-mono font-bold",
                      progress >= 80 ? "text-status-success" : progress >= 40 ? "text-status-warning" : "text-status-danger"
                    )}>
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{getDaysAgo(client.lastUpdate)}</span>
                    {isStalled && <AlertTriangle className="w-3.5 h-3.5 text-status-danger ml-1" />}
                  </div>
                  <div className="flex items-center gap-1">
                    {client.googleProfileUrl && <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
                    {client.driveUrl && <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />}
                    {client.whatsappGroupUrl && <MessageCircle className="w-3.5 h-3.5 text-status-success" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
