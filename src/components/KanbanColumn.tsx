import { useState } from "react";
import { Column as ColumnType, ColumnId } from "@/types/client";
import { Client } from "@/types/client";
import { ClientCard } from "./ClientCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClientStore } from "@/stores/clientStore";
import { TOOLTIP_CONTENT } from "@/lib/tooltipContent";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: ColumnType;
  clients: Client[];
  allClients?: Client[];
  onClientClick: (client: Client) => void;
  onConvertToRecurring?: (client: Client) => void;
  onDropToFinalized?: (client: Client) => void;
}

const columnColors: Record<ColumnId, string> = {
  pipeline: "border-t-column-pipeline",
  onboarding: "border-t-column-onboarding",
  optimization: "border-t-column-optimization",
  ready_to_deliver: "border-t-column-ready",
  delivered: "border-t-column-delivered",
  suspended: "border-t-column-suspended",
  finalized: "border-t-column-finalized",
};

const columnBgColors: Record<ColumnId, string> = {
  pipeline: "from-column-pipeline/5",
  onboarding: "from-column-onboarding/5",
  optimization: "from-column-optimization/5",
  ready_to_deliver: "from-column-ready/5",
  delivered: "from-column-delivered/5",
  suspended: "from-column-suspended/5",
  finalized: "from-column-finalized/5",
};

const columnTooltips: Record<ColumnId, string> = {
  pipeline: TOOLTIP_CONTENT.columns.pipeline,
  onboarding: TOOLTIP_CONTENT.columns.onboarding,
  optimization: TOOLTIP_CONTENT.columns.optimization,
  ready_to_deliver: TOOLTIP_CONTENT.columns.ready,
  delivered: TOOLTIP_CONTENT.columns.delivered,
  suspended: TOOLTIP_CONTENT.columns.suspended,
  finalized: TOOLTIP_CONTENT.columns.finalized,
};

export function KanbanColumn({ column, clients, allClients, onClientClick, onConvertToRecurring, onDropToFinalized }: KanbanColumnProps) {
  const { moveClient } = useClientStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const clientId = e.dataTransfer.getData("clientId");
    if (clientId) {
      // Check if dropping to finalized column and client is not already recurring
      const droppedClient = allClients?.find(c => c.id === clientId);
      
      if ((column.id === "finalized" || column.id === "delivered") && droppedClient && droppedClient.planType !== "recurring" && onDropToFinalized) {
        // Move the client first
        moveClient(clientId, column.id);
        // Then trigger the recurrence dialog
        setTimeout(() => {
          onDropToFinalized(droppedClient);
        }, 300);
      } else {
        moveClient(clientId, column.id);
      }
    }
  };

  return (
    <div 
      className="kanban-column min-w-[260px] sm:min-w-[280px] w-[260px] sm:w-[280px] shrink-0 animate-fade-in"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <TooltipProvider delayDuration={1000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "glass-card rounded-t-xl border-t-3 p-3 sm:p-4 mb-0 cursor-help transition-all duration-300",
              columnColors[column.id],
              isDragOver && "scale-[1.02]"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg">{column.emoji}</span>
                  <h2 className="font-semibold text-xs sm:text-sm text-foreground">{column.title}</h2>
                </div>
                <span className={cn(
                  "text-xs font-mono px-2.5 py-1 rounded-full border transition-all",
                  clients.length > 0 
                    ? "bg-primary/15 text-primary border-primary/30 neon-glow" 
                    : "bg-muted/50 text-muted-foreground border-border/30"
                )}>
                  {clients.length}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[280px] glass">
            <p className="font-medium mb-1">{column.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{columnTooltips[column.id]}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Cards Container */}
      <div className={cn(
        "flex-1 rounded-b-xl p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-14rem)] border-x border-b border-border/20 transition-all duration-300",
        `bg-gradient-to-b ${columnBgColors[column.id]} to-transparent`,
        isDragOver && "bg-primary/10 border-primary/50 ring-2 ring-primary/30 scale-[1.01]"
      )}>
        {clients.map((client, index) => (
          <div 
            key={client.id} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ClientCard
              client={client}
              onClick={() => onClientClick(client)}
              onConvertToRecurring={onConvertToRecurring}
            />
          </div>
        ))}
        
        {clients.length === 0 && (
          <div className={cn(
            "flex items-center justify-center h-24 sm:h-32 text-muted-foreground text-xs sm:text-sm",
            "border-2 border-dashed border-primary/20 rounded-xl bg-primary/5",
            "transition-all duration-300",
            isDragOver && "border-primary/50 bg-primary/10"
          )}>
            {isDragOver ? "Solte aqui" : "Nenhum cliente"}
          </div>
        )}
      </div>
    </div>
  );
}
