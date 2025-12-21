import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Download, 
  Printer, 
  Send, 
  CheckCircle2, 
  FileText,
  Settings,
  HelpCircle
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
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Modo Manual:</strong> Você pode usar o sistema sem Autentique. 
          Geramos contratos 100% jurídicos prontos para imprimir ou baixar em PDF.
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
        {/* Two Modes Explanation */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    🟢 Modo Manual
                    <Badge variant="secondary" className="text-xs">Padrão</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gere contratos completos sem integração externa. 
                    Baixe em PDF, imprima ou copie o texto.
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Sem necessidade de API
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      100% funcional
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Pronto para assinar
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    🔵 Assinatura Digital
                    <Badge variant="outline" className="text-xs">Opcional</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Integre com a Autentique para enviar contratos 
                    e rastrear assinaturas digitais.
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <Settings className="h-3 w-3 text-muted-foreground" />
                      Requer configuração
                    </li>
                    <li className="flex items-center gap-2">
                      <Send className="h-3 w-3 text-muted-foreground" />
                      Envio automático
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                      Rastreio de status
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="manual">
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
                <li>Clique em "Baixar PDF" ou "Imprimir"</li>
                <li>O navegador abrirá a janela de impressão onde você pode salvar como PDF</li>
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
              Basta imprimir, coletar assinaturas físicas e arquivar. 
              Você não precisa usar a Autentique se preferir o modo tradicional.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="autentique">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Como configurar a Autentique?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1">
                <li>Acesse <a href="https://app.autentique.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">app.autentique.com.br</a></li>
                <li>Vá em "Minha Conta" → "Integrações"</li>
                <li>Gere um token de API</li>
                <li>Configure o token nas configurações da agência</li>
              </ol>
              <p className="mt-2 text-xs">
                Após configurar, o botão "Enviar para Assinatura" ficará disponível.
              </p>
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
                <li><Badge className="bg-slate-500">📝 Rascunho</Badge> - Contrato sendo editado</li>
                <li><Badge className="bg-blue-500">📤 Enviado</Badge> - Aguardando visualização</li>
                <li><Badge className="bg-amber-500">👁️ Visualizado</Badge> - Cliente abriu o contrato</li>
                <li><Badge className="bg-green-500">✅ Assinado</Badge> - Contrato finalizado</li>
                <li><Badge className="bg-red-500">❌ Cancelado</Badge> - Contrato cancelado</li>
                <li><Badge className="bg-gray-500">⏰ Expirado</Badge> - Prazo encerrado</li>
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
            antes de gerar ou enviar o contrato. Dados incompletos podem invalidar o documento.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
