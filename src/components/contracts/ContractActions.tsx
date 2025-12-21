import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Contract, CONTRACT_STATUS_CONFIG } from '@/types/contract';
import { 
  Download, 
  Copy, 
  Eye, 
  MoreVertical,
  FileText,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ContractActionsProps {
  contract: Contract;
  onPreview: () => void;
  onRefresh: () => void;
}

export function ContractActions({ contract, onPreview, onRefresh }: ContractActionsProps) {
  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status];

  const generatePdfContent = (): string => {
    const variables = contract.variables || {};
    const clauses = contract.clauses || [];

    const varValues: Record<string, string> = {
      ...variables,
      agencia_nome: contract.contractor_name || '',
      agencia_cnpj: contract.contractor_cnpj || '',
      agencia_endereco: contract.contractor_address || '',
      agencia_responsavel: contract.contractor_responsible || '',
      nome_empresa: contract.contracted_name || '',
      cnpj: contract.contracted_cnpj || '',
      cpf: contract.contracted_cpf || '',
      email: contract.contracted_email || '',
      endereco: contract.contracted_address || '',
      responsavel: contract.contracted_responsible || '',
      telefone: contract.contracted_phone || '',
      valor: contract.full_price ? `R$ ${contract.full_price.toLocaleString('pt-BR')}` : '',
      parcelas: contract.installments?.toString() || '1',
      valor_parcela: contract.installment_value ? `R$ ${contract.installment_value.toLocaleString('pt-BR')}` : '',
      prazo_execucao: contract.execution_term_days?.toString() || '30',
      data: new Date().toLocaleDateString('pt-BR'),
      cidade: variables.cidade || ''
    };

    const replaceVars = (text: string) => {
      let result = text;
      Object.entries(varValues).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        result = result.replace(regex, value || '');
      });
      return result;
    };

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${contract.title}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
    }
    body { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 12pt; 
      line-height: 1.6; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px;
      color: #000;
    }
    h1 { 
      text-align: center; 
      font-size: 16pt; 
      margin-bottom: 30px; 
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    h2 { 
      font-size: 12pt; 
      margin-top: 25px; 
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    p { 
      text-align: justify; 
      margin: 10px 0; 
    }
    ul { 
      margin: 10px 0; 
      padding-left: 25px; 
    }
    li { 
      margin: 5px 0; 
    }
    .signatures { 
      margin-top: 60px; 
      page-break-inside: avoid;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 80px;
    }
    .signature-block { 
      text-align: center; 
      width: 45%; 
    }
    .signature-line { 
      border-top: 1px solid #000; 
      padding-top: 5px; 
      margin-top: 60px;
    }
    strong { font-weight: bold; }
    .header-info {
      text-align: center;
      margin-bottom: 30px;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <h1>${replaceVars(contract.title)}</h1>
`;

    clauses
      .filter((c) => !c.isHidden)
      .sort((a, b) => a.order - b.order)
      .forEach((clause) => {
        let content = replaceVars(clause.content);
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/• (.*?)(?=\n|$)/g, '<li>$1</li>');
        if (content.includes('<li>')) {
          content = content.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        }
        content = content.replace(/\n\n/g, '</p><p>');
        content = content.replace(/\n/g, '<br>');
        
        html += `
  <h2>CLÁUSULA ${clause.order}ª - ${clause.title.toUpperCase()}</h2>
  <p>${content}</p>
`;
      });

    html += `
  <div class="signatures">
    <p style="text-align: center; margin-top: 40px;">
      E por estarem assim justas e contratadas, as partes assinam o presente contrato em duas vias de igual teor e forma.
    </p>
    <div class="signature-row">
      <div class="signature-block">
        <div class="signature-line">
          <strong>CONTRATANTE</strong><br>
          ${contract.contracted_name || ''}<br>
          ${contract.contracted_cnpj ? `CNPJ: ${contract.contracted_cnpj}` : ''}
        </div>
      </div>
      <div class="signature-block">
        <div class="signature-line">
          <strong>CONTRATADA</strong><br>
          ${contract.contractor_name || ''}<br>
          ${contract.contractor_cnpj ? `CNPJ: ${contract.contractor_cnpj}` : ''}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return html;
  };

  const handleDownloadPdf = () => {
    const html = generatePdfContent();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    toast.success('Contrato aberto para impressão/download');
  };

  const handlePrint = () => {
    const html = generatePdfContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleCopyText = () => {
    const clauses = contract.clauses || [];
    let text = `${contract.title}\n\n`;
    
    clauses
      .filter((c) => !c.isHidden)
      .sort((a, b) => a.order - b.order)
      .forEach((clause) => {
        text += `CLÁUSULA ${clause.order}ª - ${clause.title}\n`;
        text += `${clause.content}\n\n`;
      });

    navigator.clipboard.writeText(text);
    toast.success('Contrato copiado para a área de transferência');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <Badge className={statusConfig.color}>
        {statusConfig.emoji} {statusConfig.label}
      </Badge>

      {/* Main Actions */}
      <Button variant="outline" size="sm" onClick={onPreview}>
        <Eye className="h-4 w-4 mr-2" />
        Visualizar
      </Button>

      <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
        <Download className="h-4 w-4 mr-2" />
        Baixar PDF
      </Button>

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyText}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Texto
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onPreview}>
            <FileText className="h-4 w-4 mr-2" />
            Pré-visualização
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
