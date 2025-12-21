import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Building2, 
  User, 
  CreditCard,
  CheckCircle2,
  Info
} from 'lucide-react';
import { ContractType } from '@/types/contract';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WizardData {
  // Step 1 - Type
  contractType: ContractType;
  
  // Step 2 - Client
  clientName: string;
  companyName: string;
  cnpj: string;
  cpf: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  
  // Step 3 - Services
  services: string[];
  customServices: string;
  executionDays: number;
  
  // Step 4 - Payment
  totalValue: number;
  paymentMethod: 'a_vista' | 'parcelado' | 'permuta';
  installments: number;
}

interface ContractWizardProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
  initialData?: Partial<WizardData>;
}

const AVAILABLE_SERVICES = [
  { id: 'seo', label: 'SEO Local' },
  { id: 'gmb', label: 'Otimização Google Meu Negócio' },
  { id: 'fotos', label: 'Sessão de Fotos Profissionais' },
  { id: '360', label: 'Fotos 360° e Tour Virtual' },
  { id: 'ads', label: 'Google Ads' },
  { id: 'site', label: 'Criação de Site' },
  { id: 'social', label: 'Gestão de Redes Sociais' },
];

const STEPS = [
  { id: 1, title: 'Tipo de Contrato', icon: FileText },
  { id: 2, title: 'Dados do Cliente', icon: User },
  { id: 3, title: 'Serviços', icon: Building2 },
  { id: 4, title: 'Pagamento', icon: CreditCard },
];

export function ContractWizard({ onComplete, onCancel, initialData }: ContractWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    contractType: initialData?.contractType || 'single_optimization',
    clientName: initialData?.clientName || '',
    companyName: initialData?.companyName || '',
    cnpj: initialData?.cnpj || '',
    cpf: initialData?.cpf || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    services: initialData?.services || ['gmb'],
    customServices: initialData?.customServices || '',
    executionDays: initialData?.executionDays || 60,
    totalValue: initialData?.totalValue || 0,
    paymentMethod: initialData?.paymentMethod || 'a_vista',
    installments: initialData?.installments || 1,
  });

  const progress = (step / STEPS.length) * 100;

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!data.contractType;
      case 2:
        return data.companyName && data.email;
      case 3:
        return data.services.length > 0 || data.customServices;
      case 4:
        return data.totalValue > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleService = (serviceId: string) => {
    setData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((s) => (
            <div 
              key={s.id}
              className={`flex items-center gap-2 text-sm ${
                step >= s.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Help Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Você pode usar nosso sistema sem conectar com serviços externos. 
          Geramos um contrato 100% jurídico pronto para imprimir ou baixar.
        </AlertDescription>
      </Alert>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(STEPS[step - 1].icon, { className: "h-5 w-5" })}
            {STEPS[step - 1].title}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Escolha o tipo de contrato para seu cliente'}
            {step === 2 && 'Preencha os dados do cliente contratante'}
            {step === 3 && 'Selecione os serviços que serão prestados'}
            {step === 4 && 'Defina o valor e forma de pagamento'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Contract Type */}
          {step === 1 && (
            <RadioGroup
              value={data.contractType}
              onValueChange={(value: ContractType) => updateData({ contractType: value })}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="single_optimization" id="single" />
                <Label htmlFor="single" className="flex-1 cursor-pointer">
                  <div className="font-medium">📍 Otimização Única</div>
                  <div className="text-sm text-muted-foreground">
                    Projeto pontual com prazo definido de execução
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="recurring" id="recurring" />
                <Label htmlFor="recurring" className="flex-1 cursor-pointer">
                  <div className="font-medium">🔁 Recorrência Mensal</div>
                  <div className="text-sm text-muted-foreground">
                    Contrato contínuo com cobrança mensal
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div className="font-medium">✍️ Personalizado</div>
                  <div className="text-sm text-muted-foreground">
                    Crie um contrato do zero com suas próprias cláusulas
                  </div>
                </Label>
              </div>
            </RadioGroup>
          )}

          {/* Step 2: Client Data */}
          {step === 2 && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Empresa *</Label>
                  <Input
                    value={data.companyName}
                    onChange={(e) => updateData({ companyName: e.target.value })}
                    placeholder="Ex: Clínica Exemplo"
                  />
                </div>
                <div>
                  <Label>Nome do Responsável</Label>
                  <Input
                    value={data.clientName}
                    onChange={(e) => updateData({ clientName: e.target.value })}
                    placeholder="Ex: João Silva"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ</Label>
                  <Input
                    value={data.cnpj}
                    onChange={(e) => updateData({ cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <Label>CPF do Responsável</Label>
                  <Input
                    value={data.cpf}
                    onChange={(e) => updateData({ cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={data.phone}
                    onChange={(e) => updateData({ phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <Label>Endereço Completo</Label>
                <Input
                  value={data.address}
                  onChange={(e) => updateData({ address: e.target.value })}
                  placeholder="Rua Exemplo, 123 - Centro"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={data.city}
                  onChange={(e) => updateData({ city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Selecione os serviços contratados:</Label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_SERVICES.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        data.services.includes(service.id) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleService(service.id)}
                    >
                      <Checkbox 
                        checked={data.services.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <Label className="cursor-pointer">{service.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Serviços personalizados (opcional)</Label>
                <Textarea
                  value={data.customServices}
                  onChange={(e) => updateData({ customServices: e.target.value })}
                  placeholder="Descreva outros serviços que não estão na lista..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Prazo de Execução (dias)</Label>
                <Input
                  type="number"
                  value={data.executionDays}
                  onChange={(e) => updateData({ executionDays: parseInt(e.target.value) || 60 })}
                  min={1}
                />
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <Label>Valor Total (R$) *</Label>
                <Input
                  type="number"
                  value={data.totalValue || ''}
                  onChange={(e) => updateData({ totalValue: parseFloat(e.target.value) || 0 })}
                  placeholder="5000.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label className="mb-3 block">Forma de Pagamento:</Label>
                <RadioGroup
                  value={data.paymentMethod}
                  onValueChange={(value: 'a_vista' | 'parcelado' | 'permuta') => updateData({ paymentMethod: value })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="a_vista" id="avista" />
                    <Label htmlFor="avista" className="cursor-pointer">À vista</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="parcelado" id="parcelado" />
                    <Label htmlFor="parcelado" className="cursor-pointer">Parcelado</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="permuta" id="permuta" />
                    <Label htmlFor="permuta" className="cursor-pointer">Permuta</Label>
                  </div>
                </RadioGroup>
              </div>

              {data.paymentMethod === 'parcelado' && (
                <div>
                  <Label>Número de Parcelas</Label>
                  <Input
                    type="number"
                    value={data.installments}
                    onChange={(e) => updateData({ installments: parseInt(e.target.value) || 1 })}
                    min={2}
                    max={24}
                  />
                  {data.totalValue > 0 && data.installments > 1 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {data.installments}x de R$ {(data.totalValue / data.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()}>
          {step === STEPS.length ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Gerar Contrato
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
