import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import type { ChecklistSection } from "@/types/client";
import { ChecklistItem } from "./ChecklistItem";
import { cn } from "@/lib/utils";

interface ChecklistBlockProps {
  section: ChecklistSection;
  sectionNumber: number;
  clientId: string;
  clientName: string;
  onToggleItem: (itemId: string) => void;
  onAttachmentChange?: (itemId: string, url: string) => void;
  defaultExpanded?: boolean;
  lastActionDate?: string;
}

export function ChecklistBlock({ 
  section, 
  sectionNumber,
  clientId,
  clientName,
  onToggleItem, 
  onAttachmentChange,
  defaultExpanded = false,
  lastActionDate 
}: ChecklistBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const completedCount = section.items.filter(i => i.completed).length;
  const totalCount = section.items.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const isComplete = progress === 100;
  const isInProgress = progress > 0 && progress < 100;

  return (
    <div className={cn(
      "rounded-xl overflow-hidden transition-all duration-200 border",
      isComplete 
        ? "bg-status-success/5 border-status-success/20" 
        : isInProgress
          ? "bg-primary/5 border-primary/20"
          : "bg-surface-2/50 border-border/30"
    )}>
      {/* Header compacto */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-3/30 transition-colors"
      >
        {/* Número da etapa */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
          isComplete 
            ? "bg-status-success text-status-success-foreground" 
            : isInProgress
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        )}>
          {isComplete ? <CheckCircle2 className="w-4 h-4" /> : sectionNumber}
        </div>

        {/* Título */}
        <div className="flex-1 text-left">
          <h3 className={cn(
            "font-semibold text-sm",
            isComplete ? "text-status-success" : "text-foreground"
          )}>
            {section.title}
          </h3>
        </div>

        {/* Progresso compacto */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  item.completed ? "bg-status-success" : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className={cn(
            "text-xs font-mono font-bold min-w-[40px] text-right",
            isComplete ? "text-status-success" : isInProgress ? "text-primary" : "text-muted-foreground"
          )}>
            {completedCount}/{totalCount}
          </span>
          <div className={cn(
            "p-1 rounded transition-colors",
            isExpanded ? "bg-primary/20 text-primary" : "text-muted-foreground"
          )}>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Lista de itens - design simplificado */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-1">
          {section.items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              clientId={clientId}
              clientName={clientName}
              sectionTitle={section.title}
              onToggle={() => onToggleItem(item.id)}
              onAttachmentChange={(url) => onAttachmentChange?.(item.id, url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}