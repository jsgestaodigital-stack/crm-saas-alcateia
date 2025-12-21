import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Proposal, ProposalBlock, PROPOSAL_STATUS_CONFIG, BLOCK_TYPE_CONFIG } from '@/types/proposal';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Calendar,
  Building2,
  FileText,
  Loader2,
  Check,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (token) {
      loadProposal();
    }
  }, [token]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      
      // Fetch proposal by token
      const { data, error: fetchError } = await supabase
        .from('proposals')
        .select('*')
        .eq('public_token', token)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Proposta não encontrada');

      // Parse JSON fields
      const proposalData: Proposal = {
        ...data,
        blocks: (data.blocks as unknown as ProposalBlock[]) || [],
        variables: (data.variables as Record<string, string>) || {},
      };

      setProposal(proposalData);

      // Record view (only once)
      if (!viewRecorded.current) {
        viewRecorded.current = true;
        await supabase.rpc('record_proposal_view', { _token: token });
      }
    } catch (err) {
      console.error('Error loading proposal:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!proposal) return;
    setAccepting(true);
    try {
      await supabase
        .from('proposals')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);

      setProposal({ ...proposal, status: 'accepted', accepted_at: new Date().toISOString() });
    } catch (err) {
      console.error('Error accepting proposal:', err);
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;
    setRejecting(true);
    try {
      await supabase
        .from('proposals')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq('id', proposal.id);

      setProposal({ 
        ...proposal, 
        status: 'rejected', 
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      });
      setShowRejectionForm(false);
    } catch (err) {
      console.error('Error rejecting proposal:', err);
    } finally {
      setRejecting(false);
    }
  };

  const replaceVariables = (content: string): string => {
    if (!proposal?.variables) return content;
    let result = content;
    Object.entries(proposal.variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return result;
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">Proposta não encontrada</h1>
            <p className="text-muted-foreground">
              {error || 'O link da proposta pode ter expirado ou não existe.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date();
  const canRespond = proposal.status === 'sent' || proposal.status === 'viewed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold">Proposta Comercial</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              PROPOSAL_STATUS_CONFIG[proposal.status]?.color,
              "text-sm"
            )}
          >
            {PROPOSAL_STATUS_CONFIG[proposal.status]?.emoji} {PROPOSAL_STATUS_CONFIG[proposal.status]?.label}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {proposal.title}
          </h1>
          {proposal.company_name && (
            <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
              <Building2 className="h-5 w-5" />
              {proposal.company_name}
            </p>
          )}
          {proposal.valid_until && (
            <p className={cn(
              "text-sm flex items-center justify-center gap-2",
              isExpired ? "text-destructive" : "text-muted-foreground"
            )}>
              <Calendar className="h-4 w-4" />
              {isExpired ? 'Proposta expirada em' : 'Válida até'} {formatDate(proposal.valid_until)}
            </p>
          )}
        </div>

        {/* Blocks */}
        <div className="space-y-6">
          {proposal.blocks
            .sort((a, b) => a.order - b.order)
            .map((block) => (
              <Card key={block.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {BLOCK_TYPE_CONFIG[block.type]?.emoji} {block.title}
                  </h2>

                  {/* Text content */}
                  {block.content && (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {replaceVariables(block.content).split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line}</p>
                      ))}
                    </div>
                  )}

                  {/* Checklist for scope */}
                  {block.type === 'scope' && block.checklist && block.checklist.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {block.checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Investment block */}
                  {block.type === 'investment' && (
                    <div className="mt-4 p-6 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="space-y-4">
                        {proposal.full_price && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Valor original:</span>
                            <span className={cn(
                              "text-lg",
                              proposal.discounted_price && "line-through text-muted-foreground/60"
                            )}>
                              {formatCurrency(proposal.full_price)}
                            </span>
                          </div>
                        )}
                        {proposal.discounted_price && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-primary">Valor com desconto:</span>
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(proposal.discounted_price)}
                              </span>
                            </div>
                            {proposal.discount_reason && (
                              <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded">
                                💡 {proposal.discount_reason}
                              </p>
                            )}
                          </>
                        )}
                        {proposal.installments && proposal.installment_value && (
                          <div className="pt-2 border-t border-border/30">
                            <p className="text-center text-muted-foreground">
                              ou <span className="font-semibold text-foreground">{proposal.installments}x</span> de{' '}
                              <span className="font-semibold text-foreground">
                                {formatCurrency(proposal.installment_value)}
                              </span>
                            </p>
                          </div>
                        )}
                        {proposal.payment_method && (
                          <p className="text-sm text-center text-muted-foreground">
                            Forma de pagamento: {proposal.payment_method}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Action Buttons */}
        {canRespond && !isExpired && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-center">O que você acha da proposta?</h3>
              
              {!showRejectionForm ? (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={handleAccept}
                    disabled={accepting || rejecting}
                    className="gap-2"
                  >
                    {accepting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    Aceitar Proposta
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowRejectionForm(true)}
                    disabled={accepting || rejecting}
                    className="gap-2"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Tenho dúvidas / Recusar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Conte-nos o motivo ou suas dúvidas (opcional)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={rejecting}
                      className="gap-2"
                    >
                      {rejecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Confirmar Recusa
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowRejectionForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {proposal.status === 'accepted' && (
          <Card className="border-green-500/30 bg-green-500/10">
            <CardContent className="p-6 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-green-600">Proposta Aceita!</h3>
              <p className="text-muted-foreground">
                Obrigado pela confiança. Entraremos em contato em breve para os próximos passos.
              </p>
            </CardContent>
          </Card>
        )}

        {proposal.status === 'rejected' && (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="p-6 text-center space-y-2">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold text-destructive">Proposta Recusada</h3>
              {proposal.rejection_reason && (
                <p className="text-muted-foreground">
                  Motivo: {proposal.rejection_reason}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {isExpired && proposal.status !== 'accepted' && proposal.status !== 'rejected' && (
          <Card className="border-orange-500/30 bg-orange-500/10">
            <CardContent className="p-6 text-center space-y-2">
              <Clock className="h-12 w-12 text-orange-500 mx-auto" />
              <h3 className="text-lg font-semibold text-orange-600">Proposta Expirada</h3>
              <p className="text-muted-foreground">
                Esta proposta não está mais válida. Entre em contato para uma nova proposta.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-border/30 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Proposta gerada em {formatDate(proposal.created_at)}</p>
          <p className="mt-1 flex items-center justify-center gap-2">
            <Eye className="h-4 w-4" />
            {proposal.view_count} visualização(ões)
          </p>
        </div>
      </footer>
    </div>
  );
}
