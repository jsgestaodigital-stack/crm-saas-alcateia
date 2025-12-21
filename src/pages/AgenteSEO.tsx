import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
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
import { useClientStore } from '@/stores/clientStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AgenteSEO() {
  const { clients } = useClientStore();
  const { user, isLoading: authLoading, derived } = useAuth();
  const navigate = useNavigate();
  
  const canAccessOps = derived?.canOpsOrAdmin ?? false;
  
  // Redirect if no permission
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!authLoading && user && !canAccessOps) {
      toast.error("Acesso negado - apenas operacional/admin");
      navigate("/dashboard");
    }
  }, [user, authLoading, canAccessOps, navigate]);
  
  // Block render if no access
  if (!canAccessOps) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-status-danger mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">Apenas usuários com permissão Operacional podem acessar esta página</p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [inputData, setInputData] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Clientes ativos no funil operacional
  const activeClients = clients.filter(c => 
    ['onboarding', 'optimization', 'ready_to_deliver'].includes(c.columnId)
  );
  const selectedClient = activeClients.find(c => c.id === selectedClientId);

  const handleAnalyze = async () => {
    if (!inputData.trim()) {
      toast.error('Insira os dados para análise');
      return;
    }

    if (!selectedClientId) {
      toast.error('Selecione um cliente para vincular a análise');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-seo', {
        body: { 
          inputData,
          clientName: selectedClient?.companyName || ''
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
      toast.success('Análise SEO concluída!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao analisar. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearForm = () => {
    setSelectedClientId('');
    setInputData('');
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
              <Search className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agente SEO Local</h1>
              <p className="text-sm text-muted-foreground">
                Otimização Local Inteligente – GRank CRM
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
                  Selecione o cliente e insira os dados para análise SEO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Selection */}
                <div>
                  <Label className="text-xs text-muted-foreground">Cliente (obrigatório) *</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeClients.length === 0 ? (
                        <SelectItem value="none" disabled>Nenhum cliente ativo</SelectItem>
                      ) : (
                        activeClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.companyName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Input Data */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Dados para Análise *
                  </Label>
                  <Textarea
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="Cole aqui os dados do perfil do Google, palavras-chave, dados de competidores, etc..."
                    className="mt-1 min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {inputData.length} caracteres
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !inputData.trim() || !selectedClientId}
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-500"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Analisar SEO
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
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Pronto para analisar
                  </h3>
                  <p className="text-sm text-muted-foreground/70 max-w-xs">
                    Selecione um cliente e insira os dados para receber uma análise SEO completa
                  </p>
                </div>
              </Card>
            )}

            {isAnalyzing && (
              <Card className="glass-card h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center p-8">
                  <div className="relative">
                    <div className="p-4 rounded-full bg-blue-500/20 w-fit mx-auto mb-4 animate-pulse">
                      <Search className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Analisando SEO...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A IA está processando os dados e gerando recomendações
                  </p>
                </div>
              </Card>
            )}

            {result && (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Análise SEO Completa
                  </CardTitle>
                  {selectedClient && (
                    <CardDescription>
                      Cliente: {selectedClient.companyName}
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
