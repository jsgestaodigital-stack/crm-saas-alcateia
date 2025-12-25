import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lead, ProposalStatus, PROPOSAL_STATUS_CONFIG } from '@/types/lead';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { FileText, Link, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeadProposalTabProps {
  lead: Lead;
  onUpdate: () => void;
}

export function LeadProposalTab({ lead, onUpdate }: LeadProposalTabProps) {
  const { updateLead } = useLeads();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleFieldChange = async (field: keyof Lead, value: any) => {
    await updateLead(lead.id, { [field]: value });
    onUpdate();
  };

  const statusConfig = PROPOSAL_STATUS_CONFIG[lead.proposal_status] || PROPOSAL_STATUS_CONFIG.not_sent;

  const handleCreateProposal = () => {
    navigate(`/propostas?leadId=${lead.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Main CTA - Create Proposal */}
      {isAdmin && !lead.proposal_url && lead.proposal_status === 'not_sent' && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-1">Criar proposta para este lead</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Gere uma proposta personalizada com IA e acompanhe quando o cliente abrir
            </p>
            <Button onClick={handleCreateProposal} className="gap-2" size="lg">
              <Sparkles className="h-4 w-4" />
              Criar Proposta com IA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* If already has proposal */}
      {(lead.proposal_url || lead.proposal_status !== 'not_sent') && (
        <>
          {/* Current Status Badge */}
          <div className="p-4 rounded-lg border border-border/30 bg-surface-1/50 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Status da Proposta</p>
              <Badge variant="outline" className={cn("mt-1", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleCreateProposal}>
                Ver/Editar
              </Button>
            )}
          </div>

          {/* Status Select */}
          {isAdmin && (
            <div>
              <Label className="text-xs text-muted-foreground">Atualizar Status</Label>
              <Select
                value={lead.proposal_status}
                onValueChange={(v) => handleFieldChange('proposal_status', v as ProposalStatus)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPOSAL_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <Badge variant="outline" className={cn("text-xs", config.color)}>
                        {config.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Proposal URL */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Link className="h-3 w-3" /> Link da Proposta
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={lead.proposal_url || ''}
                onChange={(e) => handleFieldChange('proposal_url', e.target.value)}
                placeholder="Cole o link da proposta..."
                className="flex-1"
                disabled={!isAdmin}
              />
              {lead.proposal_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={lead.proposal_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Proposal Notes */}
          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea
              value={lead.proposal_notes || ''}
              onChange={(e) => handleFieldChange('proposal_notes', e.target.value)}
              placeholder="Detalhes, condições especiais, negociações..."
              className="mt-1 min-h-[80px]"
              disabled={!isAdmin}
            />
          </div>
        </>
      )}

      {/* Quick Actions */}
      {isAdmin && lead.proposal_status === 'not_sent' && lead.proposal_url && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleFieldChange('proposal_status', 'sent')}
        >
          Marcar como Enviada
        </Button>
      )}
    </div>
  );
}
