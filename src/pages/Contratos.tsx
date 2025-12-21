import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useContracts } from '@/hooks/useContracts';
import { useProposals } from '@/hooks/useProposals';
import { useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import {
  ContractsList,
  ContractEditor,
  ContractPreview,
} from '@/components/contracts';
import { Contract, ContractType } from '@/types/contract';
import { ArrowLeft, FileText, Plus } from 'lucide-react';

export default function Contratos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, currentAgencyId, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const {
    contracts,
    templates,
    loading,
    createContract,
    updateContract,
    deleteContract,
    sendContract,
    duplicateContract,
    refreshContracts,
  } = useContracts();
  
  const { proposals } = useProposals();
  const { leads } = useLeads();
  
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'preview'>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [contractType, setContractType] = useState<ContractType>('single_optimization');

  // Check for proposalId or leadId in URL params
  useEffect(() => {
    const proposalId = searchParams.get('proposalId');
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type') as ContractType;
    
    if (proposalId) {
      setSelectedProposalId(proposalId);
      setView('new');
    }
    if (leadId) {
      setSelectedLeadId(leadId);
      setView('new');
    }
    if (type) {
      setContractType(type);
    }
  }, [searchParams]);

  // Get selected data
  const selectedProposal = proposals.find(p => p.id === selectedProposalId);
  const selectedLead = leads.find(l => l.id === (selectedLeadId || selectedProposal?.lead_id));

  const handleNew = (type?: ContractType) => {
    setSelectedContract(null);
    setSelectedProposalId(null);
    setSelectedLeadId(null);
    if (type) setContractType(type);
    setView('new');
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setContractType(contract.contract_type);
    setView('edit');
  };

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setView('preview');
  };

  const handleSave = async (data: Partial<Contract>) => {
    try {
      if (selectedContract) {
        await updateContract(selectedContract.id, data);
        toast({ title: 'Contrato atualizado com sucesso!' });
      } else {
        const newContract = await createContract({
          ...data,
          lead_id: selectedLeadId || selectedProposal?.lead_id,
          proposal_id: selectedProposalId,
          contract_type: contractType,
        });
        if (newContract) {
          setSelectedContract(newContract);
          toast({ title: 'Contrato criado com sucesso!' });
        }
      }
      setView('list');
      refreshContracts();
    } catch (error) {
      toast({
        title: 'Erro ao salvar contrato',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleSend = async (contract: Contract) => {
    const success = await sendContract(contract.id);
    if (success) {
      toast({ title: 'Contrato enviado com sucesso!' });
      refreshContracts();
    }
  };

  const handleDuplicate = async (contract: Contract) => {
    const newContract = await duplicateContract(contract);
    if (newContract) {
      toast({ title: 'Contrato duplicado com sucesso!' });
      setSelectedContract(newContract);
      setView('edit');
    }
  };

  const handleDelete = async (contract: Contract) => {
    const success = await deleteContract(contract.id);
    if (success) {
      toast({ title: 'Contrato excluído com sucesso!' });
      refreshContracts();
    }
  };

  const handleViewPublic = (contract: Contract) => {
    if (contract.public_token) {
      window.open(`/contrato/${contract.public_token}`, '_blank');
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
            {view !== 'list' && (
              <Button variant="ghost" size="icon" onClick={() => setView('list')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {view === 'list' && 'Contratos'}
                {view === 'new' && 'Novo Contrato'}
                {view === 'edit' && 'Editar Contrato'}
                {view === 'preview' && 'Visualizar Contrato'}
              </h1>
              {selectedLead && (view === 'new' || view === 'edit') && (
                <p className="text-sm text-muted-foreground">
                  Para: {selectedLead.company_name}
                </p>
              )}
              {selectedProposal && (view === 'new' || view === 'edit') && (
                <p className="text-sm text-muted-foreground">
                  Baseado na proposta: {selectedProposal.title}
                </p>
              )}
            </div>
          </div>

          {view === 'list' && isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleNew('single_optimization')} className="gap-2">
                <Plus className="h-4 w-4" />
                Otimização Única
              </Button>
              <Button onClick={() => handleNew('recurring')} className="gap-2">
                <Plus className="h-4 w-4" />
                Recorrência
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {view === 'list' && (
          <ContractsList
            contracts={contracts}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onSend={handleSend}
            onViewPublic={handleViewPublic}
          />
        )}

        {(view === 'new' || view === 'edit') && (
          <ContractEditor
            contract={selectedContract || { contract_type: contractType }}
            onSave={handleSave}
            onSend={selectedContract ? async () => { await handleSend(selectedContract); } : undefined}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'preview' && selectedContract && (
          <ContractPreview contract={selectedContract} />
        )}
      </div>
    </div>
  );
}
