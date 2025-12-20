import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeads, useLeadSources } from '@/hooks/useLeads';
import { LeadTemperature, TEMPERATURE_CONFIG } from '@/types/lead';
import { Building2, User, Phone, MapPin, Tag, Plus } from 'lucide-react';

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const { createLead } = useLeads();
  const { sources, addSource } = useLeadSources();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSourceInput, setNewSourceInput] = useState('');
  const [showNewSource, setShowNewSource] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    whatsapp: '',
    city: '',
    main_category: '',
    source_id: '',
    temperature: 'cold' as LeadTemperature,
    next_action: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) return;

    setIsSubmitting(true);
    const lead = await createLead(formData);
    setIsSubmitting(false);

    if (lead) {
      setFormData({
        company_name: '',
        contact_name: '',
        whatsapp: '',
        city: '',
        main_category: '',
        source_id: '',
        temperature: 'cold',
        next_action: '',
        notes: '',
      });
      onOpenChange(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSourceInput.trim()) return;
    const source = await addSource(newSourceInput.trim());
    if (source) {
      setFormData(prev => ({ ...prev, source_id: source.id }));
      setNewSourceInput('');
      setShowNewSource(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Novo Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <Label className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Nome do Negócio *
            </Label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Ex: Restaurante Bom Sabor"
              className="mt-1"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Contact Name */}
            <div>
              <Label className="flex items-center gap-1">
                <User className="h-3 w-3" /> Contato
              </Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Nome"
                className="mt-1"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <Label className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> WhatsApp
              </Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* City */}
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Cidade
              </Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Cidade"
                className="mt-1"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="flex items-center gap-1">
                <Tag className="h-3 w-3" /> Nicho
              </Label>
              <Input
                value={formData.main_category}
                onChange={(e) => setFormData(prev => ({ ...prev, main_category: e.target.value }))}
                placeholder="Restaurante"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Source */}
            <div>
              <Label>Origem</Label>
              {showNewSource ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newSourceInput}
                    onChange={(e) => setNewSourceInput(e.target.value)}
                    placeholder="Nova origem..."
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddSource}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Select 
                    value={formData.source_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, source_id: v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowNewSource(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Temperature */}
            <div>
              <Label>Temperatura</Label>
              <Select 
                value={formData.temperature} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, temperature: v as LeadTemperature }))}
              >
                <SelectTrigger className="mt-1">
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
          </div>

          {/* Next Action */}
          <div>
            <Label>Próxima Ação</Label>
            <Input
              value={formData.next_action}
              onChange={(e) => setFormData(prev => ({ ...prev, next_action: e.target.value }))}
              placeholder="O que fazer primeiro?"
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Informações adicionais..."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!formData.company_name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Criando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
