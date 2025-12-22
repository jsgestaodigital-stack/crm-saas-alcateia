import React, { useState, useEffect } from 'react';
import { 
  Contract, 
  ContractClause, 
  ContractType, 
  CONTRACT_TYPE_CONFIG,
  CONTRACT_VARIABLES,
  DEFAULT_SINGLE_OPTIMIZATION_CLAUSES,
  DEFAULT_RECURRING_CLAUSES
} from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContractClauseEditor } from './ContractClauseEditor';
import { ContractPreview } from './ContractPreview';
import { 
  Save, 
  Send, 
  FileText, 
  Plus, 
  Sparkles, 
  Copy,
  Variable,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ContractEditorProps {
  contract?: Partial<Contract>;
  onSave: (contract: Partial<Contract>) => Promise<void>;
  onSend?: (contract: Partial<Contract>) => Promise<void>;
  onCancel: () => void;
}

export function ContractEditor({ contract, onSave, onSend, onCancel }: ContractEditorProps) {
  const [formData, setFormData] = useState<Partial<Contract>>({
    title: 'Contrato de Prestação de Serviços',
    contract_type: 'single_optimization',
    clauses: DEFAULT_SINGLE_OPTIMIZATION_CLAUSES,
    variables: {},
    execution_term_days: 30,
    installments: 1,
    ...contract
  });
  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Calculate installment value automatically when price or installments change
  useEffect(() => {
    if (formData.full_price && formData.installments && formData.installments > 0) {
      const calculatedInstallmentValue = formData.full_price / formData.installments;
      if (formData.installment_value !== calculatedInstallmentValue) {
        setFormData(prev => ({ 
          ...prev, 
          installment_value: parseFloat(calculatedInstallmentValue.toFixed(2))
        }));
      }
    }
  }, [formData.full_price, formData.installments]);

  // Update clauses when contract type changes
  useEffect(() => {
    if (!contract?.id) {
      if (formData.contract_type === 'recurring') {
        setFormData(prev => ({ ...prev, clauses: DEFAULT_RECURRING_CLAUSES }));
      } else if (formData.contract_type === 'single_optimization') {
        setFormData(prev => ({ ...prev, clauses: DEFAULT_SINGLE_OPTIMIZATION_CLAUSES }));
      }
    }
  }, [formData.contract_type, contract?.id]);

  const handleClauseChange = (index: number, clause: ContractClause) => {
    const newClauses = [...(formData.clauses || [])];
    newClauses[index] = clause;
    setFormData(prev => ({ ...prev, clauses: newClauses }));
  };

  const handleDeleteClause = (index: number) => {
    const newClauses = [...(formData.clauses || [])];
    newClauses.splice(index, 1);
    setFormData(prev => ({ ...prev, clauses: newClauses }));
  };

  const handleMoveClause = (index: number, direction: 'up' | 'down') => {
    const newClauses = [...(formData.clauses || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newClauses[index], newClauses[newIndex]] = [newClauses[newIndex], newClauses[index]];
    newClauses.forEach((c, i) => c.order = i + 1);
    setFormData(prev => ({ ...prev, clauses: newClauses }));
  };

  const addCustomClause = () => {
    const newClause: ContractClause = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      title: 'Nova Cláusula',
      content: '',
      order: (formData.clauses?.length || 0) + 1,
      isRequired: false,
      isHidden: false,
      isEditable: true
    };
    setFormData(prev => ({ ...prev, clauses: [...(prev.clauses || []), newClause] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (onSend) {
      setSaving(true);
      try {
        await onSend(formData);
      } finally {
        setSaving(false);
      }
    }
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: {
          contractType: formData.contract_type,
          clientName: formData.contracted_name,
          clientCity: formData.variables?.cidade,
          serviceValue: formData.full_price,
          executionDays: formData.execution_term_days
        }
      });

      if (error) throw error;

      if (data?.clauses) {
        setFormData(prev => ({ ...prev, clauses: data.clauses }));
        toast.success('Cláusulas geradas com IA!');
      }
    } catch (err: any) {
      toast.error('Erro ao gerar com IA: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const insertVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast.success(`Variável ${variable} copiada!`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <Input
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="text-lg font-semibold w-80"
            placeholder="Título do contrato"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          {onSend && (
            <Button onClick={handleSend} disabled={saving} variant="default">
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 w-fit">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="clauses">Cláusulas</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-6 max-w-4xl">
            {/* Contract Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value: ContractType) => setFormData(prev => ({ ...prev, contract_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Values */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Valores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Valor Total (R$)</Label>
                  <Input
                    type="number"
                    value={formData.full_price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_price: parseFloat(e.target.value) || undefined }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Parcelas</Label>
                    <Input
                      type="number"
                      value={formData.installments || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) || 1 }))}
                      min={1}
                      max={24}
                    />
                  </div>
                  <div>
                    <Label>Valor da Parcela</Label>
                    <Input
                      type="number"
                      value={formData.installment_value || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Calculado automaticamente</p>
                  </div>
                </div>
                <div>
                  <Label>Prazo de Execução (dias)</Label>
                  <Input
                    type="number"
                    value={formData.execution_term_days || 30}
                    onChange={(e) => setFormData(prev => ({ ...prev, execution_term_days: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* City - Important for contract */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-base">📍 Local do Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cidade (para assinatura e foro)</Label>
                    <Input
                      value={(formData.variables as Record<string, string>)?.cidade || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        variables: { ...(prev.variables || {}), cidade: e.target.value }
                      }))}
                      placeholder="Ex: São Paulo"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Usada nas variáveis {"{{cidade}}"}</p>
                  </div>
                  <div>
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={formData.payment_method || 'pix'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contractor (Agency) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🏢 Contratada (Agência)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nome/Razão Social</Label>
                  <Input
                    value={formData.contractor_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractor_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      value={formData.contractor_cnpj || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractor_cnpj: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>CPF Responsável</Label>
                    <Input
                      value={formData.contractor_cpf || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractor_cpf: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input
                    value={formData.contractor_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractor_address: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={formData.contractor_responsible || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractor_responsible: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      value={formData.contractor_email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractor_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.contractor_phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractor_phone: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contracted (Client) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🤝 Contratante (Cliente)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nome/Razão Social</Label>
                  <Input
                    value={formData.contracted_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contracted_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      value={formData.contracted_cnpj || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contracted_cnpj: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>CPF Responsável</Label>
                    <Input
                      value={formData.contracted_cpf || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contracted_cpf: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input
                    value={formData.contracted_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contracted_address: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={formData.contracted_responsible || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contracted_responsible: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      value={formData.contracted_email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contracted_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.contracted_phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contracted_phone: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clauses" className="flex-1 overflow-hidden flex gap-4 p-4">
          {/* Clauses Editor */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Cláusulas do Contrato</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateWithAI} disabled={generating}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? 'Gerando...' : 'Gerar com IA'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={addCustomClause}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cláusula
                  </Button>
                </div>
              </div>
              
              {formData.clauses?.map((clause, index) => (
                <ContractClauseEditor
                  key={clause.id}
                  clause={clause}
                  index={index}
                  totalClauses={formData.clauses?.length || 0}
                  onChange={(c) => handleClauseChange(index, c)}
                  onDelete={() => handleDeleteClause(index)}
                  onMoveUp={() => handleMoveClause(index, 'up')}
                  onMoveDown={() => handleMoveClause(index, 'down')}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Variables Panel */}
          <Card className="w-72 shrink-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Variable className="h-4 w-4" />
                Variáveis Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {CONTRACT_VARIABLES.map((variable) => (
                    <Button
                      key={variable.key}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => insertVariable(variable.key)}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      <span className="font-mono">{variable.key}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-auto p-4">
          <ContractPreview contract={formData as Contract} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
