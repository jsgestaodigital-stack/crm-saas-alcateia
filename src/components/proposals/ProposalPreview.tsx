import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Proposal, PROPOSAL_STATUS_CONFIG } from '@/types/proposal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProposalPreviewProps {
  proposal: Proposal;
  isPublic?: boolean;
}

export function ProposalPreview({ proposal, isPublic = false }: ProposalPreviewProps) {
  const statusConfig = PROPOSAL_STATUS_CONFIG[proposal.status];

  // Replace variables in content
  const replaceVariables = (content: string) => {
    let result = content;
    Object.entries(proposal.variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return result;
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
              <p className="text-muted-foreground mt-1">
                Para: {proposal.company_name || proposal.client_name}
              </p>
            </div>
            {!isPublic && (
              <Badge className={cn("text-sm", statusConfig.color)}>
                {statusConfig.emoji} {statusConfig.label}
              </Badge>
            )}
          </div>
          
          {proposal.valid_until && (
            <p className="text-sm text-muted-foreground mt-4">
              Válida até: {format(new Date(proposal.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      </Card>

      {/* Blocks */}
      <div className="space-y-6">
        {proposal.blocks.map((block) => (
          <Card key={block.id} className="p-6">
            <h2 className="text-xl font-semibold mb-4">{block.title}</h2>
            
            {block.content && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{replaceVariables(block.content)}</p>
              </div>
            )}
            
            {block.type === 'scope' && block.checklist && block.checklist.length > 0 && (
              <div className="space-y-3 mt-4">
                {block.checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Checkbox checked disabled className="data-[state=checked]:bg-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            )}
            
            {block.type === 'investment' && (proposal.full_price || proposal.discounted_price) && (
              <div className="space-y-4 mt-4">
                {proposal.full_price && proposal.discounted_price && proposal.full_price !== proposal.discounted_price && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground line-through">
                      {formatCurrency(proposal.full_price)}
                    </span>
                    {proposal.discount_reason && (
                      <Badge variant="secondary" className="text-xs">
                        {proposal.discount_reason}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(proposal.discounted_price || proposal.full_price)}
                </div>
                
                {proposal.installments && proposal.installment_value && (
                  <p className="text-muted-foreground">
                    ou {proposal.installments}x de {formatCurrency(proposal.installment_value)}
                  </p>
                )}
                
                {proposal.payment_method && (
                  <p className="text-sm text-muted-foreground">
                    Formas de pagamento: {proposal.payment_method}
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Footer */}
      <Card className="mt-6 p-6 text-center">
        <p className="text-muted-foreground">
          Proposta gerada em {format(new Date(proposal.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </p>
        {proposal.view_count > 0 && !isPublic && (
          <p className="text-xs text-muted-foreground mt-2">
            Visualizada {proposal.view_count} vez{proposal.view_count > 1 ? 'es' : ''}
            {proposal.last_viewed_at && (
              <> • Última visualização: {format(new Date(proposal.last_viewed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</>
            )}
          </p>
        )}
      </Card>
    </div>
  );
}
