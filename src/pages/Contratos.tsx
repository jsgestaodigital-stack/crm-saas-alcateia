import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useContracts } from '@/hooks/useContracts';
import { useProposals } from '@/hooks/useProposals';
import { useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { useTrialFeatures } from '@/hooks/useTrialFeatures';
import {
  ContractsList,
  ContractEditor,
  ContractPreview,
  ContractHelpSection,
} from '@/components/contracts';
import { ProFeatureBadge } from '@/components/plan';
import { Contract, ContractType } from '@/types/contract';
import { ArrowLeft, FileText, Plus, HelpCircle, Crown } from 'lucide-react';
import { useSafeBack } from '@/hooks/useSafeBack';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Contratos() {
  const navigate = useNavigate(); const goBack = useSafeBack();
  const [searchParams] = useSearchParams();
  const { user, currentAgencyId, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { isDigitalSignatureBlocked, isTrial } = useTrialFeatures();
  
  const {
    contracts,
    templates,
    loading: contractsLoading,
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
  const [initialVariables, setInitialVariables] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState(false);
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

  // Generate initial variables from proposal data
  useEffect(() => {
    if (selectedProposal) {
      const vars: Record<string, string> = { ...selectedProposal.variables };
      
      // Map proposal data to contract variables
      if (selectedProposal.client_name) vars['nome_cliente'] = selectedProposal.client_name;
      if (selectedProposal.company_name) vars['nome_empresa'] = selectedProposal.company_name;
      if (selectedProposal.contact_email) vars['email'] = selectedProposal.contact_email;
      if (selectedProposal.contact_phone) vars['telefone'] = selectedProposal.contact_phone;
      if (selectedProposal.city) vars['cidade'] = selectedProposal.city;
      
      // Financial data
      if (selectedProposal.discounted_price || selectedProposal.full_price) {
        vars['valor_total'] = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(selectedProposal.discounted_price || selectedProposal.full_price || 0);
      }
      if (selectedProposal.installments) {
        vars['parcelas'] = selectedProposal.installments.toString();
      }
      if (selectedProposal.installment_value) {
        vars['valor_parcela'] = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(selectedProposal.installment_value);
      }
      if (selectedProposal.payment_method) {
        vars['forma_pagamento'] = selectedProposal.payment_method;
      }
      
      // Extract services from scope block
      const scopeBlock = selectedProposal.blocks.find(b => b.type === 'scope');
      if (scopeBlock?.checklist) {
        vars['servicos_contratados'] = scopeBlock.checklist.join(', ');
      }
      
      setInitialVariables(vars);
    } else if (selectedLead) {
      const vars: Record<string, string> = {};
      if (selectedLead.company_name) vars['nome_empresa'] = selectedLead.company_name;
      if (selectedLead.contact_name) vars['nome_cliente'] = selectedLead.contact_name;
      if (selectedLead.email) vars['email'] = selectedLead.email;
      if (selectedLead.phone) vars['telefone'] = selectedLead.phone;
      if (selectedLead.city) vars['cidade'] = selectedLead.city;
      if (selectedLead.whatsapp) vars['whatsapp'] = selectedLead.whatsapp;
      if (selectedLead.estimated_value) {
        vars['valor_total'] = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(selectedLead.estimated_value);
      }
      setInitialVariables(vars);
    }
  }, [selectedProposal, selectedLead]);

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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show message if no agency is selected
  if (!currentAgencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Nenhuma agência selecionada.</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </Button>
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
              aria-label={view === 'list' ? "Voltar" : "Voltar para lista de contratos"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {view === 'list' && 'Contratos'}
                {view === 'new' && 'Novo Contrato'}
                {view === 'edit' && 'Editar Contrato'}
                {view === 'preview' && 'Visualizar Contrato'}
              </h1>
              {isDigitalSignatureBlocked && (
                <ProFeatureBadge 
                  feature="Assinatura Digital" 
                  showUpgradeDialog={true}
                />
              )}
            </div>
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

          {view === 'list' && (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHelp(!showHelp)}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Ajuda
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" onClick={() => handleNew('single_optimization')} className="gap-2" aria-label="Criar contrato de otimização única">
                    <Plus className="h-4 w-4" />
                    Otimização Única
                  </Button>
                  <Button onClick={() => handleNew('recurring')} className="gap-2" aria-label="Criar contrato de recorrência">
                    <Plus className="h-4 w-4" />
                    Recorrência
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Help Section */}
        <Collapsible open={showHelp} onOpenChange={setShowHelp}>
          <CollapsibleContent className="mb-6">
            <ContractHelpSection />
          </CollapsibleContent>
        </Collapsible>

        {/* Content */}
        {view === 'list' && (
          <>
            {!showHelp && <ContractHelpSection showCompact />}
            <ContractsList
              contracts={contracts}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onSend={handleSend}
              onViewPublic={handleViewPublic}
            />
          </>
        )}

        {(view === 'new' || view === 'edit') && (
          <ContractEditor
            contract={selectedContract || { 
              contract_type: contractType,
              variables: initialVariables,
              title: selectedProposal 
                ? `Contrato - ${selectedProposal.company_name || selectedProposal.client_name}` 
                : selectedLead 
                  ? `Contrato - ${selectedLead.company_name}`
                  : 'Contrato de Prestação de Serviços',
              // CORREÇÃO: contracted_ são os dados do CLIENTE (quem contrata o serviço)
              // contractor_ são os dados da AGÊNCIA (quem presta o serviço) - preenchidos manualmente
              contracted_name: selectedProposal?.company_name || selectedLead?.company_name,
              contracted_email: selectedProposal?.contact_email || selectedLead?.email,
              contracted_phone: selectedProposal?.contact_phone || selectedLead?.phone,
              contracted_responsible: selectedProposal?.client_name || selectedLead?.contact_name,
              full_price: selectedProposal?.discounted_price || selectedProposal?.full_price,
              installments: selectedProposal?.installments,
              installment_value: selectedProposal?.installment_value,
              payment_method: selectedProposal?.payment_method,
            }}
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
