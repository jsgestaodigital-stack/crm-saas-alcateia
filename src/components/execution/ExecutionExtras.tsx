import { useState, useCallback, useRef } from "react";
import { FileText, Camera, Paperclip, Upload, X, Image, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Client, PhotoMode } from "@/types/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExecutionExtrasProps {
  client: Client;
  onUpdateClient: (updates: Partial<Client>) => void;
  onAddAttachment: (url: string) => void;
  onRemoveAttachment: (url: string) => void;
}

/**
 * Collapsible extras section for briefing, photo mode, and attachments
 * Item 1: Keep components < 300 lines
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
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
          toast.success(`${file.name} anexado!`);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [onAddAttachment]);

  const attachments = client.attachments || [];

  return (
    <Collapsible open={showExtras} onOpenChange={setShowExtras} className="mb-6">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-dashed border-border/50 text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn("w-4 h-4 transition-transform", showExtras && "rotate-180")} />
          {showExtras ? "Ocultar" : "Mostrar"} dados adicionais (Briefing, Fotos, Anexos)
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                Com fotos (João)
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
              <span className="text-[10px] text-muted-foreground">Ctrl+V</span>
            </div>
            
            {attachments.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {attachments.slice(0, 5).map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-surface-2/50">
                    {url.startsWith("data:image") ? (
                      <img src={url} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <Image className="w-5 h-5 text-primary" />
                    )}
                    <span className="flex-1 text-xs truncate">Anexo {idx + 1}</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onRemoveAttachment(url)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {attachments.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground">+{attachments.length - 5} mais</p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Arraste ou cole imagens</p>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
