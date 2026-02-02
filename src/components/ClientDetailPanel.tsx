import { useState } from "react";
import { X, ExternalLink, FolderOpen, MessageCircle, Globe, FileText, Image, History, Check, Paperclip, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, formatDate, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/clientUtils";
import { COLUMNS } from "@/types/client";
import { ChecklistBlock } from "./checklist/ChecklistBlock";
import { RecurrenceConversionDialog } from "./RecurrenceConversionDialog";
import { useRecurring } from "@/hooks/useRecurring";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getResponsibleLabel, toResponsibleRole } from "@/lib/responsibleTemplate";

export function ClientDetailPanel() {
  const { selectedClient, isDetailOpen, setDetailOpen, toggleChecklistItem, updateChecklistItemAttachment, updateClient } = useClientStore();
  const { addRecurringClient } = useRecurring();
  const { setMode } = useFunnelMode();
  const navigate = useNavigate();
  
  // Recurrence conversion dialog state
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);

  if (!selectedClient) return null;

  const progress = calculateProgress(selectedClient);
  const currentColumn = COLUMNS.find(c => c.id === selectedClient.columnId);

  // Calculate stats by role (template)
  const allItems = (selectedClient.checklist || []).flatMap(s => s?.items || []);
  const managerItems = allItems.filter(i => toResponsibleRole(i.responsible) === "manager");
  const opsItems = allItems.filter(i => toResponsibleRole(i.responsible) === "ops");
  const managerProgress = managerItems.length > 0 
    ? Math.round((managerItems.filter(i => i.completed).length / managerItems.length) * 100) 
    : 0;
  const opsProgress = opsItems.length > 0 
    ? Math.round((opsItems.filter(i => i.completed).length / opsItems.length) * 100) 
    : 0;

  const handleToggleItem = (sectionId: string, itemId: string) => {
    toggleChecklistItem(selectedClient.id, sectionId, itemId);
  };

  const handleAttachmentChange = (sectionId: string, itemId: string, url: string) => {
    updateChecklistItemAttachment?.(selectedClient.id, sectionId, itemId, url);
  };

  const handleConvertToRecurring = async () => {
    try {
      const newRecurringClient = await addRecurringClient({
        client_id: selectedClient.id,
        company_name: selectedClient.companyName,
        responsible_name: selectedClient.responsible,
      });

      if (newRecurringClient) {
        // CORREÇÃO: Marca como recorrente SEM enviar para lixeira
        // Apenas atualiza o planType - o cliente sai do Kanban de Otimização naturalmente
        await updateClient(selectedClient.id, {
          planType: "recurring",
          lastUpdate: new Date().toISOString(),
        });
        
        toast.success(`${selectedClient.companyName} convertido para Recorrência!`, {
          description: "O cliente foi movido para o funil de Recorrência e as tarefas foram criadas.",
          action: {
            label: "Ver Recorrência",
            onClick: () => {
              setMode('recurring');
              navigate('/recorrencia');
            }
          }
        });
        
        setDetailOpen(false);
      } else {
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
    // Just close the dialog
  };

  // Show convert button only for non-recurring clients not suspended
  const showConvertButton = selectedClient.planType !== "recurring" && selectedClient.columnId !== "suspended";

  return (
    <Sheet open={isDetailOpen} onOpenChange={setDetailOpen}>
      <SheetContent hideCloseButton className="w-full sm:max-w-2xl bg-surface-1 border-l border-border/50 p-0 overflow-hidden slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-gradient-to-br from-surface-2 to-surface-3/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{currentColumn?.emoji}</span>
                <Badge variant="outline" className="text-xs">
                  {currentColumn?.title}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {selectedClient.companyName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedClient.mainCategory}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDetailOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Progresso Geral */}
            <div className="bg-surface-1/50 rounded-xl p-4 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className={`text-xl font-mono font-bold ${
                  progress >= 80 ? "text-status-success" : progress >= 40 ? "text-status-warning" : "text-status-danger"
                }`}>
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Gestor (Comercial) */}
            <div className="bg-status-info/10 rounded-xl p-4 border border-status-info/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-status-info">Gestor (Comercial)</span>
                <span className="text-xl font-mono font-bold text-status-info">{managerProgress}%</span>
              </div>
              <div className="h-2 bg-surface-1 rounded-full overflow-hidden">
                <div className="h-full bg-status-info rounded-full" style={{ width: `${managerProgress}%` }} />
              </div>
            </div>

            {/* Operacional */}
            <div className="bg-status-purple/10 rounded-xl p-4 border border-status-purple/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-status-purple">Operacional</span>
                <span className="text-xl font-mono font-bold text-status-purple">{opsProgress}%</span>
              </div>
              <div className="h-2 bg-surface-1 rounded-full overflow-hidden">
                <div className="h-full bg-status-purple rounded-full" style={{ width: `${opsProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Status & Plan */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`status-badge ${getStatusColor(selectedClient.status)}`}>
              {getStatusLabel(selectedClient.status)}
            </span>
            <Badge variant={selectedClient.planType === "recurring" ? "default" : "secondary"}>
              {selectedClient.planType === "recurring" ? "Recorrente" : "Único"}
            </Badge>
            <Badge variant="outline">
              {selectedClient.isOwner ? "Cliente é dono" : "Gerenciado"}
            </Badge>
            
            {/* Convert to Recurring Button */}
            {showConvertButton && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 ml-auto border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                onClick={() => setRecurrenceDialogOpen(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Fechou Recorrência
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="checklist" className="flex-1 flex flex-col h-[calc(100vh-320px)]">
          <TabsList className="flex flex-nowrap gap-1 px-2 sm:px-4 pt-4 bg-transparent border-b border-border/30 rounded-none h-auto pb-0 overflow-x-auto w-max min-w-full sm:w-full">
            <TabsTrigger value="checklist" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-2 sm:px-4 whitespace-nowrap">
              <Check className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-2 sm:px-4 whitespace-nowrap">
              <FileText className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="uploads" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-2 sm:px-4 whitespace-nowrap">
              <Image className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Uploads</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-2 sm:px-4 whitespace-nowrap">
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Checklist Tab - Nova experiência visual */}
          <TabsContent value="checklist" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="space-y-3">
              {(selectedClient.checklist || []).map((section, index) => (
                <ChecklistBlock
                  key={section.id}
                  section={section}
                  sectionNumber={index + 1}
                  clientId={selectedClient.id}
                  clientName={selectedClient.companyName}
                  onToggleItem={(itemId) => handleToggleItem(section.id, itemId)}
                  onAttachmentChange={(itemId, url) => handleAttachmentChange(section.id, itemId, url)}
                  lastActionDate={selectedClient.lastUpdate}
                  defaultExpanded={(section?.items || []).some(i => !i.completed) && !(selectedClient.checklist || []).slice(0, index).some(s => (s?.items || []).some(i => !i.completed))}
                />
              ))}
            </div>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="space-y-4">
              {/* Links */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground mb-3">Links Rápidos</h4>
                
                {selectedClient.googleProfileUrl && (
                  <a href={selectedClient.googleProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors group">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-sm">Perfil Google Meu Negócio</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                )}

                {selectedClient.driveUrl && (
                  <a href={selectedClient.driveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors group">
                    <FolderOpen className="w-5 h-5 text-status-warning" />
                    <span className="flex-1 text-sm">Pasta do Drive</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                )}

                {selectedClient.whatsappGroupUrl && (
                  <a href={selectedClient.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors group">
                    <MessageCircle className="w-5 h-5 text-status-success" />
                    <span className="flex-1 text-sm">Grupo WhatsApp</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div>
                  <label className="text-xs text-muted-foreground">Responsável</label>
                  <p className="text-sm font-medium">{getResponsibleLabel(selectedClient.responsible)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Data de Início</label>
                  <p className="text-sm font-medium">{formatDate(selectedClient.startDate)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Última Atualização</label>
                  <p className="text-sm font-medium">{formatDate(selectedClient.lastUpdate)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tipo de Plano</label>
                  <p className="text-sm font-medium">{selectedClient.planType === "recurring" ? "Recorrente" : "Único"}</p>
                </div>
              </div>

              {/* Keywords */}
              {selectedClient.keywords && selectedClient.keywords.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <label className="text-xs text-muted-foreground block mb-2">Palavras-chave</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedClient.notes && (
                <div className="pt-4 border-t border-border/30">
                  <label className="text-xs text-muted-foreground block mb-2">Observações</label>
                  <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
                    {selectedClient.notes}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Uploads Tab */}
          <TabsContent value="uploads" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Comparativos Antes/Depois</h4>
              
              {selectedClient.comparisons.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/30 rounded-lg">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum comparativo adicionado</p>
                  <Button variant="outline" className="mt-4">
                    Adicionar Comparativo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedClient.comparisons.map((comparison) => (
                    <div key={comparison.id} className="border border-border/30 rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-3">{comparison.title}</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border/30">
                          <div className="text-center">
                            <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <span className="text-xs text-muted-foreground">Antes</span>
                          </div>
                        </div>
                        <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border/30">
                          <div className="text-center">
                            <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <span className="text-xs text-muted-foreground">Depois</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border/30" />
              
              <div className="space-y-4">
                {[...selectedClient.history].reverse().map((entry) => (
                  <div key={entry.id} className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-surface-2 border border-border/50 flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-foreground">{entry.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getResponsibleLabel(entry.user)} • {formatDateTime(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recurrence Conversion Dialog */}
        <RecurrenceConversionDialog
          open={recurrenceDialogOpen}
          onOpenChange={setRecurrenceDialogOpen}
          client={selectedClient}
          onConfirm={handleConvertToRecurring}
          onDecline={handleDeclineRecurrence}
        />
      </SheetContent>
    </Sheet>
  );
}
