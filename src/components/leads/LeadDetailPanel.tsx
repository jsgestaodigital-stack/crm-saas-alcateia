import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Lead, 
  TEMPERATURE_CONFIG, 
  LeadTemperature,
} from '@/types/lead';
import { useLeads, useLeadSources } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Tag,
  DollarSign,
  Percent,
  Calendar,
  FileText,
  Trash2,
  X,
  Loader2,
  Save,
  Check
} from 'lucide-react';
import { LeadActivityTab } from './LeadActivityTab';
import { LeadProposalTab } from './LeadProposalTab';
import { LeadConversionTab } from './LeadConversionTab';
import { LeadTasksTab } from './LeadTasksTab';

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const { updateLead, deleteLead, refetch } = useLeads();
  const { sources } = useLeadSources();
  const { derived, userRole, isAdmin, permissions } = useAuth();
  // Permite edição se: tem permissão canSalesOrAdmin OU é admin/owner OU tem can_sales explícito
  const canEditLeads = derived?.canSalesOrAdmin || isAdmin || userRole === 'admin' || userRole === 'owner' || permissions?.canSales || permissions?.canAdmin;
  const [activeTab, setActiveTab] = useState('resumo');

  // Local edit state (no auto-save)
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Reset local values when lead changes
  useEffect(() => {
    setLocalValues({});
    setJustSaved(false);
  }, [lead?.id]);

  const isDirty = Object.keys(localValues).length > 0;

  if (!lead) return null;

  const handleFieldChange = (field: keyof Lead, value: any) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
    setJustSaved(false);
  };

  // Immediate save for selects (these are atomic actions)
  const handleSelectChange = async (field: keyof Lead, value: any) => {
    setIsSaving(true);
    try {
      const ok = await updateLead(lead.id, { [field]: value });
      if (ok) {
        await refetch?.();
        onUpdate();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      const ok = await updateLead(lead.id, localValues as Partial<Lead>);
      if (ok) {
        setLocalValues({});
        setJustSaved(true);
        await refetch?.();
        onUpdate();
        setTimeout(() => setJustSaved(false), 2000);
      } else {
        toast.error('Erro ao salvar. Tente novamente.');
      }
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDelete = () => setConfirmDeleteOpen(true);

  const performDelete = async () => {
    const ok = await deleteLead(lead.id);
    setConfirmDeleteOpen(false);
    if (ok) {
      onUpdate();
      onClose();
    }
  };

  // Get display value (local or from lead)
  const getValue = (field: keyof Lead) => {
    return field in localValues ? localValues[field] : lead[field];
  };

  const tempConfig = TEMPERATURE_CONFIG[lead.temperature];

  return (
    <>
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {lead.company_name}
                </DialogTitle>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-semibold shrink-0", tempConfig.color)}
                  >
                    {tempConfig.emoji} <span className="hidden sm:inline ml-1">{tempConfig.label}</span>
                  </Badge>
                  {lead.probability > 0 && (
                    <Badge variant="outline" className="text-xs bg-muted/30 shrink-0">
                      {lead.probability}%
                    </Badge>
                  )}
                  {lead.estimated_value && lead.estimated_value > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 bg-amber-500/10 shrink-0">
                      R$ {lead.estimated_value.toLocaleString('pt-BR')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canEditLeads && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-3 sm:px-6 pt-3 sm:pt-4 border-b border-border/30 shrink-0 overflow-x-auto">
            <TabsList className="flex flex-nowrap gap-1 h-auto p-1 bg-muted/30 w-max min-w-full sm:w-full">
              <TabsTrigger value="resumo" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 whitespace-nowrap">
                <span className="sm:hidden">📋</span>
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="atividades" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 whitespace-nowrap">
                <span className="sm:hidden">📌</span>
                <span className="hidden sm:inline">📌 Atividades</span>
              </TabsTrigger>
              <TabsTrigger value="tarefas" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 whitespace-nowrap">
                <span className="sm:hidden">📅</span>
                <span className="hidden sm:inline">📅 Tarefas</span>
              </TabsTrigger>
              <TabsTrigger value="proposta" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 whitespace-nowrap">
                <span className="sm:hidden">📄</span>
                <span className="hidden sm:inline">Proposta</span>
              </TabsTrigger>
              <TabsTrigger value="conversao" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 whitespace-nowrap">
                <span className="sm:hidden">🏆</span>
                <span className="hidden sm:inline">Ganho/Perda</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6">
              {/* Resumo Tab */}
              <TabsContent value="resumo" className="m-0 space-y-6">
                {/* Contact Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações de Contato
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Contact Name */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Nome do Contato</Label>
                      <Input
                        value={getValue('contact_name') || ''}
                        onChange={(e) => handleFieldChange('contact_name', e.target.value)}
                        placeholder="Nome do contato"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> WhatsApp
                      </Label>
                      <Input
                        value={getValue('whatsapp') || ''}
                        onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
                        placeholder="(00) 00000-0000"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Telefone
                      </Label>
                      <Input
                        value={getValue('phone') || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="(00) 0000-0000"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> E-mail
                      </Label>
                      <Input
                        value={getValue('email') || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="email@exemplo.com"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Cidade
                      </Label>
                      <Input
                        value={getValue('city') || ''}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        placeholder="Cidade"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Nicho
                      </Label>
                      <Input
                        value={getValue('main_category') || ''}
                        onChange={(e) => handleFieldChange('main_category', e.target.value)}
                        placeholder="Ex: Restaurante"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Informações Comerciais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Source */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Origem</Label>
                      <Select
                        value={lead.source_id || ''}
                        onValueChange={(v) => handleSelectChange('source_id', v)}
                        disabled={!canEditLeads}
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sources.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Temperatura</Label>
                      <Select
                        value={lead.temperature}
                        onValueChange={(v) => handleSelectChange('temperature', v)}
                        disabled={!canEditLeads}
                      >
                        <SelectTrigger className="bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TEMPERATURE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.emoji} {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Estimated Value */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Ticket Estimado
                      </Label>
                      <Input
                        type="number"
                        value={getValue('estimated_value') || ''}
                        onChange={(e) => handleFieldChange('estimated_value', parseFloat(e.target.value) || null)}
                        placeholder="R$ 0,00"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* Probability */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Percent className="h-3 w-3" /> Probabilidade
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={getValue('probability') || ''}
                        onChange={(e) => handleFieldChange('probability', parseInt(e.target.value) || 0)}
                        placeholder="0%"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Follow-up Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Acompanhamento
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Next Action */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Próxima Ação</Label>
                      <Input
                        value={getValue('next_action') || ''}
                        onChange={(e) => handleFieldChange('next_action', e.target.value)}
                        placeholder="O que fazer a seguir?"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* Next Action Date */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Data do Follow-up</Label>
                      <Input
                        type="date"
                        value={getValue('next_action_date') || ''}
                        onChange={(e) => handleFieldChange('next_action_date', e.target.value)}
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </h3>
                  <Textarea
                    value={getValue('notes') || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Anotações gerais sobre o lead..."
                    className="min-h-[120px] bg-muted/20 resize-none"
                    disabled={!canEditLeads}
                  />
                </div>

                {/* Save Footer */}
                {canEditLeads && (
                  <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 border-t border-border/30 bg-background/95 backdrop-blur flex items-center justify-end gap-2">
                    {isDirty && !isSaving && (
                      <span className="text-xs text-muted-foreground">Alterações não salvas</span>
                    )}
                    <Button
                      onClick={handleSaveChanges}
                      disabled={!isDirty || isSaving}
                      className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      {isSaving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                      ) : justSaved ? (
                        <><Check className="h-4 w-4" /> Salvo</>
                      ) : (
                        <><Save className="h-4 w-4" /> Salvar alterações</>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Atividades Tab */}
              <TabsContent value="atividades" className="m-0">
                <LeadActivityTab leadId={lead.id} />
              </TabsContent>

              {/* Tarefas Tab */}
              <TabsContent value="tarefas" className="m-0">
                <LeadTasksTab leadId={lead.id} />
              </TabsContent>

              {/* Proposta Tab */}
              <TabsContent value="proposta" className="m-0">
                <LeadProposalTab lead={lead} onUpdate={onUpdate} />
              </TabsContent>


              {/* Conversão Tab */}
              <TabsContent value="conversao" className="m-0">
                <LeadConversionTab lead={lead} onClose={onClose} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O lead e todo seu histórico serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={performDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir lead
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
