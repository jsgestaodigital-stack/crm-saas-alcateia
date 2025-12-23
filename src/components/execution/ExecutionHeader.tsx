import { useState } from "react";
import { ArrowLeft, FolderOpen, MessageCircle, Globe, User, Timer, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Client, COLUMNS } from "@/types/client";
import { calculateProgress } from "@/lib/clientUtils";
import { getDaysRemaining } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { toResponsibleRole } from "@/lib/responsibleTemplate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClientStore } from "@/stores/clientStore";
import { AskQuestionButton } from "@/components/AskQuestionButton";

interface ExecutionHeaderProps {
  client: Client;
  onBack: () => void;
}

/**
 * Execution View Header Component
 */
export function ExecutionHeader({ client, onBack }: ExecutionHeaderProps) {
  const { updateClient } = useClientStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    companyName: client.companyName,
    mainCategory: client.mainCategory,
    whatsappGroupUrl: client.whatsappGroupUrl || "",
    driveUrl: client.driveUrl || "",
    googleProfileUrl: client.googleProfileUrl || "",
  });

  const progress = calculateProgress(client);
  const currentColumn = COLUMNS.find(c => c.id === client.columnId);
  const daysRemaining = getDaysRemaining(client.startDate);

  // Calculate stats by role (template)
  const allItems = client.checklist.flatMap(s => s.items);
  const managerItems = allItems.filter(i => toResponsibleRole(i.responsible) === "manager");
  const opsItems = allItems.filter(i => toResponsibleRole(i.responsible) === "ops");
  const managerCompleted = managerItems.filter(i => i.completed).length;
  const opsCompleted = opsItems.filter(i => i.completed).length;

  const handleOpenEdit = () => {
    setEditData({
      companyName: client.companyName,
      mainCategory: client.mainCategory,
      whatsappGroupUrl: client.whatsappGroupUrl || "",
      driveUrl: client.driveUrl || "",
      googleProfileUrl: client.googleProfileUrl || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editData.companyName.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    // Call store directly
    updateClient(client.id, {
      companyName: editData.companyName.trim(),
      mainCategory: editData.mainCategory.trim(),
      whatsappGroupUrl: editData.whatsappGroupUrl.trim() || undefined,
      driveUrl: editData.driveUrl.trim() || undefined,
      googleProfileUrl: editData.googleProfileUrl.trim() || undefined,
      lastUpdate: new Date().toISOString(),
    });

    setIsEditOpen(false);
    toast.success("Cliente atualizado com sucesso!");
  };

  return (
    <>
      <header className="px-4 py-3 border-b border-border/30 bg-surface-1/80 backdrop-blur-sm flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="gap-2 font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>

        <div className="h-6 w-px bg-border/50" />

        {/* Client Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {client.profileImage ? (
            <img src={client.profileImage} alt="" className="w-10 h-10 rounded-full object-cover border border-primary/30" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="font-bold text-primary">{client.companyName.charAt(0)}</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground truncate">{client.companyName}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handleOpenEdit}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground truncate">{client.mainCategory}</p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className={cn(
          "px-3 py-1.5 rounded-lg font-mono font-bold text-lg",
          progress >= 80 ? "bg-status-success/20 text-status-success" :
          progress >= 40 ? "bg-status-warning/20 text-status-warning" :
          "bg-status-danger/20 text-status-danger"
        )}>
          {progress}%
        </div>

        {/* Deadline */}
        <div className={cn(
          "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
          daysRemaining <= 0 ? "bg-status-danger/20 text-status-danger" :
          daysRemaining <= 7 ? "bg-status-warning/20 text-status-warning" :
          "bg-primary/10 text-primary"
        )}>
          <Timer className="w-4 h-4" />
          {Math.max(0, daysRemaining)}d
        </div>

        {/* Team Progress */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs" aria-label="Gestor (Comercial)">
            <div className="w-6 h-6 rounded-full bg-status-info/20 flex items-center justify-center">
              <User className="w-3 h-3 text-status-info" />
            </div>
            <span className="font-mono text-status-info">{managerCompleted}/{managerItems.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" aria-label="Operacional">
            <div className="w-6 h-6 rounded-full bg-status-purple/20 flex items-center justify-center">
              <User className="w-3 h-3 text-status-purple" />
            </div>
            <span className="font-mono text-status-purple">{opsCompleted}/{opsItems.length}</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="hidden md:flex items-center gap-1">
          {client.whatsappGroupUrl && (
            <a href={client.whatsappGroupUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="w-8 h-8 text-status-success hover:bg-status-success/10">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </a>
          )}
          {client.driveUrl && (
            <a href={client.driveUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-primary/10">
                <FolderOpen className="w-4 h-4" />
              </Button>
            </a>
          )}
          {client.googleProfileUrl && (
            <a href={client.googleProfileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-primary/10">
                <Globe className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>

        {/* Ask Question Button */}
        <AskQuestionButton clientId={client.id} clientName={client.companyName} />

        {/* Badge */}
        <Badge variant="outline" className="hidden xl:flex border-primary/30">
          {currentColumn?.emoji} {currentColumn?.title}
        </Badge>
      </header>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-surface-1 border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={editData.companyName}
                onChange={(e) => setEditData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Ex: Posto Morretes"
                className="bg-surface-2 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainCategory">Categoria</Label>
              <Input
                id="mainCategory"
                value={editData.mainCategory}
                onChange={(e) => setEditData(prev => ({ ...prev, mainCategory: e.target.value }))}
                placeholder="Ex: Posto de Combustível"
                className="bg-surface-2 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappGroupUrl">WhatsApp (URL do grupo)</Label>
              <Input
                id="whatsappGroupUrl"
                value={editData.whatsappGroupUrl}
                onChange={(e) => setEditData(prev => ({ ...prev, whatsappGroupUrl: e.target.value }))}
                placeholder="https://chat.whatsapp.com/..."
                className="bg-surface-2 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driveUrl">Google Drive (URL da pasta)</Label>
              <Input
                id="driveUrl"
                value={editData.driveUrl}
                onChange={(e) => setEditData(prev => ({ ...prev, driveUrl: e.target.value }))}
                placeholder="https://drive.google.com/..."
                className="bg-surface-2 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleProfileUrl">Perfil Google Meu Negócio</Label>
              <Input
                id="googleProfileUrl"
                value={editData.googleProfileUrl}
                onChange={(e) => setEditData(prev => ({ ...prev, googleProfileUrl: e.target.value }))}
                placeholder="https://business.google.com/..."
                className="bg-surface-2 border-border/50"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="flex-1 bg-primary hover:bg-primary/90">
              <Check className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
