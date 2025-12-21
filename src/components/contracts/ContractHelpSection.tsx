import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Info, 
  Download, 
  Printer, 
  CheckCircle2, 
  FileText,
  HelpCircle,
  Copy
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ContractHelpSectionProps {
  showCompact?: boolean;
}

export function ContractHelpSection({ showCompact = false }: ContractHelpSectionProps) {
  if (showCompact) {
    return (
      <Alert className="bg-primary/5 border-primary/20 mb-4">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Gere contratos 100% jurídicos prontos para imprimir, baixar em PDF ou copiar o texto.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-primary" />
          Como usar o Sistema de Contratos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Features */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Sistema de Contratos Completo</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Gere contratos profissionais com todas as cláusulas necessárias, 
                  prontos para uso imediato.
                </p>
                <ul className="text-sm mt-3 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Preenchimento assistido por wizard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Variáveis substituídas automaticamente
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Cláusulas jurídicas completas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Baixar PDF, imprimir ou copiar
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="download">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Como baixar meu contrato em PDF?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1">
                <li>Crie ou edite um contrato</li>
                <li>Preencha todos os dados necessários</li>
                <li>Clique em "Baixar PDF"</li>
                <li>Na janela de impressão, selecione "Salvar como PDF"</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="print">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Posso imprimir e assinar manualmente?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Sim! O contrato gerado é 100% válido juridicamente. 
              Basta imprimir, coletar as assinaturas físicas de ambas as partes e arquivar.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="copy">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Posso copiar o texto do contrato?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Sim! Use o botão "Copiar Texto" para copiar todo o conteúdo do contrato 
              para a área de transferência. Você pode colar em qualquer editor de texto 
              ou sistema que preferir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="status">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                O que significam os status do contrato?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li><strong>📝 Rascunho</strong> - Contrato sendo editado</li>
                <li><strong>✅ Assinado</strong> - Contrato finalizado</li>
                <li><strong>❌ Cancelado</strong> - Contrato cancelado</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Dica importante</AlertTitle>
          <AlertDescription className="text-sm">
            Certifique-se de preencher todos os campos obrigatórios (nome, e-mail, CNPJ/CPF) 
            antes de gerar o contrato. Dados incompletos podem invalidar o documento.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
