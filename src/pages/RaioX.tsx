import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  FileText, 
  Play, 
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RaioX() {
  const { leads } = useLeads();
  const { user, isLoading: authLoading, derived } = useAuth();
  const navigate = useNavigate();
  
  const canAccessSales = derived?.canSalesOrAdmin ?? false;
  
  // Redirect if no permission
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!authLoading && user && !canAccessSales) {
      toast.error("Acesso negado - apenas vendas/admin");
      navigate("/dashboard");
    }
  }, [user, authLoading, canAccessSales, navigate]);
  
  // Block render if no access
  if (!canAccessSales) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-status-danger mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">Apenas usuários com permissão de Vendas podem acessar esta página</p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [transcription, setTranscription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Apenas leads ativos (open/future)
  const activeLeads = leads.filter(l => l.status === 'open' || l.status === 'future');
  const selectedLead = activeLeads.find(l => l.id === selectedLeadId);

  const handleAnalyze = async () => {
    if (!transcription.trim()) {
      toast.error('Cole a transcrição da reunião para análise');
      return;
    }

    if (!selectedLeadId) {
      toast.error('Selecione um lead para vincular a análise');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Chamar edge function com o prompt completo
      const { data, error } = await supabase.functions.invoke('analyze-raiox', {
        body: { 
          transcription,
          leadName: selectedLead?.company_name || ''
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao processar análise');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const analysisContent = data?.analysis;
      if (!analysisContent) {
        throw new Error('Resposta vazia da análise');
      }

      setResult(analysisContent);

      // Salvar no banco de dados
      if (user) {
        const { error: insertError } = await supabase.from('raiox_analyses').insert({
          lead_id: selectedLeadId,
          client_id: null,
          call_link: null,
          transcription,
          summary: analysisContent,
          objections: null,
          closing_angle: null,
          next_step: null,
          suggested_script: null,
          what_to_avoid: null,
          created_by: user.id
        });

        if (insertError) {
          console.error('Error saving analysis:', insertError);
          toast.error('Análise concluída, mas houve erro ao salvar');
        } else {
          toast.success('Análise concluída e salva!');
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao analisar. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearForm = () => {
    setSelectedLeadId('');
    setTranscription('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard")} 
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Raio-X do Fechamento</h1>
              <p className="text-sm text-muted-foreground">
                Cole a transcrição da call de vendas e receba uma análise estratégica completa
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Dados da Análise
                </CardTitle>
                <CardDescription>
                  Selecione o lead e cole a transcrição da reunião
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lead Selection - Obrigatório */}
                <div>
                  <Label className="text-xs text-muted-foreground">Lead (obrigatório) *</Label>
                  <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o lead..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLeads.length === 0 ? (
                        <SelectItem value="none" disabled>Nenhum lead ativo</SelectItem>
                      ) : (
                        activeLeads.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.company_name}
                            {lead.contact_name && ` - ${lead.contact_name}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    A análise será vinculada a este lead
                  </p>
                </div>

                {/* Transcription */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Transcrição da Call de Vendas *
                  </Label>
                  <Textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    placeholder="Cole aqui a transcrição completa da reunião ou call de vendas..."
                    className="mt-1 min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {transcription.length} caracteres
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !transcription.trim() || !selectedLeadId}
                    className="flex-1 gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Analisar Reunião
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={clearForm}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {!result && !isAnalyzing && (
              <Card className="glass-card h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center p-8">
                  <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto mb-4">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Pronto para analisar
                  </h3>
                  <p className="text-sm text-muted-foreground/70 max-w-xs">
                    Selecione um lead, cole a transcrição da call de vendas e clique em "Analisar Reunião" para receber insights estratégicos completos
                  </p>
                </div>
              </Card>
            )}

            {isAnalyzing && (
              <Card className="glass-card h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center p-8">
                  <div className="relative">
                    <div className="p-4 rounded-full bg-purple-500/20 w-fit mx-auto mb-4 animate-pulse">
                      <Zap className="h-8 w-8 text-purple-400" />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-purple-500" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Analisando reunião...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A IA está processando a transcrição e gerando insights estratégicos
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Isso pode levar alguns segundos
                  </p>
                </div>
              </Card>
            )}

            {result && (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Análise Completa
                  </CardTitle>
                  {selectedLead && (
                    <CardDescription>
                      Lead: {selectedLead.company_name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                        {result}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
