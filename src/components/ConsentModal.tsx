import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Lock } from 'lucide-react';
import { useUserConsent } from '@/hooks/useUserConsent';
import { toast } from 'sonner';

interface ConsentModalProps {
  open: boolean;
  onAccepted: () => void;
}

export function ConsentModal({ open, onAccepted }: ConsentModalProps) {
  const [accepted, setAccepted] = useState(false);
  const { acceptConsent, isAccepting, currentPolicyVersion } = useUserConsent();

  const handleAccept = async () => {
    try {
      await acceptConsent();
      toast.success('Termos aceitos com sucesso!');
      onAccepted();
    } catch (error) {
      console.error('Error accepting consent:', error);
      toast.error('Erro ao aceitar termos. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-primary" />
            Política de Privacidade e Termos de Uso
          </DialogTitle>
          <DialogDescription>
            Versão {currentPolicyVersion} • Última atualização: Dezembro 2024
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                1. Coleta de Dados
              </h3>
              <p className="text-muted-foreground">
                Coletamos dados pessoais necessários para o funcionamento da plataforma, incluindo:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>Nome completo e e-mail para identificação</li>
                <li>Dados da agência para gestão multi-tenant</li>
                <li>Informações de leads e clientes cadastrados por você</li>
                <li>Logs de acesso para segurança e auditoria</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4" />
                2. Uso dos Dados
              </h3>
              <p className="text-muted-foreground">
                Seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>Fornecer os serviços contratados</li>
                <li>Melhorar a experiência do usuário</li>
                <li>Garantir a segurança da plataforma</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Compartilhamento</h3>
              <p className="text-muted-foreground">
                Não compartilhamos seus dados com terceiros, exceto quando necessário para:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>Processar pagamentos (quando aplicável)</li>
                <li>Cumprir determinações legais</li>
                <li>Proteger direitos e segurança dos usuários</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Seus Direitos (LGPD)</h3>
              <p className="text-muted-foreground">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão dos seus dados</li>
                <li>Revogar seu consentimento a qualquer momento</li>
                <li>Solicitar portabilidade dos dados</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Segurança</h3>
              <p className="text-muted-foreground">
                Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                <li>Criptografia de dados sensíveis</li>
                <li>Controle de acesso baseado em funções</li>
                <li>Monitoramento de atividades suspeitas</li>
                <li>Backups regulares</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Retenção de Dados</h3>
              <p className="text-muted-foreground">
                Mantemos seus dados pelo tempo necessário para fornecer os serviços e cumprir 
                obrigações legais. Após o encerramento da conta, os dados serão excluídos 
                conforme nossa política de retenção.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Contato</h3>
              <p className="text-muted-foreground">
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em 
                contato através do e-mail: privacidade@rankeia.com
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-3 py-4">
          <Checkbox
            id="accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <label htmlFor="accept" className="text-sm leading-5 cursor-pointer">
            Li e aceito a Política de Privacidade e os Termos de Uso. Entendo que meus dados 
            serão tratados conforme descrito acima e de acordo com a LGPD.
          </label>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!accepted || isAccepting}
            className="w-full sm:w-auto"
          >
            {isAccepting ? 'Processando...' : 'Aceitar e Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
