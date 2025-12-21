import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Send,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProposalBlock {
  id: string;
  type: string;
  title: string;
  content: string;
  checklist?: string[];
  order: number;
}

interface PublicProposal {
  id: string;
  title: string;
  client_name: string;
  company_name: string;
  blocks: ProposalBlock[];
  full_price: number | null;
  discounted_price: number | null;
  installments: number | null;
  installment_value: number | null;
  payment_method: string | null;
  discount_reason: string | null;
  valid_until: string | null;
  status: string;
}

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProposal = async () => {
      if (!token) {
        setError('Token inválido');
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('record_proposal_view', {
          _token: token,
          _ip: null,
          _user_agent: navigator.userAgent,
          _referrer: document.referrer || null
        });

        if (rpcError) throw rpcError;

        const result = data as { success?: boolean; proposal?: PublicProposal; error?: string } | null;

        if (result?.success && result?.proposal) {
          setProposal(result.proposal);
        } else if (result?.error) {
          setError(result.error === 'Proposal expired' ? 'Esta proposta expirou' : 'Proposta não encontrada');
        } else {
          setError('Proposta não encontrada');
        }
      } catch (err: any) {
        console.error('Error loading proposal:', err);
        setError('Erro ao carregar proposta');
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [token]);

  const handleAccept = async () => {
    if (!proposal) return;
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (error) throw error;
      
      setProposal(prev => prev ? { ...prev, status: 'accepted' } : null);
      toast.success('Proposta aceita com sucesso!');
    } catch (err: any) {
      console.error('Error accepting proposal:', err);
      toast.error('Erro ao aceitar proposta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: feedback || null
        })
        .eq('id', proposal.id);

      if (error) throw error;
      
      setProposal(prev => prev ? { ...prev, status: 'rejected' } : null);
      toast.success('Feedback enviado');
    } catch (err: any) {
      console.error('Error rejecting proposal:', err);
      toast.error('Erro ao enviar feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const replaceVariables = (content: string) => {
    if (!proposal) return content;
    return content
      .replace(/{{nome_empresa}}/g, proposal.company_name || proposal.client_name)
      .replace(/{{nome_cliente}}/g, proposal.client_name)
      .replace(/{{cidade}}/g, '')
      .replace(/{{palavras_chave}}/g, '');
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-bold mb-2">Proposta Indisponível</h1>
          <p className="text-muted-foreground">{error || 'Proposta não encontrada'}</p>
        </Card>
      </div>
    );
  }

  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date();
  const isDecided = proposal.status === 'accepted' || proposal.status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{proposal.title}</h1>
              <p className="text-sm text-muted-foreground">
                Para: {proposal.company_name || proposal.client_name}
              </p>
            </div>
          </div>
          
          {proposal.status === 'accepted' && (
            <Badge className="bg-green-500/20 text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Aceita
            </Badge>
          )}
          {proposal.status === 'rejected' && (
            <Badge className="bg-red-500/20 text-red-400">
              <XCircle className="h-3 w-3 mr-1" />
              Rejeitada
            </Badge>
          )}
          {isExpired && proposal.status !== 'accepted' && (
            <Badge className="bg-orange-500/20 text-orange-400">
              <Clock className="h-3 w-3 mr-1" />
              Expirada
            </Badge>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Validity */}
        {proposal.valid_until && !isDecided && (
          <div className={cn(
            "p-4 rounded-lg text-center",
            isExpired ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            <Clock className="h-4 w-4 inline-block mr-2" />
            {isExpired ? 'Esta proposta expirou em ' : 'Válida até '}
            {format(new Date(proposal.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        )}

        {/* Blocks */}
        {proposal.blocks.sort((a, b) => a.order - b.order).map((block) => (
          <Card key={block.id} className="overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{block.title}</h2>
              
              {block.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground/90">
                    {replaceVariables(block.content)}
                  </p>
                </div>
              )}
              
              {block.type === 'scope' && block.checklist && block.checklist.length > 0 && (
                <div className="space-y-3 mt-4">
                  {block.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox checked disabled className="data-[state=checked]:bg-primary" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {block.type === 'investment' && (
                <div className="space-y-4 mt-4">
                  {proposal.full_price && proposal.discounted_price && proposal.full_price !== proposal.discounted_price && (
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground line-through text-lg">
                        {formatCurrency(proposal.full_price)}
                      </span>
                      {proposal.discount_reason && (
                        <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                          {proposal.discount_reason}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="text-4xl font-bold text-primary">
                    {formatCurrency(proposal.discounted_price || proposal.full_price)}
                  </div>
                  
                  {proposal.installments && proposal.installment_value && (
                    <p className="text-muted-foreground">
                      ou <span className="font-semibold">{proposal.installments}x</span> de{' '}
                      <span className="font-semibold">{formatCurrency(proposal.installment_value)}</span>
                    </p>
                  )}
                  
                  {proposal.payment_method && (
                    <p className="text-sm text-muted-foreground">
                      Formas de pagamento: {proposal.payment_method}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}

        {/* Actions */}
        {!isDecided && !isExpired && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">O que você achou?</h3>
            
            <div className="space-y-4">
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Deixe um comentário ou dúvida (opcional)..."
                className="min-h-[80px]"
              />
              
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleAccept}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aceitar Proposta
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={submitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Feedback
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Accepted Message */}
        {proposal.status === 'accepted' && (
          <Card className="p-8 text-center bg-green-500/10 border-green-500/30">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Proposta Aceita!</h3>
            <p className="text-muted-foreground">
              Obrigado por aceitar nossa proposta. Entraremos em contato em breve para os próximos passos.
            </p>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>Proposta gerada pelo sistema G-Rank</p>
      </footer>
    </div>
  );
}
