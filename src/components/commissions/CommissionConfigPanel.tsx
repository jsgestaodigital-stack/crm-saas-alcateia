import { useState } from "react";
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit2, 
  User, 
  DollarSign,
  CheckCircle2,
  ShoppingCart,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  useCommissionConfigs, 
  CommissionConfig, 
  CommissionType, 
  CommissionModel, 
  TriggerEvent 
} from "@/hooks/useCommissionConfigs";

const COMMISSION_TYPE_CONFIG = {
  operational: { label: "Operacional", icon: Settings, color: "bg-green-500/20 text-green-400" },
  sales: { label: "Vendas", icon: ShoppingCart, color: "bg-amber-500/20 text-amber-400" },
  recurring: { label: "Recorrência", icon: RefreshCw, color: "bg-blue-500/20 text-blue-400" },
};

const TRIGGER_EVENT_CONFIG = {
  checklist_complete: { label: "Checklist Completo", description: "Quando o perfil atinge checklist 100%" },
  sale_completed: { label: "Venda Concluída", description: "Quando um lead é convertido em venda" },
  recurring_active: { label: "Recorrência Ativa", description: "Quando cliente entra na recorrência" },
};

const MODEL_CONFIG = {
  fixed: { label: "Valor Fixo", description: "R$ fixo por evento" },
  percentage: { label: "Percentual", description: "% sobre o valor" },
};

export function CommissionConfigPanel() {
  const { configs, loading, createConfig, updateConfig, deleteConfig, toggleActive } = useCommissionConfigs();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<CommissionType>("operational");
  const [formModel, setFormModel] = useState<CommissionModel>("fixed");
  const [formAmount, setFormAmount] = useState("");
  const [formTrigger, setFormTrigger] = useState<TriggerEvent>("checklist_complete");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormType("operational");
    setFormModel("fixed");
    setFormAmount("");
    setFormTrigger("checklist_complete");
    setFormNotes("");
  };

  const handleAdd = async () => {
    if (!formName || !formAmount) {
      return;
    }

    await createConfig({
      collaborator_name: formName,
      collaborator_user_id: null,
      commission_type: formType,
      commission_model: formModel,
      amount: parseFloat(formAmount),
      trigger_event: formTrigger,
      initial_status: 'pending',
      active: true,
      notes: formNotes || null,
    });

    setIsAddOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingConfig || !formName || !formAmount) return;

    await updateConfig(editingConfig.id, {
      collaborator_name: formName,
      commission_type: formType,
      commission_model: formModel,
      amount: parseFloat(formAmount),
      trigger_event: formTrigger,
      notes: formNotes || null,
    });

    setEditingConfig(null);
    resetForm();
  };

  const openEditDialog = (config: CommissionConfig) => {
    setFormName(config.collaborator_name);
    setFormType(config.commission_type);
    setFormModel(config.commission_model);
    setFormAmount(config.amount.toString());
    setFormTrigger(config.trigger_event);
    setFormNotes(config.notes || "");
    setEditingConfig(config);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurações de Comissões
          </CardTitle>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Nova Configuração de Comissão
                </DialogTitle>
              </DialogHeader>
              <ConfigForm
                formName={formName}
                setFormName={setFormName}
                formType={formType}
                setFormType={setFormType}
                formModel={formModel}
                setFormModel={setFormModel}
                formAmount={formAmount}
                setFormAmount={setFormAmount}
                formTrigger={formTrigger}
                setFormTrigger={setFormTrigger}
                formNotes={formNotes}
                setFormNotes={setFormNotes}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAdd}>Criar Regra</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-xs text-muted-foreground">
          Defina as regras de comissionamento automático por colaborador
        </p>
      </CardHeader>
      
      <CardContent>
        {configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma configuração criada</p>
            <p className="text-xs mt-1">Clique em "Nova Regra" para começar</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {configs.map((config) => {
                const typeConfig = COMMISSION_TYPE_CONFIG[config.commission_type];
                const triggerConfig = TRIGGER_EVENT_CONFIG[config.trigger_event];
                const TypeIcon = typeConfig.icon;

                return (
                  <div
                    key={config.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      config.active 
                        ? "border-border/30 bg-surface-1/30" 
                        : "border-border/20 bg-muted/10 opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", typeConfig.color)}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm">{config.collaborator_name}</span>
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              {typeConfig.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              {config.commission_model === 'fixed' 
                                ? `R$ ${config.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} fixo`
                                : `${config.amount}% do valor`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Gatilho: {triggerConfig.label}</span>
                          </div>
                        </div>

                        {config.notes && (
                          <p className="text-xs text-muted-foreground/70 mt-2 italic">
                            {config.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActive(config.id, !config.active)}
                        >
                          {config.active ? (
                            <ToggleRight className="w-4 h-4 text-status-success" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-status-danger hover:text-status-danger"
                          onClick={() => deleteConfig(config.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Editar Configuração
            </DialogTitle>
          </DialogHeader>
          <ConfigForm
            formName={formName}
            setFormName={setFormName}
            formType={formType}
            setFormType={setFormType}
            formModel={formModel}
            setFormModel={setFormModel}
            formAmount={formAmount}
            setFormAmount={setFormAmount}
            formTrigger={formTrigger}
            setFormTrigger={setFormTrigger}
            formNotes={formNotes}
            setFormNotes={setFormNotes}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Form component
interface ConfigFormProps {
  formName: string;
  setFormName: (v: string) => void;
  formType: CommissionType;
  setFormType: (v: CommissionType) => void;
  formModel: CommissionModel;
  setFormModel: (v: CommissionModel) => void;
  formAmount: string;
  setFormAmount: (v: string) => void;
  formTrigger: TriggerEvent;
  setFormTrigger: (v: TriggerEvent) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
}

function ConfigForm(props: ConfigFormProps) {
  const {
    formName, setFormName,
    formType, setFormType,
    formModel, setFormModel,
    formAmount, setFormAmount,
    formTrigger, setFormTrigger,
    formNotes, setFormNotes,
  } = props;

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Nome do Colaborador *</Label>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Ex: Gestor, Operacional..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Comissão</Label>
          <Select value={formType} onValueChange={(v) => setFormType(v as CommissionType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMMISSION_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select value={formModel} onValueChange={(v) => setFormModel(v as CommissionModel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODEL_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{formModel === 'fixed' ? 'Valor (R$) *' : 'Percentual (%) *'}</Label>
        <Input
          type="number"
          value={formAmount}
          onChange={(e) => setFormAmount(e.target.value)}
          placeholder={formModel === 'fixed' ? "400.00" : "10"}
        />
        <p className="text-xs text-muted-foreground">
          {formModel === 'fixed' 
            ? "Valor fixo a ser pago por evento"
            : "Percentual sobre o valor da venda/contrato"
          }
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Evento Gerador</Label>
        <Select value={formTrigger} onValueChange={(v) => setFormTrigger(v as TriggerEvent)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TRIGGER_EVENT_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div>
                  <div>{config.label}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {TRIGGER_EVENT_CONFIG[formTrigger].description}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Notas adicionais sobre esta regra..."
          rows={2}
        />
      </div>
    </div>
  );
}
