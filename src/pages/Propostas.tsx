import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProposals } from '@/hooks/useProposals';
import { useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ProposalsList,
  ProposalEditor,
  ProposalPreview,
} from '@/components/proposals';
import { Proposal, ProposalBlock } from '@/types/proposal';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useSafeBack } from '@/hooks/useSafeBack';

export default function Propostas() {
  const navigate = useNavigate();
  const goBack = useSafeBack();
  const [searchParams] = useSearchParams();
  const { user, currentAgencyId, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const {
    proposals,
    templates,
    loading,
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal,
    duplicateProposal,
    fetchProposals,
  } = useProposals();
  
  const { leads } = useLeads();
  
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'preview'>('list');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check for leadId in URL params
  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId) {
      setSelectedLeadId(leadId);
      setView('new');
    }
  }, [searchParams]);

  // Get selected lead data
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleNew = () => {
    setSelectedProposal(null);
    setSelectedLeadId(null);
    setView('new');
  };

  const handleEdit = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setView('edit');
  };

  const handleView = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setView('preview');
  };

  const handleSave = async (data: Partial<Proposal>) => {
    try {
      if (selectedProposal) {
        await updateProposal(selectedProposal.id, data);
        toast({ title: 'Proposta atualizada com sucesso!' });
      } else {
        const newProposal = await createProposal({
          ...data,
          lead_id: selectedLeadId,
          created_by: user?.id || '',
        });
        if (newProposal) {
          setSelectedProposal(newProposal);
          toast({ title: 'Proposta criada com sucesso!' });
        }
      }
      setView('list');
      fetchProposals();
    } catch (error) {
      toast({
        title: 'Erro ao salvar proposta',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleSend = async (proposal: Proposal) => {
    const success = await sendProposal(proposal.id);
    if (success) {
      toast({ title: 'Proposta enviada com sucesso!' });
      fetchProposals();
    }
  };

  const handleDuplicate = async (proposal: Proposal) => {
    const newProposal = await duplicateProposal(proposal);
    if (newProposal) {
      toast({ title: 'Proposta duplicada com sucesso!' });
      setSelectedProposal(newProposal);
      setView('edit');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProposal(id);
    if (success) {
      toast({ title: 'Proposta excluída com sucesso!' });
      fetchProposals();
    }
  };

  const handleGenerateAI = async (prompt: string, keywords?: string): Promise<ProposalBlock[] | null> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: {
          leadId: selectedLeadId,
          clientName: selectedLead?.contact_name || '',
          companyName: selectedLead?.company_name || '',
          city: selectedLead?.city || '',
          category: selectedLead?.main_category || '',
          keywords: keywords || selectedLead?.main_category || '',
          customPrompt: prompt,
        },
      });

      if (error) throw error;

      if (data.blocks) {
        toast({ title: 'Proposta gerada com IA!', description: 'Revise e personalize conforme necessário.' });
        return data.blocks;
      }
      return null;
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'Erro ao gerar proposta',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user || !currentAgencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => view === 'list' ? goBack() : setView('list')} 
              aria-label={view === 'list' ? "Voltar" : "Voltar para lista de propostas"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {view === 'list' && 'Propostas'}
                {view === 'new' && 'Nova Proposta'}
                {view === 'edit' && 'Editar Proposta'}
                {view === 'preview' && 'Visualizar Proposta'}
              </h1>
              {selectedLead && view === 'new' && (
                <p className="text-sm text-muted-foreground">
                  Para: {selectedLead.company_name}
                </p>
              )}
            </div>
          </div>

          {/* Single new proposal button - only in list view header */}
        </div>

        {/* Content */}
        {view === 'list' && (
          <ProposalsList
            proposals={proposals}
            onNew={handleNew}
            onEdit={handleEdit}
            onView={handleView}
            onDuplicate={handleDuplicate}
            onDelete={(id: string) => handleDelete(id)}
            onSend={(proposal: Proposal) => handleSend(proposal)}
          />
        )}

        {(view === 'new' || view === 'edit') && (
          <ProposalEditor
            proposal={selectedProposal || undefined}
            lead={selectedLead}
            templates={templates}
            onSave={handleSave}
            onSend={selectedProposal ? () => handleSend(selectedProposal) : undefined}
            onGenerateAI={handleGenerateAI}
            isGenerating={isGenerating}
          />
        )}

        {view === 'preview' && selectedProposal && (
          <ProposalPreview proposal={selectedProposal} />
        )}
      </div>
    </div>
  );
}
