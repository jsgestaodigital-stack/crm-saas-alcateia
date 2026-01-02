import { useState, useCallback, useRef } from "react";
import { FileText, Camera, Paperclip, Upload, X, Image, Save, ChevronDown, Link, Plus, ExternalLink, Trash2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Client, PhotoMode, UsefulLink } from "@/types/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExecutionExtrasProps {
  client: Client;
  onUpdateClient: (updates: Partial<Client>) => void;
  onAddAttachment: (url: string) => void;
  onRemoveAttachment: (url: string) => void;
}

/**
 * Collapsible extras section for briefing, photo mode, attachments, and useful links
 */
export function ExecutionExtras({
  client,
  onUpdateClient,
  onAddAttachment,
  onRemoveAttachment,
}: ExecutionExtrasProps) {
  const [showExtras, setShowExtras] = useState(true);
  const [briefingText, setBriefingText] = useState(client.briefing || "");
  const [photoMode, setPhotoMode] = useState<PhotoMode>(client.photoMode || "pending");
  const [isDragging, setIsDragging] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const usefulLinks = client.usefulLinks || [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          onAddAttachment(base64);
          toast.success(`${file.name} anexado e salvo!`);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [onAddAttachment]);

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      toast.error("Insira uma URL válida");
      return;
    }

    let url = newLinkUrl.trim();
    // Add https:// if not present
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const newLink: UsefulLink = {
      id: `link-${Date.now()}`,
      title: newLinkTitle.trim() || url,
      url,
    };

    const updatedLinks = [...usefulLinks, newLink];
    onUpdateClient({ usefulLinks: updatedLinks });
    
    setNewLinkTitle("");
    setNewLinkUrl("");
    setShowAddLink(false);
    toast.success("Link adicionado!");
  };

  const handleRemoveLink = (linkId: string) => {
    const updatedLinks = usefulLinks.filter(l => l.id !== linkId);
    onUpdateClient({ usefulLinks: updatedLinks });
    toast.success("Link removido");
  };

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const attachments = client.attachments || [];

  return (
    <>
      <Collapsible open={showExtras} onOpenChange={setShowExtras} className="mb-6">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full gap-2 border-dashed border-border/50 text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn("w-4 h-4 transition-transform", showExtras && "rotate-180")} />
            {showExtras ? "Ocultar" : "Mostrar"} dados adicionais (Briefing, Fotos, Anexos, Links)
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Briefing */}
            <div className="rounded-xl border border-border/30 bg-surface-1/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Briefing</h3>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    onUpdateClient({ briefing: briefingText });
                    toast.success("Salvo!");
                  }}
                >
                  <Save className="w-3 h-3 mr-1" />
                  Salvar
                </Button>
              </div>
              <Textarea
                placeholder="Notas sobre o cliente..."
                value={briefingText}
                onChange={(e) => setBriefingText(e.target.value)}
                className="min-h-[120px] bg-surface-2/50 border-border/30 resize-none text-sm"
              />
            </div>

            {/* Photo Mode */}
            <div className="rounded-xl border border-border/30 bg-surface-1/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Modalidade de Fotos</h3>
              </div>
              <RadioGroup 
                value={photoMode} 
                onValueChange={(value: PhotoMode) => {
                  setPhotoMode(value);
                  onUpdateClient({ photoMode: value });
                  toast.success("Atualizado!");
                }}
                className="space-y-2"
              >
                <Label className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm",
                  photoMode === "with_photos" ? "bg-status-info/10 border-status-info/40" : "bg-surface-2/50 border-border/20"
                )}>
                  <RadioGroupItem value="with_photos" />
                  Com fotos (Equipe)
                </Label>
                <Label className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm",
                  photoMode === "without_photos" ? "bg-status-purple/10 border-status-purple/40" : "bg-surface-2/50 border-border/20"
                )}>
                  <RadioGroupItem value="without_photos" />
                  Sem fotos (Cliente)
                </Label>
                <Label className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm",
                  photoMode === "pending" ? "bg-primary/10 border-primary/40" : "bg-surface-2/50 border-border/20"
                )}>
                  <RadioGroupItem value="pending" />
                  A definir
                </Label>
              </RadioGroup>
            </div>

            {/* Attachments */}
            <div 
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "rounded-xl border-2 border-dashed p-4 transition-all",
                isDragging ? "border-primary bg-primary/10" : "border-border/30 bg-surface-1/30"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Anexos</h3>
                  {attachments.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">{attachments.length}</Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">Ctrl+V para colar</span>
              </div>
              
              {attachments.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {attachments.slice(0, 10).map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-surface-2/50 group">
                      {url.startsWith("data:image") || url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img 
                          src={url} 
                          alt="" 
                          className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => setPreviewImage(url)}
                        />
                      ) : (
                        <Image className="w-5 h-5 text-primary" />
                      )}
                      <span className="flex-1 text-xs truncate">Anexo {idx + 1}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6" 
                          onClick={() => setPreviewImage(url)}
                          title="Ver em tela cheia"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6 text-destructive hover:text-destructive" 
                          onClick={() => {
                            onRemoveAttachment(url);
                            toast.success("Anexo removido");
                          }}
                          title="Remover"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {attachments.length > 10 && (
                    <p className="text-xs text-center text-muted-foreground">+{attachments.length - 10} mais</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Arraste ou cole imagens</p>
                  <p className="text-[10px] opacity-70 mt-1">Salva automaticamente</p>
                </div>
              )}
            </div>

            {/* Useful Links */}
            <div className="rounded-xl border border-border/30 bg-surface-1/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Links Úteis</h3>
                  {usefulLinks.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">{usefulLinks.length}</Badge>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowAddLink(!showAddLink)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {showAddLink && (
                <div className="space-y-2 mb-3 p-2 rounded bg-surface-2/50">
                  <Input
                    placeholder="Título (opcional)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="URL (ex: drive.google.com/...)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAddLink}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddLink(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {usefulLinks.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {usefulLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 p-2 rounded bg-surface-2/50 group">
                      <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                      <button 
                        onClick={() => handleOpenLink(link.url)}
                        className="flex-1 text-xs text-left truncate hover:text-primary transition-colors"
                        title={link.url}
                      >
                        {link.title}
                      </button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" 
                        onClick={() => handleRemoveLink(link.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : !showAddLink && (
                <div className="text-center py-6 text-muted-foreground">
                  <Link className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nenhum link cadastrado</p>
                  <p className="text-[10px] opacity-70 mt-1">Adicione links do Drive, sites, etc.</p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur">
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}