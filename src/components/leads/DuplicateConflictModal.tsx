import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Copy, 
  ArrowRight, 
  XCircle,
  Mail,
  Phone,
  Building2,
  MapPin
} from 'lucide-react';
import type { DuplicateLeadGroup } from '@/hooks/useLeadUnification';
import { cn } from '@/lib/utils';

interface DuplicateConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateLeadGroup[];
  newLeadData: {
    company_name: string;
    contact_name?: string;
    email?: string;
    whatsapp?: string;
    city?: string;
  };
  onMoveToExisting: (existingLeadId: string) => void;
  onMergeWithExisting: (existingLeadId: string) => void;
  onIgnoreAndCreate: () => void;
}

const MATCH_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  email: { label: 'Mesmo e-mail', icon: <Mail className="h-4 w-4" />, color: 'bg-red-500/20 text-red-500' },
  phone: { label: 'Mesmo telefone', icon: <Phone className="h-4 w-4" />, color: 'bg-orange-500/20 text-orange-500' },
  name_city: { label: 'Mesmo nome + cidade', icon: <MapPin className="h-4 w-4" />, color: 'bg-amber-500/20 text-amber-500' },
  exact: { label: 'Nome idêntico', icon: <Building2 className="h-4 w-4" />, color: 'bg-yellow-500/20 text-yellow-500' },
  similar: { label: 'Nome similar', icon: <Building2 className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-500' },
};

export function DuplicateConflictModal({
  open,
  onOpenChange,
  duplicates,
  newLeadData,
  onMoveToExisting,
  onMergeWithExisting,
  onIgnoreAndCreate,
}: DuplicateConflictModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [action, setAction] = useState<'move' | 'merge' | 'ignore'>('merge');

  const allDuplicateLeads = duplicates.flatMap(g => 
    g.leads.map(l => ({ ...l, matchType: g.matchType }))
  );

  const handleConfirm = () => {
    if (action === 'ignore') {
      onIgnoreAndCreate();
    } else if (selectedLeadId) {
      if (action === 'move') {
        onMoveToExisting(selectedLeadId);
      } else {
        onMergeWithExisting(selectedLeadId);
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="h-5 w-5" />
            Duplicata Detectada
          </DialogTitle>
          <DialogDescription>
            O lead que você está criando já existe no sistema. Escolha como proceder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Novo lead sendo criado */}
          <Alert className="bg-primary/5 border-primary/30">
            <Building2 className="h-4 w-4 text-primary" />
            <AlertDescription>
              <span className="font-medium">Novo lead:</span>{' '}
              {newLeadData.company_name}
              {newLeadData.city && ` • ${newLeadData.city}`}
              {newLeadData.email && ` • ${newLeadData.email}`}
            </AlertDescription>
          </Alert>

          {/* Lista de duplicatas */}
          <div className="space-y-2">
            <Label>Leads existentes com conflito:</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allDuplicateLeads.map((lead) => {
                const matchInfo = MATCH_TYPE_LABELS[lead.matchType] || MATCH_TYPE_LABELS.similar;
                return (
                  <Card 
                    key={lead.id} 
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedLeadId === lead.id ? "ring-2 ring-primary" : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={selectedLeadId === lead.id}
                            onChange={() => setSelectedLeadId(lead.id)}
                            className="h-4 w-4"
                          />
                          <div>
                            <p className="font-medium">{lead.company_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.pipeline_stage} • {lead.city || 'Sem cidade'}
                            </p>
                          </div>
                        </div>
                        <Badge className={matchInfo.color}>
                          {matchInfo.icon}
                          <span className="ml-1">{matchInfo.label}</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Opções de ação */}
          <div className="space-y-2">
            <Label>O que deseja fazer?</Label>
            <RadioGroup value={action} onValueChange={(v) => setAction(v as typeof action)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="flex-1 cursor-pointer">
                  <div className="font-medium flex items-center gap-2">
                    <Copy className="h-4 w-4 text-primary" />
                    Fundir com lead existente
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Consolida dados complementares no lead selecionado
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="move" id="move" />
                <Label htmlFor="move" className="flex-1 cursor-pointer">
                  <div className="font-medium flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-500" />
                    Mover para o lead existente
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Abre o lead existente para edição
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="ignore" id="ignore" />
                <Label htmlFor="ignore" className="flex-1 cursor-pointer">
                  <div className="font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    Ignorar e criar mesmo assim
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cria o lead sabendo que pode ser duplicata
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={action !== 'ignore' && !selectedLeadId}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
