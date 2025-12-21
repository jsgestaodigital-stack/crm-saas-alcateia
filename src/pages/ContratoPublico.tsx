import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useContracts } from '@/hooks/useContracts';
import { Contract, ContractClause, CONTRACT_STATUS_CONFIG, CONTRACT_TYPE_CONFIG, CONTRACT_VARIABLES } from '@/types/contract';
import { formatCpf, validateCpf } from '@/lib/cpfValidation';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  Shield,
  Loader2,
  AlertCircle,
  Signature
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ContratoPublico() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const { getContractByToken, signContract } = useContracts();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [showSignForm, setShowSignForm] = useState(false);
  
  // Signature form
  const [signatureName, setSignatureName] = useState('');
  const [signatureCpf, setSignatureCpf] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (token) {
      loadContract();
    }
  }, [token]);

  const loadContract = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await getContractByToken(token);
      if (data && typeof data === 'object' && 'id' in data) {
        // Map the data to Contract type
        const mappedContract: Contract = {
          id: data.id as string,
          agency_id: data.agency_id as string,
          title: data.title as string,
          contract_type: data.contract_type as Contract['contract_type'],
          status: data.status as Contract['status'],
          clauses: (data.clauses as unknown as ContractClause[]) || [],
          variables: (data.variables as Record<string, string>) || {},
          contractor_name: data.contractor_name as string | undefined,
          contractor_cnpj: data.contractor_cnpj as string | undefined,
          contractor_cpf: data.contractor_cpf as string | undefined,
          contractor_address: data.contractor_address as string | undefined,
          contractor_email: data.contractor_email as string | undefined,
          contractor_phone: data.contractor_phone as string | undefined,
          contractor_responsible: data.contractor_responsible as string | undefined,
          contracted_name: data.contracted_name as string | undefined,
          contracted_cnpj: data.contracted_cnpj as string | undefined,
          contracted_cpf: data.contracted_cpf as string | undefined,
          contracted_address: data.contracted_address as string | undefined,
          contracted_email: data.contracted_email as string | undefined,
          contracted_phone: data.contracted_phone as string | undefined,
          contracted_responsible: data.contracted_responsible as string | undefined,
          full_price: data.full_price as number | undefined,
          discounted_price: data.discounted_price as number | undefined,
          installments: data.installments as number | undefined,
          installment_value: data.installment_value as number | undefined,
          execution_term_days: data.execution_term_days as number | undefined,
          public_token: data.public_token as string | undefined,
          view_count: data.view_count as number | undefined,
          client_signature_name: data.client_signature_name as string | undefined,
          client_signed_at: data.client_signed_at as string | undefined,
          created_by: data.created_by as string,
          created_at: data.created_at as string,
          updated_at: data.updated_at as string,
        };
        setContract(mappedContract);
      } else {
        setError('Contrato não encontrado ou link expirado.');
      }
    } catch (err) {
      console.error('Error loading contract:', err);
      setError('Erro ao carregar o contrato.');
    } finally {
      setLoading(false);
    }
  };

  const replaceVariables = (content: string): string => {
    if (!contract) return content;
    
    let result = content;
    
    // Replace contract variables
    CONTRACT_VARIABLES.forEach(variable => {
      const value = getVariableValue(variable.source);
      result = result.replace(new RegExp(variable.key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    return result;
  };

  const getVariableValue = (source: string): string => {
    if (!contract) return '';
    
    switch (source) {
      case 'contracted_name': return contract.contracted_name || '';
      case 'contracted_cnpj': return contract.contracted_cnpj || '';
      case 'contracted_cpf': return contract.contracted_cpf || '';
      case 'contracted_email': return contract.contracted_email || '';
      case 'contracted_address': return contract.contracted_address || '';
      case 'contracted_responsible': return contract.contracted_responsible || '';
      case 'contracted_phone': return contract.contracted_phone || '';
      case 'contractor_name': return contract.contractor_name || '';
      case 'contractor_cnpj': return contract.contractor_cnpj || '';
      case 'contractor_address': return contract.contractor_address || '';
      case 'contractor_responsible': return contract.contractor_responsible || '';
      case 'full_price': return contract.full_price ? `R$ ${contract.full_price.toLocaleString('pt-BR')}` : '';
      case 'discounted_price': return contract.discounted_price ? `R$ ${contract.discounted_price.toLocaleString('pt-BR')}` : '';
      case 'installments': return contract.installments?.toString() || '';
      case 'installment_value': return contract.installment_value ? `R$ ${contract.installment_value.toLocaleString('pt-BR')}` : '';
      case 'execution_term_days': return contract.execution_term_days?.toString() || '30';
      case 'current_date': return format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'city': return '';
      default: return '';
    }
  };

  const handleSign = async () => {
    if (!contract || !token) return;
    
    if (!signatureName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite seu nome completo para assinar.',
        variant: 'destructive',
      });
      return;
    }

    // Validate CPF with proper algorithm
    const cpfError = validateCpf(signatureCpf);
    if (cpfError) {
      toast({
        title: 'CPF inválido',
        description: cpfError,
        variant: 'destructive',
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: 'Aceite os termos',
        description: 'Você precisa aceitar os termos para assinar o contrato.',
        variant: 'destructive',
      });
      return;
    }

    setSigning(true);
    try {
      const success = await signContract(token, signatureName, signatureCpf);
      if (success) {
        toast({
          title: 'Contrato assinado!',
          description: 'O contrato foi assinado com sucesso.',
        });
        await loadContract();
        setShowSignForm(false);
      }
    } catch (err) {
      toast({
        title: 'Erro ao assinar',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Contrato não encontrado</h2>
            <p className="text-muted-foreground">{error || 'O link pode estar expirado ou inválido.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSigned = contract.status === 'signed';
  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status];
  const typeConfig = CONTRACT_TYPE_CONFIG[contract.contract_type];
  const clauses = contract.clauses || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
            <span className="font-medium">{typeConfig.emoji} {typeConfig.label}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {contract.title}
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Badge className={statusConfig.color}>
              {statusConfig.emoji} {statusConfig.label}
            </Badge>
            {contract.view_count && contract.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {contract.view_count} visualizações
              </span>
            )}
          </div>
        </div>

        {/* Signed Notice */}
        {isSigned && (
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Contrato Assinado
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Assinado por {contract.client_signature_name} em{' '}
                    {contract.client_signed_at && format(new Date(contract.client_signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contractor Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Contratada
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{contract.contractor_name}</span>
            </div>
            {contract.contractor_cnpj && (
              <div className="text-muted-foreground">CNPJ: {contract.contractor_cnpj}</div>
            )}
            {contract.contractor_address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {contract.contractor_address}
              </div>
            )}
            {contract.contractor_email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {contract.contractor_email}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Clauses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Termos do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {clauses
              .filter((c: ContractClause) => !c.isHidden)
              .sort((a: ContractClause, b: ContractClause) => a.order - b.order)
              .map((clause: ContractClause, index: number) => (
                <div key={clause.id} className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {index + 1}. {clause.title}
                  </h3>
                  <div 
                    className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(
                        replaceVariables(clause.content)
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>'),
                        { ALLOWED_TAGS: ['strong', 'br', 'em', 'b', 'i', 'p'], ALLOWED_ATTR: [] }
                      )
                    }}
                  />
                  {index < clauses.filter((c: ContractClause) => !c.isHidden).length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Signature Section */}
        {!isSigned && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signature className="h-5 w-5 text-primary" />
                Assinatura Digital
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showSignForm ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Após ler atentamente todos os termos, clique no botão abaixo para assinar digitalmente.
                  </p>
                  <Button size="lg" onClick={() => setShowSignForm(true)} className="gap-2">
                    <Shield className="h-5 w-5" />
                    Assinar Contrato
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="signatureName">Nome Completo *</Label>
                      <Input
                        id="signatureName"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signatureCpf">CPF *</Label>
                      <Input
                        id="signatureCpf"
                        value={signatureCpf}
                        onChange={(e) => setSignatureCpf(formatCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="acceptTerms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm cursor-pointer leading-relaxed">
                      Li e concordo com todos os termos deste contrato. Entendo que esta assinatura digital 
                      tem validade jurídica conforme a Lei 14.063/2020 e o Marco Civil da Internet.
                    </Label>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowSignForm(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSign} 
                      disabled={signing || !signatureName || !signatureCpf || !acceptedTerms}
                      className="gap-2"
                    >
                      {signing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Assinando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Confirmar Assinatura
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8">
          <p>Este contrato foi gerado e enviado de forma segura.</p>
          <p className="flex items-center justify-center gap-2 mt-2">
            <Shield className="h-4 w-4" />
            Documento protegido com rastreamento de visualização
          </p>
        </div>
      </div>
    </div>
  );
}
