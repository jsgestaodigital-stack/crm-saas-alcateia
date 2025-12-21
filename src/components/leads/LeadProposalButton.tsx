import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProposals } from '@/hooks/useProposals';
import { Lead } from '@/types/lead';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LeadProposalButtonProps {
  lead: Lead;
}

export function LeadProposalButton({ lead }: LeadProposalButtonProps) {
  const navigate = useNavigate();
  const { createProposal } = useProposals();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProposal = async () => {
    setIsCreating(true);
    try {
      const proposal = await createProposal({
        title: `Proposta - ${lead.company_name}`,
        client_name: lead.contact_name || lead.company_name,
        company_name: lead.company_name,
        city: lead.city || undefined,
        contact_email: lead.email || undefined,
        contact_phone: lead.phone || undefined,
        lead_id: lead.id
      });

      if (proposal) {
        toast.success('Proposta criada!');
        navigate(`/propostas?id=${proposal.id}&mode=edit`);
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
      toast.error('Erro ao criar proposta');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleCreateProposal}
      disabled={isCreating}
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      Criar Proposta Completa
    </Button>
  );
}
