import { useRef, useState, useEffect, useCallback } from "react";
import { COLUMNS, Client, ColumnId } from "@/types/client";
import { useClientStore } from "@/stores/clientStore";
import { KanbanColumn } from "./KanbanColumn";
import { RecurrenceConversionDialog } from "./RecurrenceConversionDialog";
import { NewClientWizard } from "./NewClientWizard";
import { useRecurring } from "@/hooks/useRecurring";
import { toast } from "sonner";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { useNavigate } from "react-router-dom";

export function KanbanBoard() {
  const { clients, setSelectedClient, updateClient } = useClientStore();
  const { addRecurringClient } = useRecurring();
  const { setMode } = useFunnelMode();
  const navigate = useNavigate();

  // No funil de Otimização, não exibimos clientes já marcados como recorrentes
  const optimizationClients = clients.filter((c) => c.planType !== "recurring");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [autoScrollDirection, setAutoScrollDirection] = useState<'left' | 'right' | null>(null);
  
  // Recurrence conversion dialog state
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
  const [clientToConvert, setClientToConvert] = useState<Client | null>(null);
  
  // New client wizard state
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [initialColumnId, setInitialColumnId] = useState<ColumnId>("onboarding");

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
      console.log("Converting client to recurring:", client.companyName);
      
      // Create recurring client
      const newRecurringClient = await addRecurringClient({
        client_id: client.id,
        company_name: client.companyName,
        responsible_name: client.responsible,
      });

      if (newRecurringClient) {
        console.log("Recurring client created:", newRecurringClient.id);
        
        // Marca o cliente como recorrente (sem enviar para a lixeira)
        await updateClient(client.id, {
          planType: "recurring",
          lastUpdate: new Date().toISOString(),
        });
        
        toast.success(`${client.companyName} convertido para Recorrência!`, {
          description: "O cliente foi movido para o funil de Recorrência e as tarefas foram criadas.",
          action: {
            label: "Ver Recorrência",
            onClick: () => {
              setMode('recurring');
              navigate('/recorrencia');
            }
          }
        });
      } else {
        console.error("Failed to create recurring client - addRecurringClient returned null");
        toast.error("Erro ao converter cliente para recorrência", {
          description: "Verifique se você tem permissão de acesso ao módulo de recorrência."
        });
      }
    } catch (error) {
      console.error("Error converting to recurring:", error);
      toast.error("Erro ao converter cliente para recorrência", {
        description: "Ocorreu um erro inesperado. Tente novamente."
      });
    }
  };

  const handleDeclineRecurrence = () => {
    setClientToConvert(null);
  };

  const handleAddClient = (columnId: ColumnId) => {
    setInitialColumnId(columnId);
    setNewClientOpen(true);
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
              clients={optimizationClients.filter((c) => c.columnId === column.id)}
              allClients={optimizationClients}
              onClientClick={setSelectedClient}
              onConvertToRecurring={handleConvertToRecurring}
              onDropToFinalized={handleConvertToRecurring}
              onAddClient={handleAddClient}
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

      {/* New Client Wizard */}
      <NewClientWizard 
        open={newClientOpen} 
        onOpenChange={setNewClientOpen}
        initialColumnId={initialColumnId}
      />
    </>
  );
}
