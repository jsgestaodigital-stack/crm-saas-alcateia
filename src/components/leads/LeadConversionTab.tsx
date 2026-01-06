import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Lead } from '@/types/lead';
import { useLeadConversion } from '@/hooks/useLeadConversion';
import { useLostReasons } from '@/hooks/useLeads';
import { useFunnelMode } from '@/contexts/FunnelModeContext';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeadConversionTabProps {
  lead: Lead;
  onClose: () => void;
}

export function LeadConversionTab({ lead, onClose }: LeadConversionTabProps) {
  const { convertLeadToClient, markLeadAsLost, canConvert } = useLeadConversion();
  const { reasons } = useLostReasons();
  const { setMode } = useFunnelMode();
  const navigate = useNavigate();

  const [showGainedDialog, setShowGainedDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'unique' | 'recurring'>('unique');
  const [selectedLostReason, setSelectedLostReason] = useState<string>('');
  const [lostNotes, setLostNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGained = async () => {
    setIsSubmitting(true);
    const client = await convertLeadToClient(lead, selectedPlanType);
    setIsSubmitting(false);
    
    if (client) {
      setShowGainedDialog(false);
      onClose();
      
      // Switch to delivery funnel immediately (no setTimeout race condition)
      setMode('delivery');
      navigate('/dashboard');
    }
  };

  const handleLost = async () => {
    if (!selectedLostReason) return;
    
    setIsSubmitting(true);
    const success = await markLeadAsLost(lead.id, selectedLostReason, lostNotes);
    setIsSubmitting(false);
    
    if (success) {
      setShowLostDialog(false);
      onClose();
    }
  };

  // Already converted
  if (lead.status === 'gained' && lead.converted_client_id) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <h3 className="font-semibold text-green-400">Lead Convertido!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Este lead foi convertido em cliente com sucesso.
          </p>
          <Button 
            variant="outline" 
            className="mt-4 gap-2"
            onClick={() => {
              setMode('delivery');
              navigate('/dashboard');
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Ver Cliente em Otimização
          </Button>
        </div>
      </div>
    );
  }

  // Already lost
  if (lead.status === 'lost') {
    const lostReason = reasons.find(r => r.id === lead.lost_reason_id);
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <h3 className="font-semibold text-red-400">Lead Perdido</h3>
          {lostReason && (
            <Badge variant="outline" className="mt-2 bg-red-500/10 text-red-400">
              {lostReason.label}
            </Badge>
          )}
          {lead.lost_notes && (
            <p className="text-sm text-muted-foreground mt-2">
              {lead.lost_notes}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Sales/Admin-only actions
  if (!canConvert) {
    return (
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Apenas usuários de Vendas ou Administradores podem marcar leads como Ganho ou Perdido.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Defina o resultado final deste lead
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-6 flex-col gap-2 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
          onClick={() => setShowGainedDialog(true)}
        >
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <span className="font-semibold text-green-400">Ganho</span>
          <span className="text-[10px] text-muted-foreground">Converter em Cliente</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-6 flex-col gap-2 bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
          onClick={() => setShowLostDialog(true)}
        >
          <XCircle className="h-8 w-8 text-red-500" />
          <span className="font-semibold text-red-400">Perdido</span>
          <span className="text-[10px] text-muted-foreground">Registrar motivo</span>
        </Button>
      </div>

      {/* Gained Dialog */}
      <AlertDialog open={showGainedDialog} onOpenChange={setShowGainedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Converter Lead em Cliente
            </AlertDialogTitle>
            <AlertDialogDescription>
              O lead <strong>{lead.company_name}</strong> será convertido em cliente e enviado para Onboarding.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-3">
            <div>
              <Label>Tipo de Plano</Label>
              <Select value={selectedPlanType} onValueChange={(v) => setSelectedPlanType(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unique">Único (otimização 30 dias)</SelectItem>
                  <SelectItem value="recurring">Recorrente (gestão mensal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPlanType === 'recurring' && (
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 text-sm text-violet-400">
                📌 O cliente será enviado para Otimização e também terá tarefas criadas no funil de Recorrência.
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGained}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Convertendo...' : 'Confirmar Conversão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lost Dialog */}
      <AlertDialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Marcar Lead como Perdido
            </AlertDialogTitle>
            <AlertDialogDescription>
              Registre o motivo da perda para análise futura.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label>Motivo da Perda *</Label>
              <Select value={selectedLostReason} onValueChange={setSelectedLostReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={lostNotes}
                onChange={(e) => setLostNotes(e.target.value)}
                placeholder="Detalhes adicionais..."
                className="mt-2"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLost}
              disabled={isSubmitting || !selectedLostReason}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Perda'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
