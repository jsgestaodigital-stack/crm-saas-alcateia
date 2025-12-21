import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProposals } from '@/hooks/useProposals';
import { ProposalsList, ProposalEditor, ProposalPreview } from '@/components/proposals';
import { Proposal, ProposalBlock } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { ArrowLeft, Eye, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ViewMode = 'list' | 'edit' | 'preview';

export default function Propostas() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const {
    proposals,
    templates,
    loading,
    createProposal,
    updateProposal,
    deleteProposal,
    sendProposal,
    duplicateProposal
  } = useProposals();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle URL params for editing
  useEffect(() => {
    const proposalId = searchParams.get('id');
    const mode = searchParams.get('mode');
    
    if (proposalId && proposals.length > 0) {
      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        setSelectedProposal(proposal);
        setViewMode(mode === 'preview' ? 'preview' : 'edit');
      }
    }
  }, [searchParams, proposals]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleNew = async () => {
    const newProposal = await createProposal({
      title: 'Nova Proposta',
      client_name: ''
    });
    if (newProposal) {
      setSelectedProposal(newProposal);
      setViewMode('edit');
      setSearchParams({ id: newProposal.id, mode: 'edit' });
    }
  };

  const handleEdit = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setViewMode('edit');
    setSearchParams({ id: proposal.id, mode: 'edit' });
  };

  const handleView = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setViewMode('preview');
    setSearchParams({ id: proposal.id, mode: 'preview' });
  };

  const handleBack = () => {
    setSelectedProposal(null);
    setViewMode('list');
    setSearchParams({});
  };

  const handleSave = async (data: Partial<Proposal>) => {
    if (selectedProposal) {
      await updateProposal(selectedProposal.id, data);
      // Update local state
      setSelectedProposal(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const handleSend = async () => {
    if (selectedProposal) {
      await sendProposal(selectedProposal.id);
      setSelectedProposal(prev => prev ? { ...prev, status: 'sent' as const } : null);
    }
  };

  const handleDuplicate = async (proposal: Proposal) => {
    const newProposal = await duplicateProposal(proposal);
    if (newProposal) {
      handleEdit(newProposal);
    }
  };

  const handleGenerateAI = async (prompt: string): Promise<ProposalBlock[] | null> => {
    if (!selectedProposal) return null;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: {
          clientName: selectedProposal.client_name,
          companyName: selectedProposal.company_name || selectedProposal.client_name,
          city: selectedProposal.city,
          category: '',
          customPrompt: prompt
        }
      });

      if (error) throw error;

      if (data?.success && data?.blocks) {
        // Also update suggested price
        if (data.suggestedPrice) {
          await updateProposal(selectedProposal.id, {
            full_price: data.suggestedPrice,
            discounted_price: data.suggestedPrice * 0.9,
            installments: data.suggestedInstallments || 3,
            ai_generated: true,
            ai_prompt: prompt
          });
        }
        return data.blocks;
      }

      toast.error('Falha ao gerar proposta com IA');
      return null;
    } catch (err: any) {
      console.error('AI generation error:', err);
      toast.error(err.message || 'Erro ao gerar proposta');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {viewMode === 'list' ? (
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Propostas</h1>
              <ProposalsList
                proposals={proposals}
                onNew={handleNew}
                onEdit={handleEdit}
                onView={handleView}
                onDuplicate={handleDuplicate}
                onDelete={deleteProposal}
                onSend={sendProposal}
              />
              </div>
            ) : (
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  
                  {selectedProposal && (
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === 'edit' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('edit')}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant={viewMode === 'preview' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Prévia
                      </Button>
                    </div>
                  )}
                </div>

                {viewMode === 'edit' && selectedProposal && (
                  <ProposalEditor
                    proposal={selectedProposal}
                    templates={templates || []}
                    onSave={handleSave}
                    onSend={handleSend}
                    onGenerateAI={handleGenerateAI}
                    isGenerating={isGenerating}
                  />
                )}

                {viewMode === 'preview' && selectedProposal && (
                  <ProposalPreview proposal={selectedProposal} />
                )}
              </div>
            )}
          </main>
        </div>
      </div>
  );
}
