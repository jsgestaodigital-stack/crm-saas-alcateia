import { useEffect } from "react";
import { useClientStore } from "@/stores/clientStore";
import { toast } from "sonner";
import { ExecutionHeader } from "@/components/execution/ExecutionHeader";
import { ExecutionExtras } from "@/components/execution/ExecutionExtras";
import { ExecutionChecklist } from "@/components/execution/ExecutionChecklist";

/**
 * Refactored Client Execution View
 * Item 1: Keep components < 300 lines (was 378, now ~100)
 */
export function ClientExecutionView() {
  const { 
    selectedClient, 
    isDetailOpen, 
    setDetailOpen, 
    toggleChecklistItem, 
    updateChecklistItemAttachment, 
    addAttachment, 
    removeAttachment, 
    updateClient 
  } = useClientStore();

  // Handle paste (Ctrl+V) for attachments
  useEffect(() => {
    if (!selectedClient || !isDetailOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              addAttachment(selectedClient.id, base64);
              toast.success("Imagem anexada com sucesso!");
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [selectedClient, isDetailOpen, addAttachment]);

  if (!selectedClient || !isDetailOpen) return null;

  // Find current block in checklist
  const currentBlockIndex = (selectedClient.checklist || []).findIndex(section => 
    section?.items?.some(item => !item.completed)
  );

  const handleToggleItem = (sectionId: string, itemId: string) => {
    toggleChecklistItem(selectedClient.id, sectionId, itemId);
  };

  const handleAttachmentChange = (sectionId: string, itemId: string, url: string) => {
    updateChecklistItemAttachment?.(selectedClient.id, sectionId, itemId, url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      <div className="h-full flex flex-col">
        <ExecutionHeader 
          client={selectedClient} 
          onBack={() => setDetailOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <ExecutionExtras
              client={selectedClient}
              onUpdateClient={(updates) => updateClient(selectedClient.id, updates)}
              onAddAttachment={(url) => addAttachment(selectedClient.id, url)}
              onRemoveAttachment={(url) => removeAttachment(selectedClient.id, url)}
            />

            <ExecutionChecklist
              checklist={selectedClient.checklist}
              currentStageIndex={currentBlockIndex}
              lastUpdate={selectedClient.lastUpdate}
              clientId={selectedClient.id}
              clientName={selectedClient.companyName}
              onToggleItem={handleToggleItem}
              onAttachmentChange={handleAttachmentChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
