import { useState, useRef, useMemo } from "react";
import { Client, CoverConfig, ClientLabel } from "@/types/client";
import { calculateProgress, getDaysAgo, getDaysSinceUpdate, getClientUrgency } from "@/lib/clientUtils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Clock, X, MoreHorizontal, AlertTriangle, RotateCcw, Tag, Paperclip, Plus, Check, User, Trash2, Upload, Image, PauseCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/stores/clientStore";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const COVER_COLORS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", 
  "#eab308", "#06b6d4", "#64748b", "#ef4444", "#10b981"
];

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  onConvertToRecurring?: (client: Client) => void;
}

export function ClientCard({ client, onClick, onConvertToRecurring }: ClientCardProps) {
  const progress = calculateProgress(client);
  const { 
    updateClientCover, 
    updateClientProfileImage, 
    resetClientUpdateDate,
    addLabelToClient,
    removeLabelFromClient,
    availableLabels,
    createLabel,
    addAttachment,
    deleteClient
  } = useClientStore();
  const [showMenu, setShowMenu] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#22c55e");
  const [showNewLabel, setShowNewLabel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const daysSinceUpdate = getDaysSinceUpdate(client.lastUpdate);
  const isStalled = daysSinceUpdate >= 3 && client.columnId !== "delivered" && client.columnId !== "finalized";
  const urgency = getClientUrgency(client);
  
  // Calculate days suspended
  const daysSuspended = useMemo(() => {
    if (client.columnId !== "suspended") return null;
    // Use suspendedAt if available, otherwise use lastUpdate
    const suspendedDate = client.suspendedAt || client.lastUpdate;
    if (!suspendedDate) return null;
    const now = new Date();
    const suspended = new Date(suspendedDate);
    const diffTime = Math.abs(now.getTime() - suspended.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [client.columnId, client.suspendedAt, client.lastUpdate]);

  const handleCoverChange = (config: CoverConfig) => {
    updateClientCover(client.id, config);
  };

  const handleProfileImageChange = (url: string) => {
    updateClientProfileImage(client.id, url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        handleProfileImageChange(base64);
        toast.success("Foto de perfil atualizada!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetClientUpdateDate(client.id);
  };

  const handleToggleLabel = (label: ClientLabel) => {
    const hasLabel = client.labels?.some(l => l.id === label.id);
    if (hasLabel) {
      removeLabelFromClient(client.id, label.id);
    } else {
      addLabelToClient(client.id, label);
    }
  };

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return;
    const newLabel: ClientLabel = {
      id: `custom-${Date.now()}`,
      name: newLabelName.trim(),
      color: newLabelColor
    };
    createLabel(newLabel);
    addLabelToClient(client.id, newLabel);
    setNewLabelName("");
    setShowNewLabel(false);
    toast.success(`Etiqueta "${newLabel.name}" criada!`);
  };

  const handleDelete = () => {
    deleteClient(client.id);
    toast.success(`"${client.companyName}" movido para a lixeira`);
    setShowMenu(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-card-click]') || target.closest('button') || target.closest('[role="dialog"]')) {
      return;
    }
    onClick();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("clientId", client.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div 
      onClick={handleCardClick}
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "kanban-card client-card group relative overflow-hidden cursor-grab active:cursor-grabbing",
        "hover-lift hover-shine animate-fade-in",
        // Urgency styling
        urgency.level === "critical" && "ring-2 ring-status-danger shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-subtle",
        urgency.level === "high" && "ring-1 ring-status-warning/70 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
        // Fallback to old stalled styling if no urgency
        urgency.level === "none" && isStalled && "ring-1 ring-status-danger/50 animate-pulse-subtle"
      )}
    >
      {/* Cover */}
      {client.coverConfig?.type === "solid" && client.coverConfig.color && (
        <div 
          className="absolute top-0 left-0 right-0 h-8 -mx-3 -mt-3"
          style={{ backgroundColor: client.coverConfig.color }}
        />
      )}
      {client.coverConfig?.type === "image" && client.coverConfig.imageUrl && (
        <div 
          className="absolute top-0 left-0 right-0 h-16 -mx-3 -mt-3 bg-cover bg-center"
          style={{ backgroundImage: `url(${client.coverConfig.imageUrl})` }}
        />
      )}

      {/* Menu Button */}
      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            data-no-card-click
            className={cn(
              "absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10",
              client.coverConfig?.type !== "none" && "bg-background/80"
            )}
            onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="end" 
          className="w-64" 
          data-no-card-click
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            {/* Labels */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">ETIQUETAS</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {availableLabels.map((label) => {
                  const hasLabel = client.labels?.some(l => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label)}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all",
                        hasLabel && "ring-2 ring-offset-1 ring-primary"
                      )}
                      style={{ backgroundColor: label.color, color: "#fff" }}
                    >
                      {hasLabel && <Check className="w-3 h-3" />}
                      {label.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Create new label */}
              {showNewLabel ? (
                <div className="flex flex-col gap-2 p-2 bg-surface-2/50 rounded">
                  <Input
                    placeholder="Nome da etiqueta..."
                    className="text-xs h-7"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {COVER_COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "w-5 h-5 rounded transition-all hover:scale-110",
                          newLabelColor === color && "ring-2 ring-offset-1 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewLabelColor(color)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleCreateLabel}>
                      Criar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNewLabel(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 h-7 text-xs"
                  onClick={() => setShowNewLabel(true)}
                >
                  <Plus className="w-3 h-3" />
                  Nova etiqueta
                </Button>
              )}
            </div>

            {/* Cover */}
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs font-semibold text-muted-foreground mb-2">CAPA</p>
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 justify-start gap-2"
                  onClick={() => handleCoverChange({ type: "none" })}
                >
                  <X className="w-4 h-4" />
                  Sem capa
                </Button>
                {client.profileImage && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 justify-start gap-2"
                    onClick={() => handleCoverChange({ type: "image", imageUrl: client.profileImage })}
                  >
                    <User className="w-4 h-4" />
                    Usar foto
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {COVER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-6 rounded transition-all hover:scale-110",
                      client.coverConfig?.color === color && "ring-2 ring-offset-1 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleCoverChange({ type: "solid", color })}
                  />
                ))}
              </div>
            </div>

            {/* Profile Image */}
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs font-semibold text-muted-foreground mb-2">FOTO DE PERFIL</p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Carregar foto
                </Button>
                {client.profileImage && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleProfileImageChange("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {client.profileImage && (
                <div className="mt-2 flex items-center gap-2 p-1.5 bg-surface-2/50 rounded">
                  <img 
                    src={client.profileImage} 
                    alt="Preview" 
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="text-[10px] text-muted-foreground">Foto carregada</span>
                </div>
              )}
            </div>

            {/* Delete */}
            <div className="pt-3 border-t border-border/30">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-status-danger hover:text-status-danger hover:bg-status-danger/10 border-status-danger/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Lead
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir "{client.companyName}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O lead será movido para a lixeira. Você pode restaurá-lo depois se precisar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-status-danger hover:bg-status-danger/90"
                      onClick={handleDelete}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Content */}
      <div className={cn(
        "relative",
        client.coverConfig?.type === "solid" && "pt-5",
        client.coverConfig?.type === "image" && "pt-12"
      )}>
        {/* Urgency Badge */}
        {urgency.level !== "none" && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold mb-2",
            urgency.level === "critical" && "bg-status-danger/20 text-status-danger border border-status-danger/30",
            urgency.level === "high" && "bg-status-warning/20 text-status-warning border border-status-warning/30"
          )}>
            <AlertTriangle className="w-3 h-3" />
            {urgency.reason}
          </div>
        )}

        {/* Labels Row */}
        {client.labels && client.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {client.labels.map((label) => (
              <span 
                key={label.id}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{ backgroundColor: label.color, color: "#fff" }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          {client.profileImage ? (
            <img 
              src={client.profileImage} 
              alt={client.companyName}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-border/50"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {client.companyName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
              {client.companyName}
            </h3>
            {client.mainCategory && (
              <p className="text-[10px] text-muted-foreground line-clamp-1">{client.mainCategory}</p>
            )}
          </div>

          <span className={cn(
            "w-2 h-2 rounded-full shrink-0",
            client.status === "on_track" && "bg-status-success",
            client.status === "delayed" && "bg-status-danger",
            client.status === "pending_client" && "bg-status-warning"
          )} />
        </div>

        {/* Responsible Badge */}
        <div className={cn(
          "flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-lg border",
          "bg-primary/10 border-primary/30"
        )}>
          <User className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">
            {client.responsible}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progresso</span>
            <span className={cn(
              "font-mono font-medium text-[11px]",
              progress >= 80 ? "text-status-success" : progress >= 40 ? "text-status-warning" : "text-status-danger"
            )}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>


        {client.attachments && client.attachments.length > 0 && (
          <div className="flex items-center gap-1 mb-2 p-1.5 bg-surface-2/50 rounded">
            <Paperclip className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{client.attachments.length} anexos</span>
          </div>
        )}

        {/* PENDENTE DO CLIENTE - Tag destacada */}
        {client.status === "pending_client" && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-status-danger/20 border-2 border-status-danger/50 rounded-lg animate-pulse-subtle">
            <AlertTriangle className="w-4 h-4 text-status-danger shrink-0" />
            <span className="text-xs font-bold text-status-danger uppercase">
              Pendente do Cliente
            </span>
          </div>
        )}

        {/* Suspended Days Counter */}
        {daysSuspended !== null && (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-status-warning/10 border border-status-warning/30 rounded-lg">
            <PauseCircle className="w-3.5 h-3.5 text-status-warning" />
            <span className="text-xs font-semibold text-status-warning">
              {daysSuspended} {daysSuspended === 1 ? 'dia' : 'dias'} suspenso
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{getDaysAgo(client.lastUpdate)}</span>
            {isStalled && (
              <>
                <AlertTriangle className="w-3 h-3 text-status-danger ml-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 ml-1"
                  data-no-card-click
                  onClick={handleResetDate}
                  title="Resetar contagem"
                >
                  <RotateCcw className="w-3 h-3 text-status-danger" />
                </Button>
              </>
            )}
          </div>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[9px] font-medium",
            client.planType === "recurring" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {client.planType === "recurring" ? "REC" : "ÚNICO"}
          </span>
        </div>
      </div>
    </div>
  );
}
