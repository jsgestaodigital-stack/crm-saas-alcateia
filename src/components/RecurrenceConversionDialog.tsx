import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, X } from "lucide-react";
import { Client } from "@/types/client";

interface RecurrenceConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onConfirm: (client: Client) => void;
  onDecline: () => void;
}

export function RecurrenceConversionDialog({
  open,
  onOpenChange,
  client,
  onConfirm,
  onDecline,
}: RecurrenceConversionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      await onConfirm(client);
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  const handleDecline = () => {
    onDecline();
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-violet-400" />
            Fechou Recorrência?
          </DialogTitle>
          <DialogDescription>
            O cliente <span className="font-semibold text-foreground">{client.companyName}</span> finalizou a otimização. 
            Ele contratou o plano de recorrência para gestão contínua do perfil?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
            <p className="text-sm text-violet-400 font-medium mb-1">O que acontece se virar recorrente:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Cliente será movido para o funil de Recorrência</li>
              <li>• Tarefas periódicas serão criadas automaticamente</li>
              <li>• Ele sairá do funil de Otimização</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDecline} className="gap-2">
            <X className="h-4 w-4" />
            Não fechou
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="gap-2 bg-violet-500 hover:bg-violet-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isLoading ? "Convertendo..." : "Sim, fechou recorrência!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
