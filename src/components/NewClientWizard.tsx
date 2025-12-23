import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useClientStore } from "@/stores/clientStore";
import { DEFAULT_CHECKLIST, PhotoMode, ColumnId } from "@/types/client";
import { findPotentialDuplicates, DuplicateMatch } from "@/lib/duplicateUtils";
import { toast } from "sonner";
import { 
  Building2, Camera, ChevronDown, Sparkles, Flame, User, AlertTriangle, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewClientWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialColumnId?: ColumnId;
}

export function NewClientWizard({ open, onOpenChange, initialColumnId }: NewClientWizardProps) {
  const { clients, setSelectedClient, setDetailOpen } = useClientStore();
  const [companyName, setCompanyName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [responsible, setResponsible] = useState<string>("Operador");
  const [photoMode, setPhotoMode] = useState<PhotoMode>("pending");
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [googleProfileUrl, setGoogleProfileUrl] = useState("");
  const [briefing, setBriefing] = useState("");
  const [columnId, setColumnId] = useState<ColumnId>(initialColumnId || "onboarding");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);

  // Check for potential duplicates
  const potentialDuplicates = useMemo(() => {
    if (!companyName.trim() || ignoreDuplicates) return [];
    return findPotentialDuplicates(companyName, clients);
  }, [companyName, clients, ignoreDuplicates]);

  const hasDuplicateWarning = potentialDuplicates.length > 0;

  // Update columnId when initialColumnId changes
  useEffect(() => {
    if (initialColumnId) {
      setColumnId(initialColumnId);
    }
  }, [initialColumnId]);

  const resetForm = () => {
    setCompanyName("");
    setMainCategory("");
    setResponsible("Operador");
    setPhotoMode("pending");
    setWhatsappGroupUrl("");
    setDriveUrl("");
    setGoogleProfileUrl("");
    setBriefing("");
    setColumnId(initialColumnId || "onboarding");
    setShowAdvanced(false);
    setIgnoreDuplicates(false);
  };

  const handleOpenExisting = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setDetailOpen(true);
      onOpenChange(false);
      resetForm();
    }
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      toast.error("Nome da empresa é obrigatório!");
      return;
    }

    // If duplicates found and not ignored, warn user
    if (hasDuplicateWarning && !ignoreDuplicates) {
      toast.warning("Verifique os clientes similares antes de criar um novo.");
      return;
    }

    const newClient = {
      companyName: companyName.trim(),
      mainCategory: mainCategory.trim() || undefined,
      planType: "unique" as const,
      isOwner: false,
      responsible,
      startDate: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString(),
      status: "on_track" as const,
      columnId,
      checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
      comparisons: [],
      history: [{
        id: `h-${Date.now()}`,
        action: "Cliente criado no sistema",
        user: responsible,
        timestamp: new Date().toISOString(),
      }],
      photoMode,
      whatsappGroupUrl: whatsappGroupUrl.trim() || undefined,
      driveUrl: driveUrl.trim() || undefined,
      googleProfileUrl: googleProfileUrl.trim() || undefined,
      briefing: briefing.trim() || undefined,
      attachments: [],
    };

    const { addClient } = useClientStore.getState();
    await addClient(newClient);
    
    resetForm();
    onOpenChange(false);
  };

  const getColumnLabel = (colId: string) => {
    const labels: Record<string, string> = {
      pipeline: "Para Entrar",
      onboarding: "Onboarding",
      optimization: "Em Otimização",
      ready_to_deliver: "Pronto p/ Entregar",
      delivered: "Entregue",
      suspended: "Suspenso",
      finalized: "Finalizados",
    };
    return labels[colId] || colId;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="bg-surface-1 border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Novo Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Essential: Company Name */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Nome da Empresa *</Label>
            <Input
              placeholder="Ex: Barbearia Premium"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                setIgnoreDuplicates(false); // Reset ignore when name changes
              }}
              className={cn(
                "bg-surface-2 border-border",
                hasDuplicateWarning && "border-status-warning"
              )}
              autoFocus
            />
          </div>

          {/* Duplicate Warning */}
          {hasDuplicateWarning && (
            <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 space-y-2">
              <div className="flex items-center gap-2 text-status-warning">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Possíveis duplicatas encontradas</span>
              </div>
              <div className="space-y-2">
                {potentialDuplicates.slice(0, 3).map((match) => (
                  <div 
                    key={match.client.id}
                    className="flex items-center justify-between p-2 rounded bg-surface-2/50 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{match.client.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {getColumnLabel(match.client.columnId)} • {Math.round(match.similarity * 100)}% similar
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1 text-primary"
                      onClick={() => handleOpenExisting(match.client.id)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Abrir
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIgnoreDuplicates(true)}
              >
                Não é duplicata, criar mesmo assim
              </Button>
            </div>
          )}

          {/* Essential: Category */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Categoria</Label>
            <Input
              placeholder="Ex: Restaurante, Clínica, Loja..."
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value)}
              className="bg-surface-2 border-border"
            />
          </div>

          {/* Quick Select: Stage */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Estágio</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setColumnId("pipeline")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm",
                  columnId === "pipeline" 
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-400" 
                    : "bg-surface-2 border-border hover:border-orange-500/30"
                )}
              >
                <Flame className="w-4 h-4" />
                Para Entrar
              </button>
              <button
                type="button"
                onClick={() => setColumnId("onboarding")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm",
                  columnId === "onboarding" 
                    ? "bg-status-info/20 border-status-info/50 text-status-info" 
                    : "bg-surface-2 border-border hover:border-status-info/30"
                )}
              >
                <Building2 className="w-4 h-4" />
                Onboarding
              </button>
            </div>
          </div>

          {/* Quick Select: Responsible */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Responsável</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResponsible("Admin")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm",
                  responsible === "Admin" 
                    ? "bg-status-info/20 border-status-info/50 text-status-info" 
                    : "bg-surface-2 border-border hover:border-status-info/30"
                )}
              >
                <User className="w-4 h-4" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setResponsible("Operador")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm",
                  responsible === "Operador" 
                    ? "bg-status-purple/20 border-status-purple/50 text-status-purple" 
                    : "bg-surface-2 border-border hover:border-status-purple/30"
                )}
              >
                <User className="w-4 h-4" />
                Operador
              </button>
              <button
                type="button"
                onClick={() => setResponsible("Designer")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm",
                  responsible === "Designer" 
                    ? "bg-status-success/20 border-status-success/50 text-status-success" 
                    : "bg-surface-2 border-border hover:border-status-success/30"
                )}
              >
                <User className="w-4 h-4" />
                Designer
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2">
              <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
              {showAdvanced ? "Menos opções" : "Mais opções"}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Photo Mode */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Fotos</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoMode("with_photos")}
                    className={cn(
                      "flex-1 p-2 rounded-lg border text-xs transition-all",
                      photoMode === "with_photos" 
                        ? "bg-primary/20 border-primary/50" 
                        : "bg-surface-2 border-border"
                    )}
                  >
                    <Camera className="w-4 h-4 mx-auto mb-1" />
                    João tira
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode("without_photos")}
                    className={cn(
                      "flex-1 p-2 rounded-lg border text-xs transition-all",
                      photoMode === "without_photos" 
                        ? "bg-primary/20 border-primary/50" 
                        : "bg-surface-2 border-border"
                    )}
                  >
                    <Camera className="w-4 h-4 mx-auto mb-1" />
                    Cliente envia
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode("pending")}
                    className={cn(
                      "flex-1 p-2 rounded-lg border text-xs transition-all",
                      photoMode === "pending" 
                        ? "bg-primary/20 border-primary/50" 
                        : "bg-surface-2 border-border"
                    )}
                  >
                    <Camera className="w-4 h-4 mx-auto mb-1" />
                    A definir
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">WhatsApp</Label>
                  <Input
                    placeholder="Link do grupo"
                    value={whatsappGroupUrl}
                    onChange={(e) => setWhatsappGroupUrl(e.target.value)}
                    className="bg-surface-2 border-border h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Google Drive</Label>
                  <Input
                    placeholder="Link da pasta"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="bg-surface-2 border-border h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Perfil Google Meu Negócio</Label>
                <Input
                  placeholder="Link do perfil"
                  value={googleProfileUrl}
                  onChange={(e) => setGoogleProfileUrl(e.target.value)}
                  className="bg-surface-2 border-border h-9 text-sm"
                />
              </div>

              {/* Briefing */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Notas iniciais</Label>
                <Textarea
                  placeholder="Observações, briefing inicial..."
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  className="bg-surface-2 border-border min-h-[60px] text-sm resize-none"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!companyName.trim()}
            className={cn(
              "flex-1",
              hasDuplicateWarning && !ignoreDuplicates
                ? "bg-status-warning hover:bg-status-warning/90"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {hasDuplicateWarning && !ignoreDuplicates ? "Verificar Duplicatas" : "Criar Cliente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
