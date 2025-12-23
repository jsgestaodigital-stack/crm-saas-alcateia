import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Lead, ProposalStatus, PROPOSAL_STATUS_CONFIG } from '@/types/lead';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { FileText, Link, ExternalLink, Plus, Sparkles } from 'lucide-react';
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
      {/* Create Proposal Button */}
      {isAdmin && (
        <Button
          onClick={handleCreateProposal}
          className="w-full gap-2"
          variant="default"
        >
          <Sparkles className="h-4 w-4" />
          Criar Proposta com IA
        </Button>
      )}

      {/* Status */}
      <div>
        <Label className="text-xs text-muted-foreground">Status da Proposta</Label>
        <Select
          value={lead.proposal_status}
          onValueChange={(v) => handleFieldChange('proposal_status', v as ProposalStatus)}
          disabled={!isAdmin}
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

      {/* Current Status Badge */}
      <div className="p-3 rounded-lg border border-border/30 bg-surface-1/50 flex items-center gap-3">
        <FileText className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Status Atual</p>
          <Badge variant="outline" className={cn("mt-1", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Proposal URL */}
      <div>
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <Link className="h-3 w-3" /> Link da Proposta
        </Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={lead.proposal_url || ''}
            onChange={(e) => handleFieldChange('proposal_url', e.target.value)}
            placeholder="Cole o link do Drive/Docs/PDF..."
            className="flex-1"
            disabled={!isAdmin}
          />
          {lead.proposal_url && (
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <a 
                href={lead.proposal_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Proposal Notes */}
      <div>
        <Label className="text-xs text-muted-foreground">Observações da Proposta</Label>
        <Textarea
          value={lead.proposal_notes || ''}
          onChange={(e) => handleFieldChange('proposal_notes', e.target.value)}
          placeholder="Detalhes, condições especiais, negociações..."
          className="mt-1 min-h-[100px]"
          disabled={!isAdmin}
        />
      </div>

      {/* Quick Actions */}
      {isAdmin && lead.proposal_status === 'not_sent' && (
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
