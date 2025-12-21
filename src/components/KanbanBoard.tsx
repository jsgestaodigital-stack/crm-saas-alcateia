import { useRef, useState, useEffect, useCallback } from "react";
import { COLUMNS, Client } from "@/types/client";
import { useClientStore } from "@/stores/clientStore";
import { KanbanColumn } from "./KanbanColumn";
import { RecurrenceConversionDialog } from "./RecurrenceConversionDialog";
import { useRecurring } from "@/hooks/useRecurring";
import { toast } from "sonner";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { useNavigate } from "react-router-dom";

export function KanbanBoard() {
  const { clients, setSelectedClient, deleteClient } = useClientStore();
  const { addRecurringClient, generateAllTasks } = useRecurring();
  const { setMode } = useFunnelMode();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [autoScrollDirection, setAutoScrollDirection] = useState<'left' | 'right' | null>(null);
  
  // Recurrence conversion dialog state
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
  const [clientToConvert, setClientToConvert] = useState<Client | null>(null);

  // Auto-scroll when dragging card near edges
  useEffect(() => {
    if (!isDraggingCard || !autoScrollDirection || !containerRef.current) return;

    const scrollSpeed = 8;
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

  // Detect card drag and auto-scroll zones
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const edgeZone = 100; // pixels from edge to trigger auto-scroll
    
    const mouseX = e.clientX;
    
    if (mouseX < containerRect.left + edgeZone) {
      setAutoScrollDirection('left');
    } else if (mouseX > containerRect.right - edgeZone) {
      setAutoScrollDirection('right');
    } else {
      setAutoScrollDirection(null);
    }
  }, []);

  // Global drag events for card detection
  useEffect(() => {
    const handleDragStart = () => setIsDraggingCard(true);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    // Only start drag if clicking on the container background, not on cards
    if ((e.target as HTMLElement).closest(".kanban-card")) return;
    
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    containerRef.current.style.cursor = "grabbing";
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = "grab";
      }
    }
  };

  // Handle convert to recurring
  const handleConvertToRecurring = (client: Client) => {
    setClientToConvert(client);
    setRecurrenceDialogOpen(true);
  };

  const handleConfirmRecurrence = async (client: Client) => {
    try {
      // Create recurring client
      const newRecurringClient = await addRecurringClient({
        client_id: client.id,
        company_name: client.companyName,
        responsible_name: client.responsible,
      });

      if (newRecurringClient) {
        // Generate tasks for the new client
        await generateAllTasks();
        
        // Remove from clients (soft delete or move to finalized)
        await deleteClient(client.id);
        
        toast.success(`${client.companyName} convertido para Recorrência!`, {
          description: "O cliente foi movido para o funil de Recorrência.",
          action: {
            label: "Ver Recorrência",
            onClick: () => {
              setMode('recurring');
              navigate('/recorrencia');
            }
          }
        });
      }
    } catch (error) {
      console.error("Error converting to recurring:", error);
      toast.error("Erro ao converter cliente para recorrência");
    }
  };

  const handleDeclineRecurrence = () => {
    setClientToConvert(null);
  };

  return (
    <>
      <div
        ref={containerRef}
        data-tour="kanban-board"
        className="flex gap-3 sm:gap-4 p-3 sm:p-6 overflow-x-auto pb-8 min-h-[calc(100vh-12rem)] cursor-grab select-none touch-pan-x animate-fade-in scroll-smooth"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDragOver={handleDragOver}
      >
        {/* Auto-scroll indicators */}
        {isDraggingCard && (
          <>
            <div className={`fixed left-0 top-1/2 -translate-y-1/2 w-16 h-32 bg-gradient-to-r from-primary/30 to-transparent pointer-events-none z-50 transition-opacity ${autoScrollDirection === 'left' ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`fixed right-0 top-1/2 -translate-y-1/2 w-16 h-32 bg-gradient-to-l from-primary/30 to-transparent pointer-events-none z-50 transition-opacity ${autoScrollDirection === 'right' ? 'opacity-100' : 'opacity-0'}`} />
          </>
        )}
        
        {COLUMNS.map((column, index) => (
          <div 
            key={column.id}
            className="animate-slide-in-left"
            style={{ animationDelay: `${index * 75}ms` }}
          >
          <KanbanColumn
              column={column}
              clients={clients.filter((c) => c.columnId === column.id)}
              allClients={clients}
              onClientClick={setSelectedClient}
              onConvertToRecurring={handleConvertToRecurring}
              onDropToFinalized={handleConvertToRecurring}
            />
          </div>
        ))}
      </div>

      {/* Recurrence Conversion Dialog */}
      <RecurrenceConversionDialog
        open={recurrenceDialogOpen}
        onOpenChange={setRecurrenceDialogOpen}
        client={clientToConvert}
        onConfirm={handleConfirmRecurrence}
        onDecline={handleDeclineRecurrence}
      />
    </>
  );
}
