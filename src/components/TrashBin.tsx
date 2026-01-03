import { useState } from "react";
import { Trash2, RotateCcw, X, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/tooltipContent";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { useClientStore } from "@/stores/clientStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isValidDate } from "@/lib/dateUtils";

export function TrashBin() {
  const { deletedClients, restoreClient, permanentlyDeleteClient, isTrashOpen, setTrashOpen } = useClientStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = deletedClients.filter(client =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestore = (clientId: string, clientName: string) => {
    restoreClient(clientId);
    toast.success(`"${clientName}" restaurado com sucesso!`);
  };

  const handlePermanentDelete = (clientId: string, clientName: string) => {
    permanentlyDeleteClient(clientId);
    toast.success(`"${clientName}" excluído permanentemente`);
  };

  return (
    <Sheet open={isTrashOpen} onOpenChange={setTrashOpen}>
      <TooltipProvider delayDuration={1000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "relative gap-2 text-muted-foreground hover:text-foreground",
                  deletedClients.length > 0 && "text-status-danger hover:text-status-danger"
                )}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Lixeira</span>
                {deletedClients.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-status-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {deletedClients.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="glass max-w-[280px]">
            <p className="font-medium mb-1">Lixeira</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{TOOLTIP_CONTENT.actions.trash}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-status-danger" />
            Lixeira
            <span className="text-sm font-normal text-muted-foreground">
              ({deletedClients.length} leads)
            </span>
          </SheetTitle>
          <SheetDescription>
            Leads excluídos ficam aqui por segurança. Você pode restaurá-los ou excluí-los permanentemente.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          {deletedClients.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na lixeira..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Empty State */}
          {deletedClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">A lixeira está vazia</p>
              <p className="text-xs text-muted-foreground mt-1">
                Leads excluídos aparecerão aqui
              </p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead encontrado com "{searchTerm}"
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 rounded-lg border border-border/50 bg-surface-2/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {client.companyName}
                      </h4>
                      {client.mainCategory && (
                        <p className="text-xs text-muted-foreground truncate">
                          {client.mainCategory}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Excluído{" "}
                        {isValidDate((client as any).deletedAt)
                          ? formatDistanceToNow(new Date((client as any).deletedAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : 'recentemente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-status-success hover:text-status-success hover:bg-status-success/10"
                      onClick={() => handleRestore(client.id, client.companyName)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 text-status-danger hover:text-status-danger hover:bg-status-danger/10"
                        >
                          <X className="w-4 h-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-status-danger" />
                            Excluir permanentemente?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>"{client.companyName}"</strong> será excluído permanentemente.
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-status-danger hover:bg-status-danger/90"
                            onClick={() => handlePermanentDelete(client.id, client.companyName)}
                          >
                            Excluir permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
