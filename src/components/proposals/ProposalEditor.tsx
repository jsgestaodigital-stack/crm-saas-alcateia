import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProposalBlockComponent } from './ProposalBlock';
import { 
  Proposal, 
  ProposalBlock, 
  ProposalTemplate,
  DEFAULT_PROPOSAL_BLOCKS,
  BLOCK_TYPE_CONFIG,
  ProposalBlockType 
} from '@/types/proposal';
import { Lead } from '@/types/lead';
import { 
  Save, 
  Send, 
  Copy, 
  FileText, 
  Sparkles, 
  Plus,
  Eye,
  Link,
  Wand2,
  ClipboardCopy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProposalEditorProps {
  proposal?: Proposal | null;
  lead?: Lead | null;
  templates: ProposalTemplate[];
  onSave: (data: Partial<Proposal>) => Promise<void>;
  onSend?: () => Promise<void>;
  onGenerateAI?: (prompt: string, keywords?: string) => Promise<ProposalBlock[] | null>;
  isGenerating?: boolean;
}

export function ProposalEditor({
  proposal,
  lead,
  templates,
  onSave,
  onSend,
  onGenerateAI,
  isGenerating = false
}: ProposalEditorProps) {
  const [title, setTitle] = useState(proposal?.title || 'Nova Proposta');
  const [clientName, setClientName] = useState(proposal?.client_name || lead?.contact_name || '');
  const [companyName, setCompanyName] = useState(proposal?.company_name || lead?.company_name || '');
  const [city, setCity] = useState(proposal?.city || lead?.city || '');
  const [contactEmail, setContactEmail] = useState(proposal?.contact_email || lead?.email || '');
  const [contactPhone, setContactPhone] = useState(proposal?.contact_phone || lead?.phone || '');
  
  const [blocks, setBlocks] = useState<ProposalBlock[]>(
    proposal?.blocks || DEFAULT_PROPOSAL_BLOCKS
  );
  
  const [fullPrice, setFullPrice] = useState<string>(proposal?.full_price?.toString() || '');
  const [discountedPrice, setDiscountedPrice] = useState<string>(proposal?.discounted_price?.toString() || '');
  const [installments, setInstallments] = useState<string>(proposal?.installments?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(proposal?.payment_method || '');
  const [discountReason, setDiscountReason] = useState(proposal?.discount_reason || '');
  const [validUntil, setValidUntil] = useState(proposal?.valid_until || '');
  const [keywords, setKeywords] = useState(lead?.main_category || '');
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Variables for template replacement
  const variables: Record<string, string> = {
    nome_cliente: clientName,
    nome_empresa: companyName,
    cidade: city,
    palavras_chave: keywords,
    responsavel: lead?.responsible || ''
  };

  // Payment methods options
  const PAYMENT_METHODS = [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto Bancário' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'transferencia', label: 'Transferência Bancária' },
    { value: 'dinheiro', label: 'Dinheiro' },
  ];

  // Calculate installment value
  const installmentValue = discountedPrice && installments 
    ? (parseFloat(discountedPrice) / parseInt(installments)).toFixed(2)
    : '';

  const handleBlockUpdate = (index: number, updatedBlock: ProposalBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };

  const handleBlockDelete = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleBlockMove = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    // Update order property
    newBlocks.forEach((block, i) => {
      block.order = i + 1;
    });
    setBlocks(newBlocks);
  };

  const handleAddBlock = (type: ProposalBlockType) => {
    const config = BLOCK_TYPE_CONFIG[type];
    const newBlock: ProposalBlock = {
      id: `${type}-${Date.now()}`,
      type,
      title: `${config.emoji} ${config.label}`,
      content: '',
      order: blocks.length + 1,
      checklist: type === 'scope' ? [] : undefined
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleApplyTemplate = (template: ProposalTemplate) => {
    setBlocks(template.blocks);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const handleGenerateWithAI = async () => {
    if (!onGenerateAI || !aiPrompt.trim()) return;
    
    const generatedBlocks = await onGenerateAI(aiPrompt, keywords);
    if (generatedBlocks) {
      setBlocks(generatedBlocks);
      toast.success('Proposta gerada com IA!');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        title,
        client_name: clientName,
        company_name: companyName,
        city,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        blocks,
        variables,
        full_price: fullPrice ? parseFloat(fullPrice) : null,
        discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
        installments: installments ? parseInt(installments) : null,
        installment_value: installmentValue ? parseFloat(installmentValue) : null,
        payment_method: paymentMethod || null,
        discount_reason: discountReason || null,
        valid_until: validUntil || null,
        ai_prompt: aiPrompt || null
      });
      toast.success('Proposta salva!');
    } catch (err) {
      toast.error('Erro ao salvar proposta');
    } finally {
      setIsSaving(false);
    }
  };

  const copyPublicLink = () => {
    if (proposal?.public_token) {
      const url = `${window.location.origin}/proposta/${proposal.public_token}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  // Generate full proposal text for copying
  const getFullProposalText = () => {
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
    
    let text = `${title}\n`;
    text += `${'='.repeat(40)}\n\n`;
    
    if (companyName) text += `Empresa: ${companyName}\n`;
    if (clientName) text += `Cliente: ${clientName}\n`;
    if (city) text += `Cidade: ${city}\n`;
    if (keywords) text += `Palavras-chave: ${keywords}\n`;
    text += '\n';

    sortedBlocks.forEach(block => {
      text += `${block.title}\n`;
      text += `${'-'.repeat(30)}\n`;
      
      if (block.type === 'scope' && block.checklist) {
        block.checklist.forEach(item => {
          text += `✓ ${item}\n`;
        });
      } else if (block.type === 'investment') {
        if (fullPrice) text += `Valor: R$ ${fullPrice}\n`;
        if (discountedPrice && discountedPrice !== fullPrice) {
          text += `Valor promocional: R$ ${discountedPrice}\n`;
        }
        if (installments && installmentValue) {
          text += `Ou ${installments}x de R$ ${installmentValue}\n`;
        }
        if (paymentMethod) {
          const method = PAYMENT_METHODS.find(m => m.value === paymentMethod);
          text += `Forma de pagamento: ${method?.label || paymentMethod}\n`;
        }
      } else if (block.content) {
        let content = block.content;
        Object.entries(variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
        });
        text += `${content}\n`;
      }
      text += '\n';
    });

    if (validUntil) {
      text += `\nProposta válida até: ${new Date(validUntil).toLocaleDateString('pt-BR')}\n`;
    }

    return text;
  };

  const handleCopyFullProposal = async () => {
    try {
      await navigator.clipboard.writeText(getFullProposalText());
      setCopiedAll(true);
      toast.success('Proposta completa copiada!');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar proposta');
    }
  };

  // Calculate progress for stepper
  const hasClientInfo = Boolean(clientName || companyName);
  const hasBlocks = blocks.length > 0 && blocks.some(b => b.content || (b.checklist && b.checklist.length > 0));
  const hasPricing = Boolean(fullPrice || discountedPrice);
  const isReadyToSend = hasClientInfo && hasBlocks && hasPricing;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Stepper */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Progresso da proposta</span>
              <span className="text-xs text-muted-foreground">
                {[hasClientInfo, hasBlocks, hasPricing].filter(Boolean).length}/3 etapas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                hasClientInfo ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                hasBlocks ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                hasPricing ? "bg-primary" : "bg-muted"
              )} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className={hasClientInfo ? "text-primary font-medium" : ""}>① Dados do cliente</span>
              <span className={hasBlocks ? "text-primary font-medium" : ""}>② Conteúdo</span>
              <span className={hasPricing ? "text-primary font-medium" : ""}>③ Valores</span>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                ① Dados do Cliente
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Título da Proposta</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Proposta de Otimização Google"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Validade</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nome do Cliente</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Empresa</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cidade</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: São Paulo, Campinas"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-mail</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Palavras-chave Principais</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Ex: dentista em campinas, melhor advogado, restaurante italiano SP"
                />
                <p className="text-xs text-muted-foreground mt-1">Usadas para personalizar a proposta com IA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Generation */}
        {onGenerateAI && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="font-medium">Gerar com IA</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Descreva o serviço e o perfil do cliente para gerar uma proposta personalizada..."
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleGenerateWithAI} 
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Gerando...' : 'Gerar Proposta'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">② Conteúdo da Proposta</h3>
            <Select onValueChange={(v) => handleAddBlock(v as ProposalBlockType)}>
              <SelectTrigger className="w-[180px]">
                <Plus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Adicionar bloco" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BLOCK_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.emoji} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {blocks.map((block, index) => (
              <ProposalBlockComponent
                key={block.id}
                block={block}
                onUpdate={(updated) => handleBlockUpdate(index, updated)}
                onDelete={() => handleBlockDelete(index)}
                onMoveUp={() => handleBlockMove(index, 'up')}
                onMoveDown={() => handleBlockMove(index, 'down')}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                variables={variables}
              />
            ))}
          </div>

          {/* Final CTA */}
          {blocks.length > 0 && (
            <Card className={cn(
              "border-2 transition-all",
              isReadyToSend 
                ? "border-primary bg-primary/10" 
                : "border-dashed border-muted-foreground/30 bg-surface-1/50"
            )}>
              <CardContent className="py-5 space-y-4">
                {isReadyToSend ? (
                  <>
                    <div className="text-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">Proposta pronta!</h4>
                      <p className="text-sm text-muted-foreground">Salve e copie o link para enviar ao cliente</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={async () => {
                          await handleSave();
                          copyPublicLink();
                        }}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Link className="h-5 w-5" />
                        Salvar e Copiar Link
                      </Button>
                      <Button 
                        onClick={handleCopyFullProposal}
                        className="w-full gap-2"
                        variant="outline"
                      >
                        {copiedAll ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="h-4 w-4" />
                            Copiar texto completo
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete as etapas acima para enviar a proposta
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs">
                      {!hasClientInfo && <Badge variant="outline">Falta: Dados do cliente</Badge>}
                      {!hasBlocks && <Badge variant="outline">Falta: Conteúdo</Badge>}
                      {!hasPricing && <Badge variant="outline">Falta: Valores</Badge>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Pricing */}
        <Card className={cn(!hasPricing && "border-primary/30 bg-primary/5")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              ③ Investimento
              {!hasPricing && <Badge variant="secondary" className="text-xs">Preencha</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Valor Cheio</Label>
              <Input
                type="number"
                value={fullPrice}
                onChange={(e) => setFullPrice(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor com Desconto</Label>
              <Input
                type="number"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Parcelas</Label>
                <Input
                  type="number"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  placeholder="Ex: 3"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor Parcela</Label>
                <Input
                  type="text"
                  value={installmentValue ? `R$ ${installmentValue}` : ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum template disponível</p>
                ) : (
                  templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="w-full justify-start h-auto py-2"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Variáveis Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.keys(variables).map((key) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {`{{${key}}}`}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use estas variáveis no texto para inserir dados automaticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
