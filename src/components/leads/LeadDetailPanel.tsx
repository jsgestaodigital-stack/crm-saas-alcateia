import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  X
} from 'lucide-react';
import { LeadActivityTab } from './LeadActivityTab';
import { LeadProposalTab } from './LeadProposalTab';
import { LeadConversionTab } from './LeadConversionTab';
import { LeadRaioXTab } from './LeadRaioXTab';
import { LeadCopilotTab } from './LeadCopilotTab';
import { LeadTasksTab } from './LeadTasksTab';

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const { updateLead, deleteLead } = useLeads();
  const { sources } = useLeadSources();
  const { derived, userRole, isAdmin, permissions } = useAuth();
  // Permite edição se: tem permissão canSalesOrAdmin OU é admin/owner OU tem can_sales explícito
  const canEditLeads = derived?.canSalesOrAdmin || isAdmin || userRole === 'admin' || userRole === 'owner' || permissions?.canSales || permissions?.canAdmin;
  const [activeTab, setActiveTab] = useState('resumo');

  if (!lead) return null;

  const handleFieldChange = async (field: keyof Lead, value: any) => {
    await updateLead(lead.id, { [field]: value });
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este lead permanentemente?')) return;

    const ok = await deleteLead(lead.id);
    if (ok) {
      onUpdate();
      onClose();
    }
  };

  const tempConfig = TEMPERATURE_CONFIG[lead.temperature];

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {lead.company_name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-semibold", tempConfig.color)}
                  >
                    {tempConfig.emoji} {tempConfig.label}
                  </Badge>
                  {lead.probability > 0 && (
                    <Badge variant="outline" className="text-xs bg-muted/30">
                      {lead.probability}% chance
                    </Badge>
                  )}
                  {lead.estimated_value && lead.estimated_value > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 bg-amber-500/10">
                      R$ {lead.estimated_value.toLocaleString('pt-BR')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEditLeads && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 pt-4 border-b border-border/30">
            <TabsList className="grid w-full grid-cols-7 bg-muted/30">
              <TabsTrigger value="resumo" className="text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Resumo
              </TabsTrigger>
              <TabsTrigger value="atividades" className="text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                📌 Atividades
              </TabsTrigger>
              <TabsTrigger value="tarefas" className="text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                📅 Tarefas
              </TabsTrigger>
              <TabsTrigger value="proposta" className="text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Proposta
              </TabsTrigger>
              <TabsTrigger value="raiox" className="text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Raio-X
              </TabsTrigger>
              <TabsTrigger value="copilot" className="text-sm data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                🤖 Copiloto
              </TabsTrigger>
              <TabsTrigger value="conversao" className="text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Ganho/Perda
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
            <div className="p-6">
              {/* Resumo Tab */}
              <TabsContent value="resumo" className="m-0 space-y-6">
                {/* Contact Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações de Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Contact Name */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Nome do Contato</Label>
                      <Input
                        value={lead.contact_name || ''}
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
                        value={lead.whatsapp || ''}
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
                        value={lead.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="(00) 0000-0000"
                        disabled={!canEditLeads}
                        className="bg-muted/20"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> E-mail
                      </Label>
                      <Input
                        value={lead.email || ''}
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
                        value={lead.city || ''}
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
                        value={lead.main_category || ''}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Source */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Origem</Label>
                      <Select
                        value={lead.source_id || ''}
                        onValueChange={(v) => handleFieldChange('source_id', v)}
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
                        onValueChange={(v) => handleFieldChange('temperature', v)}
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
                        value={lead.estimated_value || ''}
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
                        value={lead.probability || ''}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Next Action */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Próxima Ação</Label>
                      <Input
                        value={lead.next_action || ''}
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
                        value={lead.next_action_date || ''}
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
                    value={lead.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Anotações gerais sobre o lead..."
                    className="min-h-[120px] bg-muted/20 resize-none"
                    disabled={!canEditLeads}
                  />
                </div>
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

              {/* Raio-X Tab */}
              <TabsContent value="raiox" className="m-0">
                <LeadRaioXTab leadId={lead.id} />
              </TabsContent>

              {/* Copilot Tab */}
              <TabsContent value="copilot" className="m-0">
                <LeadCopilotTab leadId={lead.id} />
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
  );
}
