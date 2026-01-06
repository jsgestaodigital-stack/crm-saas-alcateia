import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useClientStore } from "@/stores/clientStore";
import { useRecurring } from "@/hooks/useRecurring";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  RefreshCw,
  Building2,
  Search,
  User,
  CheckCircle2,
  Plus,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewRecurringClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRecurringClientDialog({ open, onOpenChange }: NewRecurringClientDialogProps) {
  const { clients: optimizationClients } = useClientStore();
  const { clients: recurringClients, addRecurringClient } = useRecurring();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // New client form
  const [companyName, setCompanyName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter clients that are already in recurring
  const recurringClientIds = useMemo(() => 
    new Set(recurringClients.map(c => c.client_id).filter(Boolean)),
    [recurringClients]
  );

  // Filter optimization clients that have completed setup (delivered or finalized)
  // These are the ones eligible to become recurring
  const eligibleClients = useMemo(() => {
    return optimizationClients.filter(c => {
      // Already in recurring? Skip
      if (recurringClientIds.has(c.id)) return false;
      // Only clients that have passed through the funnel
      return ["delivered", "finalized", "ready_to_deliver"].includes(c.columnId);
    });
  }, [optimizationClients, recurringClientIds]);

  // Search filter
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return eligibleClients;
    const query = searchQuery.toLowerCase();
    return eligibleClients.filter(c => 
      c.companyName.toLowerCase().includes(query) ||
      c.mainCategory?.toLowerCase().includes(query)
    );
  }, [eligibleClients, searchQuery]);

  const resetForm = () => {
    setSearchQuery("");
    setSelectedClientId(null);
    setCompanyName("");
    setResponsibleName("");
    setMonthlyValue("");
    setActiveTab("existing");
  };

  const handleSelectExisting = async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    const client = optimizationClients.find(c => c.id === selectedClientId);
    if (!client) return;

    setIsSubmitting(true);
    try {
      const result = await addRecurringClient({
        client_id: client.id,
        company_name: client.companyName,
        responsible_name: client.responsible || user?.email?.split("@")[0] || "Responsável",
      });

      if (result) {
        toast.success(`${client.companyName} adicionado à recorrência!`, {
          description: "Tarefas periódicas serão geradas automaticamente."
        });
        resetForm();
        onOpenChange(false);
      } else {
        toast.error("Erro ao adicionar cliente", {
          description: "Verifique se você tem permissão de acesso ao módulo de recorrência."
        });
      }
    } catch (error) {
      console.error("Error adding existing client to recurring:", error);
      toast.error("Erro inesperado ao adicionar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async () => {
    if (!companyName.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }
    if (!responsibleName.trim()) {
      toast.error("Nome do responsável é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addRecurringClient({
        company_name: companyName.trim(),
        responsible_name: responsibleName.trim(),
        monthly_value: monthlyValue ? parseFloat(monthlyValue) : undefined,
      });

      if (result) {
        toast.success(`${companyName} adicionado à recorrência!`, {
          description: "Tarefas periódicas serão geradas automaticamente."
        });
        resetForm();
        onOpenChange(false);
      } else {
        toast.error("Erro ao adicionar cliente", {
          description: "Verifique se você tem permissão de acesso ao módulo de recorrência."
        });
      }
    } catch (error) {
      console.error("Error creating recurring client:", error);
      toast.error("Erro inesperado ao criar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="bg-surface-1 border-border max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-violet-400" />
            Adicionar à Recorrência
          </DialogTitle>
          <DialogDescription>
            Clientes recorrentes recebem tarefas periódicas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "existing" | "new")} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid grid-cols-2 w-full shrink-0">
            <TabsTrigger value="existing" className="gap-2">
              <Building2 className="w-4 h-4" />
              Cliente Existente
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </TabsTrigger>
          </TabsList>

          {/* Existing Client Tab */}
          <TabsContent value="existing" className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 pr-2">
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-surface-2 border-border"
                  />
                </div>

                {/* Client List */}
                <div className="space-y-2">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {eligibleClients.length === 0 
                          ? "Nenhum cliente elegível. Clientes precisam passar pelo funil de otimização primeiro."
                          : "Nenhum cliente encontrado."
                        }
                      </p>
                    </div>
                  ) : (
                    filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                          selectedClientId === client.id
                            ? "bg-violet-500/20 border-violet-500/50"
                            : "bg-surface-2 border-border hover:border-violet-500/30"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{client.companyName}</p>
                          {client.mainCategory && (
                            <p className="text-xs text-muted-foreground truncate">{client.mainCategory}</p>
                          )}
                        </div>
                        {selectedClientId === client.id && (
                          <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Info */}
                {eligibleClients.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center pb-2">
                    {eligibleClients.length} cliente(s) disponíveis para recorrência
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Submit Button - Always visible at bottom */}
            <div className="flex gap-2 pt-4 mt-4 border-t border-border shrink-0">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSelectExisting}
                disabled={!selectedClientId || isSubmitting}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                {isSubmitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </TabsContent>

          {/* New Client Tab */}
          <TabsContent value="new" className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 pr-2">
              <div className="space-y-4 pb-2">
                {/* Info Banner */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                  <p className="text-amber-400 font-medium">⚠️ Cliente sem histórico</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Este cliente não passará pelo funil de otimização. Use apenas para clientes já configurados externamente.
                  </p>
                </div>

                {/* Company Name */}
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Nome da Empresa *</Label>
                  <Input
                    placeholder="Ex: Barbearia Premium"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-surface-2 border-border"
                  />
                </div>

                {/* Responsible */}
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Responsável *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome do responsável"
                      value={responsibleName}
                      onChange={(e) => setResponsibleName(e.target.value)}
                      className="pl-10 bg-surface-2 border-border"
                    />
                  </div>
                </div>

                {/* Monthly Value (optional) */}
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Valor Mensal (opcional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={monthlyValue}
                      onChange={(e) => setMonthlyValue(e.target.value)}
                      className="pl-10 bg-surface-2 border-border"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Submit Button - Always visible at bottom */}
            <div className="flex gap-2 pt-4 mt-4 border-t border-border shrink-0">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNew}
                disabled={!companyName.trim() || !responsibleName.trim() || isSubmitting}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                {isSubmitting ? "Criando..." : "Criar Cliente"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
