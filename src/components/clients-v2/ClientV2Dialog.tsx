import { useEffect, useState } from 'react';
import { ClientV2 } from '@/hooks/useClientsV2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface ClientV2DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientV2 | null;
  onSave: (data: Partial<ClientV2>) => void;
  onDelete?: () => void;
}

export function ClientV2Dialog({ open, onOpenChange, client, onSave, onDelete }: ClientV2DialogProps) {
  const [formData, setFormData] = useState<Partial<ClientV2>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        whatsapp: '',
        city: '',
        status: 'active',
        plan_name: '',
        monthly_value: undefined,
        responsible: '',
        notes: '',
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name) return;
    
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const handleChange = (field: keyof ClientV2, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="company_name">Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => handleChange('company_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_name">Contato</Label>
              <Input
                id="contact_name"
                value={formData.contact_name || ''}
                onChange={(e) => handleChange('contact_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(v) => handleChange('status', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="plan_name">Plano</Label>
              <Input
                id="plan_name"
                value={formData.plan_name || ''}
                onChange={(e) => handleChange('plan_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="monthly_value">Valor Mensal (R$)</Label>
              <Input
                id="monthly_value"
                type="number"
                step="0.01"
                value={formData.monthly_value || ''}
                onChange={(e) => handleChange('monthly_value', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>

            <div>
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible || ''}
                onChange={(e) => handleChange('responsible', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} className="mr-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
