import { useState, useRef } from "react";
import { 
  Bot, 
  Upload, 
  X, 
  Loader2, 
  FileImage,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecurrenceReportAgentProps {
  onReportGenerated?: (report: string) => void;
}

export function RecurrenceReportAgent({ onReportGenerated }: RecurrenceReportAgentProps) {
  const { user, derived, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUseAgent = derived?.canRecurringOrAdmin || isAdmin;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 10 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande (máx. 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateReport = async () => {
    if (images.length === 0) {
      toast.error("Adicione pelo menos uma imagem para análise");
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const userRole = isAdmin ? "admin" : derived?.canRecurringOrAdmin ? "recurring" : null;

      const { data, error } = await supabase.functions.invoke("analyze-recurrence", {
        body: {
          images,
          userMessage: customMessage || undefined,
          userRole,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setReport(data.report);
      onReportGenerated?.(data.report);
      toast.success("Relatório gerado com sucesso!");

    } catch (error) {
      console.error("Error generating report:", error);
      const message = error instanceof Error ? error.message : "Erro ao gerar relatório";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success("Relatório copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetState = () => {
    setImages([]);
    setCustomMessage("");
    setReport(null);
  };

  if (!canUseAgent) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-purple-500/30 hover:bg-purple-500/10">
          <Bot className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">Agente IA</span>
          <Sparkles className="w-3 h-3 text-purple-400" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            Agente IA - Relatório Google Meu Negócio
            <Badge variant="outline" className="ml-2 text-[10px] border-purple-500/30 text-purple-400">
              GMN Expert
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Left: Input */}
          <div className="space-y-4">
            <Alert className="border-purple-500/20 bg-purple-500/5">
              <Info className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-xs text-muted-foreground">
                🚀 <strong>Economize tempo!</strong> Cole prints de todos os insights do Google Meu Negócio 
                e veja a mágica acontecer. Relatórios mensais premium em segundos.
              </AlertDescription>
            </Alert>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center justify-between">
                <span>Imagens ({images.length}/10)</span>
                {images.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => setImages([])}
                  >
                    Limpar todas
                  </Button>
                )}
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {images.length < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                    "border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5"
                  )}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique ou arraste imagens aqui
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    PNG, JPG até 5MB
                  </p>
                </div>
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-16 object-cover rounded-lg border border-border/30"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-status-danger text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Observações (opcional)
              </Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Ex: Cliente do ramo de restaurantes, foco em delivery..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={images.length === 0 || isLoading}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Relatório</Label>
              {report && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleCopyReport}
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              )}
            </div>

            <Card className="border-border/30 bg-surface-1/30 h-[400px]">
              <CardContent className="p-0 h-full">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <Bot className="w-5 h-5 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Analisando {images.length} {images.length === 1 ? "imagem" : "imagens"}...
                    </p>
                  </div>
                ) : report ? (
                  <ScrollArea className="h-full p-4">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {report}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <FileImage className="w-10 h-10 opacity-30" />
                    <p className="text-sm">
                      Adicione imagens e clique em "Gerar Relatório"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
