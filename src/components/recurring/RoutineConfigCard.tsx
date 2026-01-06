import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  MessageSquare, 
  Image, 
  BarChart3, 
  FileText,
  Calendar,
  Zap,
  GripVertical,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecurringRoutine } from "@/hooks/useRecurring";

interface RoutineConfigCardProps {
  routines: RecurringRoutine[];
  onCreateRoutine: (data: {
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    occurrences_per_period?: number;
    rules_json?: Record<string, unknown>;
    active?: boolean;
  }) => Promise<unknown>;
  onUpdateRoutine: (routineId: string, data: Partial<{
    title: string;
    description: string | null;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    occurrences_per_period: number;
    rules_json: Record<string, unknown>;
    active: boolean;
  }>) => Promise<boolean>;
  onDeleteRoutine: (routineId: string) => Promise<boolean>;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
  engagement: { icon: MessageSquare, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Engajamento' },
  content: { icon: Image, color: 'text-green-400 bg-green-500/10 border-green-500/30', label: 'Conteúdo' },
  analytics: { icon: BarChart3, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'Análise' },
  report: { icon: FileText, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', label: 'Relatório' },
  other: { icon: Zap, color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', label: 'Outro' },
};

const FREQUENCY_CONFIG: Record<string, { label: string, description: string }> = {
  daily: { label: 'Diária', description: 'Todos os dias' },
  weekly: { label: 'Semanal', description: 'Durante a semana' },
  biweekly: { label: 'Quinzenal', description: 'A cada 2 semanas' },
  monthly: { label: 'Mensal', description: 'Uma vez por mês' },
};

const PRESET_ROUTINES = [
  { title: 'Responder Avaliações', description: 'Responder avaliações novas de forma personalizada', frequency: 'weekly' as const, occurrences: 3, category: 'engagement' },
  { title: 'Publicar Post/Novidade', description: 'Criar post com novidades ou promoções', frequency: 'weekly' as const, occurrences: 2, category: 'content' },
  { title: 'Adicionar Fotos', description: 'Upload de fotos do estabelecimento ou produtos', frequency: 'weekly' as const, occurrences: 1, category: 'content' },
  { title: 'Adicionar Vídeos', description: 'Upload de vídeos curtos do negócio', frequency: 'biweekly' as const, occurrences: 1, category: 'content' },
  { title: 'Verificar Perguntas', description: 'Responder perguntas de usuários no perfil', frequency: 'weekly' as const, occurrences: 2, category: 'engagement' },
  { title: 'Monitorar Métricas', description: 'Analisar insights: visualizações, cliques, ligações', frequency: 'weekly' as const, occurrences: 1, category: 'analytics' },
  { title: 'Relatório ao Cliente', description: 'Enviar relatório de performance mensal', frequency: 'monthly' as const, occurrences: 1, category: 'report' },
];

export function RoutineConfigCard({
  routines,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
}: RoutineConfigCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RecurringRoutine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    occurrences_per_period: 1,
    category: 'other',
    active: true,
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      frequency: 'weekly',
      occurrences_per_period: 1,
      category: 'other',
      active: true,
    });
    setEditingRoutine(null);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (routine: RecurringRoutine) => {
    const category = (routine.rules_json as any)?.category || 'other';
    setForm({
      title: routine.title,
      description: routine.description || '',
      frequency: routine.frequency,
      occurrences_per_period: routine.occurrences_per_period,
      category,
      active: routine.active,
    });
    setEditingRoutine(routine);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      if (editingRoutine) {
        const success = await onUpdateRoutine(editingRoutine.id, {
          title: form.title,
          description: form.description || null,
          frequency: form.frequency,
          occurrences_per_period: form.occurrences_per_period,
          rules_json: { category: form.category },
          active: form.active,
        });
        if (success) {
          toast.success("Rotina atualizada!");
          setDialogOpen(false);
          resetForm();
        } else {
          toast.error("Erro ao atualizar rotina");
        }
      } else {
        const result = await onCreateRoutine({
          title: form.title,
          description: form.description || undefined,
          frequency: form.frequency,
          occurrences_per_period: form.occurrences_per_period,
          rules_json: { category: form.category },
          active: form.active,
        });
        if (result) {
          toast.success("Rotina criada!");
          setDialogOpen(false);
          resetForm();
        } else {
          toast.error("Erro ao criar rotina");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await onDeleteRoutine(deleteId);
    if (success) {
      toast.success("Rotina excluída");
    } else {
      toast.error("Erro ao excluir rotina");
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (routine: RecurringRoutine) => {
    const success = await onUpdateRoutine(routine.id, { active: !routine.active });
    if (success) {
      toast.success(routine.active ? "Rotina desativada" : "Rotina ativada");
    }
  };

  const handleAddPreset = async (preset: typeof PRESET_ROUTINES[0]) => {
    // Check if already exists
    if (routines.some(r => r.title.toLowerCase() === preset.title.toLowerCase())) {
      toast.error("Esta rotina já existe");
      return;
    }

    const result = await onCreateRoutine({
      title: preset.title,
      description: preset.description,
      frequency: preset.frequency,
      occurrences_per_period: preset.occurrences,
      rules_json: { category: preset.category },
      active: true,
    });

    if (result) {
      toast.success(`"${preset.title}" adicionada!`);
    }
  };

  const getRoutineCategory = (routine: RecurringRoutine) => {
    return (routine.rules_json as any)?.category || 'other';
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-400" />
                Rotinas da Agência
              </CardTitle>
              <CardDescription>
                Configure as tarefas periódicas que serão geradas automaticamente para cada cliente recorrente
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPresets(!showPresets)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Sugestões GMB
              </Button>
              <Button 
                onClick={openNewDialog} 
                className="gap-2 bg-violet-500 hover:bg-violet-600"
              >
                <Plus className="h-4 w-4" />
                Nova Rotina
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Presets Panel */}
          {showPresets && (
            <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-violet-400">Rotinas sugeridas para GMB</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowPresets(false)}>×</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_ROUTINES.map((preset, idx) => {
                  const exists = routines.some(r => r.title.toLowerCase() === preset.title.toLowerCase());
                  const config = CATEGORY_CONFIG[preset.category] || CATEGORY_CONFIG.other;
                  const Icon = config.icon;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => !exists && handleAddPreset(preset)}
                      disabled={exists}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                        exists 
                          ? "bg-muted/30 border-muted opacity-50 cursor-not-allowed"
                          : "bg-card border-border hover:border-violet-500/50 hover:bg-violet-500/5"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", config.color.split(' ').slice(1).join(' '))}>
                        <Icon className={cn("h-4 w-4", config.color.split(' ')[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{preset.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {FREQUENCY_CONFIG[preset.frequency].label} • {preset.occurrences}x
                        </p>
                      </div>
                      {exists ? (
                        <Badge variant="secondary" className="text-xs">Já existe</Badge>
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Routines List */}
          <div className="space-y-2">
            {routines.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Nenhuma rotina configurada</p>
                <p className="text-sm mb-4">
                  Configure as tarefas que serão geradas automaticamente para seus clientes recorrentes
                </p>
                <Button onClick={() => setShowPresets(true)} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Ver sugestões para GMB
                </Button>
              </div>
            ) : (
              routines.map(routine => {
                const category = getRoutineCategory(routine);
                const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                const Icon = config.icon;

                return (
                  <div 
                    key={routine.id} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-all",
                      routine.active 
                        ? "bg-card border-border hover:border-primary/30" 
                        : "bg-muted/30 border-muted opacity-60"
                    )}
                  >
                    <div className="text-muted-foreground cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    
                    <div className={cn("p-2.5 rounded-lg", config.color.split(' ').slice(1).join(' '))}>
                      <Icon className={cn("h-5 w-5", config.color.split(' ')[0])} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{routine.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {FREQUENCY_CONFIG[routine.frequency]?.label || routine.frequency}
                        </Badge>
                        {routine.occurrences_per_period > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {routine.occurrences_per_period}x por período
                          </Badge>
                        )}
                        {!routine.active && (
                          <Badge variant="destructive" className="text-xs">Inativa</Badge>
                        )}
                      </div>
                      {routine.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {routine.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={routine.active} 
                        onCheckedChange={() => handleToggleActive(routine)} 
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(routine)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(routine.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary */}
          {routines.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
              <span>{routines.filter(r => r.active).length} rotinas ativas</span>
              <span>
                ~{routines.filter(r => r.active).reduce((sum, r) => {
                  if (r.frequency === 'daily') return sum + 7 * r.occurrences_per_period;
                  if (r.frequency === 'weekly') return sum + r.occurrences_per_period;
                  if (r.frequency === 'biweekly') return sum + Math.ceil(r.occurrences_per_period / 2);
                  if (r.frequency === 'monthly') return sum + Math.ceil(r.occurrences_per_period / 4);
                  return sum;
                }, 0)} tarefas por semana/cliente
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoutine ? "Editar Rotina" : "Nova Rotina"}
            </DialogTitle>
            <DialogDescription>
              {editingRoutine 
                ? "Altere os detalhes da rotina. As mudanças afetarão apenas novas tarefas."
                : "Crie uma nova tarefa recorrente para seus clientes."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label>Título *</Label>
              <Input 
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                placeholder="Ex: Responder avaliações" 
              />
            </div>

            {/* Description */}
            <div>
              <Label>Descrição</Label>
              <Textarea 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                placeholder="O que deve ser feito nesta tarefa..."
                rows={2}
              />
            </div>

            {/* Category */}
            <div>
              <Label>Categoria</Label>
              <Select 
                value={form.category} 
                onValueChange={v => setForm(f => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("h-4 w-4", config.color.split(' ')[0])} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency & Occurrences */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequência</Label>
                <Select 
                  value={form.frequency} 
                  onValueChange={(v: any) => setForm(f => ({ ...f, frequency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vezes por período</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={7} 
                  value={form.occurrences_per_period} 
                  onChange={e => setForm(f => ({ ...f, occurrences_per_period: parseInt(e.target.value) || 1 }))} 
                />
              </div>
            </div>

            {/* Helper text */}
            <p className="text-xs text-muted-foreground">
              {form.frequency === 'daily' && `${form.occurrences_per_period}x por dia = ${form.occurrences_per_period * 7} tarefas/semana`}
              {form.frequency === 'weekly' && `${form.occurrences_per_period}x por semana`}
              {form.frequency === 'biweekly' && `${form.occurrences_per_period}x a cada 2 semanas`}
              {form.frequency === 'monthly' && `${form.occurrences_per_period}x por mês`}
            </p>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <Switch 
                checked={form.active} 
                onCheckedChange={v => setForm(f => ({ ...f, active: v }))} 
              />
              <Label className="cursor-pointer">Rotina ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Rotina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As tarefas já geradas serão mantidas, mas novas tarefas não serão criadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}