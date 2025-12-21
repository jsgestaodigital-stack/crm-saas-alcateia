import React from 'react';
import DOMPurify from 'dompurify';
import { Contract, CONTRACT_VARIABLES } from '@/types/contract';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface ContractPreviewProps {
  contract: Contract;
  isPublic?: boolean;
}

export function ContractPreview({ contract, isPublic = false }: ContractPreviewProps) {
  // Replace variables in content
  const replaceVariables = (content: string): string => {
    let result = content;
    
    // Date
    result = result.replace(/\{\{data\}\}/g, format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }));
    
    // Contract data
    const replacements: Record<string, string | undefined> = {
      '{{nome_empresa}}': contract.contracted_name,
      '{{cnpj}}': contract.contracted_cnpj,
      '{{cpf}}': contract.contracted_cpf,
      '{{email}}': contract.contracted_email,
      '{{endereco}}': contract.contracted_address,
      '{{responsavel}}': contract.contracted_responsible,
      '{{telefone}}': contract.contracted_phone,
      '{{valor}}': contract.full_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      '{{valor_desconto}}': contract.discounted_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      '{{parcelas}}': contract.installments?.toString(),
      '{{valor_parcela}}': contract.installment_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      '{{prazo_execucao}}': contract.execution_term_days?.toString(),
      '{{cidade}}': contract.variables?.cidade || 'Palhoça/SC',
      '{{agencia_nome}}': contract.contractor_name,
      '{{agencia_cnpj}}': contract.contractor_cnpj,
      '{{agencia_endereco}}': contract.contractor_address,
      '{{agencia_responsavel}}': contract.contractor_responsible,
    };
    
    Object.entries(replacements).forEach(([key, value]) => {
      if (value) {
        result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
    });
    
    // Custom variables
    if (contract.variables) {
      Object.entries(contract.variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      });
    }
    
    return result;
  };

  // Format content with markdown-like styling and sanitization
  const formatContent = (content: string): React.ReactNode => {
    const replaced = replaceVariables(content);
    
    // Split by lines and process
    return replaced.split('\n').map((line, i) => {
      // Bold
      const boldProcessed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Sanitize HTML to prevent XSS
      const sanitized = DOMPurify.sanitize(boldProcessed, {
        ALLOWED_TAGS: ['strong', 'br', 'em', 'b', 'i'],
        ALLOWED_ATTR: []
      });
      
      // Bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sanitized.replace(/^[•-]\s*/, ''), { ALLOWED_TAGS: ['strong', 'br', 'em', 'b', 'i'], ALLOWED_ATTR: [] }) }} />
        );
      }
      
      return (
        <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: sanitized }} />
      );
    });
  };

  const visibleClauses = contract.clauses?.filter(c => !c.isHidden) || [];

  return (
    <div className={`max-w-4xl mx-auto ${!isPublic ? 'p-4' : ''}`}>
      {/* Paper container - always white like a real document */}
      <div 
        className="bg-white text-gray-900 shadow-xl rounded-lg border border-gray-200"
        style={{ minHeight: '29.7cm' }}
      >
        <div className={`${isPublic ? 'p-12' : 'p-8 md:p-12'}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
              {contract.title || 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS'}
            </h1>
            {contract.contract_type === 'recurring' && (
              <p className="text-gray-500 mt-2">Plano de Recorrência Mensal</p>
            )}
          </div>

          {/* Clauses */}
          <div className="space-y-6">
            {visibleClauses.map((clause, index) => (
              <div key={clause.id} className="space-y-2">
                <h2 className="text-lg font-semibold uppercase text-gray-900">
                  {index + 1}. {clause.title}
                </h2>
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {formatContent(clause.content)}
                </div>
              </div>
            ))}
          </div>

          {/* Signature Section */}
          {contract.status === 'signed' && contract.client_signature_name && (
            <div className="mt-12 pt-8 border-t border-gray-300">
              <div className="text-center">
                <p className="text-green-600 font-semibold mb-4">✅ CONTRATO ASSINADO DIGITALMENTE</p>
                <p className="text-sm text-gray-900">
                  Assinado por: <strong>{contract.client_signature_name}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  CPF: {contract.client_signature_cpf}
                </p>
                <p className="text-sm text-gray-500">
                  Data: {contract.client_signed_at && format(new Date(contract.client_signed_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
