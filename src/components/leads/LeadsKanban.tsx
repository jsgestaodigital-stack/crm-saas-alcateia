import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Lead, LeadPipelineStage, TEMPERATURE_CONFIG } from '@/types/lead';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, AlertTriangle, Plus, Settings, GripVertical, Upload, Lock } from 'lucide-react';
import { usePipelineColumns } from '@/hooks/usePipelineColumns';
import { ColumnSettingsDialog } from './ColumnSettingsDialog';
import { ImportLeadsDialog } from './ImportLeadsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LeadsKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onMoveLead: (leadId: string, newStage: LeadPipelineStage) => void;
  onRefresh?: () => void;
}

export function LeadsKanban({ leads, onLeadClick, onMoveLead, onRefresh }: LeadsKanbanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [autoScrollDirection, setAutoScrollDirection] = useState<'left' | 'right' | null>(null);
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  
  const { columns, loading: columnsLoading } = usePipelineColumns();
  const { derived } = useAuth();
  const canEditLeads = derived?.canSalesOrAdmin ?? false;

  // Group leads by column
  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    columns.forEach(col => {
      grouped[col.id] = leads.filter(l => l.pipeline_stage === col.id);
    });
    return grouped;
  }, [leads, columns]);

  // Auto-scroll when dragging card near edges
  useEffect(() => {
    if (!isDraggingCard || !autoScrollDirection || !containerRef.current) return;

    const scrollSpeed = 15;
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      
      if (autoScrollDirection === 'left') {
        containerRef.current.scrollLeft -= scrollSpeed;
      } else {
        containerRef.current.scrollLeft += scrollSpeed;
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isDraggingCard, autoScrollDirection]);

  // Global drag events for card detection
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.lead-card')) {
        setIsDraggingCard(true);
      }
    };
    const handleDragEnd = () => {
      setIsDraggingCard(false);
      setAutoScrollDirection(null);
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Detect card drag and auto-scroll zones
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current || !isDraggingCard) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const edgeZone = 150;
    
    const mouseX = e.clientX;
    
    if (mouseX < containerRect.left + edgeZone) {
      setAutoScrollDirection('left');
    } else if (mouseX > containerRect.right - edgeZone) {
      setAutoScrollDirection('right');
    } else {
      setAutoScrollDirection(null);
    }
  }, [isDraggingCard]);

  // Manual scroll (drag to scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    if ((e.target as HTMLElement).closest('.lead-card, button, .column-header')) return;
    
    setIsDraggingContainer(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    setIsDraggingContainer(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingContainer || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDraggingContainer) {
      setIsDraggingContainer(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleCardDragStart = (e: React.DragEvent, leadId: string) => {
    if (!canEditLeads) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (!canEditLeads) return;
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    if (!canEditLeads) return;
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      onMoveLead(leadId, columnId as LeadPipelineStage);
    }
    setDragOverColumn(null);
  };

  if (columnsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="px-4 pt-2 flex justify-end gap-2">
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
                className="gap-2 text-xs border-green-500/30 hover:bg-green-500/10 hover:text-green-400"
              >
                <Upload className="h-3.5 w-3.5" />
                Importar
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Importar oportunidades de planilha CSV ou Excel</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="gap-2 text-xs border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
              >
                <Settings className="h-3.5 w-3.5" />
                Colunas
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Personalizar etapas do funil de vendas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Kanban Container */}
      <div 
        ref={containerRef}
        className="h-[calc(100vh-220px)] overflow-x-auto overflow-y-hidden p-4 select-none"
        style={{ cursor: isDraggingContainer ? 'grabbing' : 'grab' }}
        onDragOver={handleContainerDragOver}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex gap-4 h-full min-w-max pb-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className={cn(
                "flex flex-col w-[300px] min-w-[300px] h-full rounded-xl border-2 transition-all",
                dragOverColumn === column.id 
                  ? "border-amber-500 bg-amber-500/10 scale-[1.01]" 
                  : "border-border/30 bg-surface-1/30"
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={cn(
                "column-header px-4 py-3 border-b border-border/30 rounded-t-xl",
                column.color.replace('bg-', 'bg-') + '/10'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{column.emoji}</span>
                    <span className="font-semibold text-sm">{column.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {leadsByColumn[column.id]?.length || 0}
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {leadsByColumn[column.id]?.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onClick={() => onLeadClick(lead)}
                    onDragStart={(e) => handleCardDragStart(e, lead.id)}
                    canDrag={canEditLeads}
                  />
                ))}
                
                {leadsByColumn[column.id]?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum lead
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column Settings Dialog */}
      <ColumnSettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />

      {/* Import Leads Dialog */}
      <ImportLeadsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}

function LeadCard({ 
  lead, 
  onClick, 
  onDragStart,
  canDrag = true
}: { 
  lead: Lead; 
  onClick: () => void; 
  onDragStart: (e: React.DragEvent) => void;
  canDrag?: boolean;
}) {
  const tempConfig = TEMPERATURE_CONFIG[lead.temperature];
  
  const isOverdue = useMemo(() => {
    if (!lead.next_action_date || lead.status !== 'open') return false;
    return isBefore(parseISO(lead.next_action_date), new Date()) && !isToday(parseISO(lead.next_action_date));
  }, [lead.next_action_date, lead.status]);

  const isTodays = useMemo(() => {
    if (!lead.next_action_date || lead.status !== 'open') return false;
    return isToday(parseISO(lead.next_action_date));
  }, [lead.next_action_date, lead.status]);

  const isHot = lead.temperature === 'hot';

  return (
    <div
      draggable={canDrag}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "lead-card group",
        isHot && "is-hot",
        isOverdue && "is-overdue ring-2 ring-amber-500/50",
        isTodays && "ring-2 ring-blue-500/50",
        !canDrag && "cursor-pointer"
      )}
    >
      {/* Temperature Badge */}
      <div className="flex items-center justify-between mb-2">
        <Badge 
          variant="outline" 
          className={cn("text-[10px] font-semibold", tempConfig.color)}
        >
          {tempConfig.emoji} {tempConfig.label}
        </Badge>
        {lead.probability > 0 && (
          <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
            {lead.probability}%
          </span>
        )}
      </div>

      {/* Company Name */}
      <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-amber-400 transition-colors">
        {lead.company_name}
      </h3>

      {/* Contact Name */}
      {lead.contact_name && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <User className="h-3 w-3" />
          {lead.contact_name}
        </p>
      )}

      {/* Next Action */}
      {lead.next_action && (
        <div className={cn(
          "text-xs p-2 rounded-md mb-2",
          isOverdue 
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
            : isTodays
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
              : "bg-muted/20 text-muted-foreground"
        )}>
          <div className="flex items-center gap-1 mb-1">
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            {lead.next_action_date && (
              <span className="font-medium">
                {format(parseISO(lead.next_action_date), "dd/MM", { locale: ptBR })}
              </span>
            )}
          </div>
          <p className="line-clamp-2">{lead.next_action}</p>
        </div>
      )}

      {/* Estimated Value */}
      {lead.estimated_value && lead.estimated_value > 0 && (
        <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">R$</span>
          {lead.estimated_value.toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}
