import { useClientStore } from "@/stores/clientStore";
import { COLUMNS } from "@/types/client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COLUMN_COLORS: Record<string, string> = {
  pipeline: "bg-column-pipeline",
  onboarding: "bg-column-onboarding",
  optimization: "bg-column-optimization",
  ready_to_deliver: "bg-column-ready",
  delivered: "bg-column-delivered",
  suspended: "bg-column-suspended",
  finalized: "bg-column-finalized",
};

const COLUMN_GLOW: Record<string, string> = {
  pipeline: "shadow-[0_0_10px_hsl(var(--column-pipeline)/0.5)]",
  onboarding: "shadow-[0_0_10px_hsl(var(--column-onboarding)/0.5)]",
  optimization: "shadow-[0_0_10px_hsl(var(--column-optimization)/0.5)]",
  ready_to_deliver: "shadow-[0_0_10px_hsl(var(--column-ready)/0.5)]",
  delivered: "shadow-[0_0_10px_hsl(var(--column-delivered)/0.5)]",
  suspended: "shadow-[0_0_10px_hsl(var(--column-suspended)/0.5)]",
  finalized: "shadow-[0_0_10px_hsl(var(--column-finalized)/0.5)]",
};

export function GlobalProgressBar() {
  const { clients } = useClientStore();

  const totalClients = clients.length;
  if (totalClients === 0) return null;

  const columnCounts = COLUMNS.reduce((acc, col) => {
    acc[col.id] = clients.filter(c => c.columnId === col.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Filter columns with clients
  const activeColumns = COLUMNS.filter(col => columnCounts[col.id] > 0);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full px-4 py-2">
        <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-surface-2/50 backdrop-blur-sm">
          {activeColumns.map((col, index) => {
            const count = columnCounts[col.id];
            const percentage = (count / totalClients) * 100;
            
            return (
              <Tooltip key={col.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-smooth-out cursor-pointer hover:brightness-110",
                      COLUMN_COLORS[col.id],
                      index === 0 && "rounded-l-full",
                      index === activeColumns.length - 1 && "rounded-r-full"
                    )}
                    style={{ 
                      width: `${percentage}%`,
                      minWidth: percentage > 0 ? "8px" : "0",
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className={cn(
                    "glass border-none",
                    COLUMN_GLOW[col.id]
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      COLUMN_COLORS[col.id]
                    )} />
                    <span className="font-medium">{col.title}</span>
                    <span className="text-muted-foreground font-mono">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-2 px-1">
          {activeColumns.map((col) => (
            <div key={col.id} className="flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                COLUMN_COLORS[col.id]
              )} />
              <span className="text-[10px] text-muted-foreground">
                {col.title} ({columnCounts[col.id]})
              </span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
