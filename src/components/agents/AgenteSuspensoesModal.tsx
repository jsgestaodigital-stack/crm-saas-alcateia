import { useState } from 'react';
import { 
  AlertOctagon, 
  FileText, 
  Play, 
  Loader2,
  Building2,
  CheckCircle2,
  Sparkles,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgenteSuspensoesModalProps {
  trigger?: React.ReactNode;
}

export function AgenteSuspensoesModal({ trigger }: AgenteSuspensoesModalProps) {
  const { clients } = useClientStore();
  const { derived } = useAuth();
  
  const canAccessOps = derived?.canOpsOrAdmin ?? false;
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [inputData, setInputData] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Clientes suspensos ou com problemas
  const relevantClients = clients.filter(c => 
    ['suspended', 'onboarding', 'optimization'].includes(c.columnId)
  );
  const selectedClient = relevantClients.find(c => c.id === selectedClientId);

  const handleAnalyze = async () => {
    if (!inputData.trim()) {
      toast.error('Insira os dados da suspensão para análise');
      return;
    }

    if (!selectedClientId) {
      toast.error('Selecione um cliente para vincular a análise');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-suspensao', {
        body: { 
          inputData,
          clientName: selectedClient?.companyName || ''
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar análise');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data?.analysis || '');
      toast.success('Análise de suspensão concluída!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao analisar');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Resultado copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetState = () => {
    setSelectedClientId('');
    setInputData('');
    setResult(null);
  };

  if (!canAccessOps) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-red-500/30 hover:bg-red-500/10">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Suspensões</span>
            <Sparkles className="w-3 h-3 text-red-400" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertOctagon className="w-5 h-5 text-red-400" />
            </div>
            Agente de Recuperação
            <Badge variant="outline" className="ml-2 text-[10px] border-red-500/30 text-red-400">
              GRank AI
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Left: Input */}
          <div className="space-y-4">
            {/* Client Selection */}
            <div>
              <Label className="text-xs text-muted-foreground">Cliente (obrigatório) *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {relevantClients.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum cliente disponível</SelectItem>
                  ) : (
                    relevantClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                        {client.columnId === 'suspended' && ' (Suspenso)'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Input Data */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> Dados da Suspensão *
              </Label>
              <Textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Cole aqui o motivo da suspensão, mensagem do Google, dados do perfil, histórico de ações anteriores..."
                className="mt-1 min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {inputData.length} caracteres
              </p>
            </div>

            {/* Actions */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputData.trim() || !selectedClientId}
              className="w-full gap-2 bg-red-600 hover:bg-red-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Analisar Suspensão
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Resultado</Label>
              {result && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              )}
            </div>

            <Card className="border-border/30 bg-surface-1/30 h-[400px]">
              <CardContent className="p-0 h-full">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                      <AlertOctagon className="w-5 h-5 text-red-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Analisando suspensão...
                    </p>
                  </div>
                ) : result ? (
                  <ScrollArea className="h-full p-4">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {result}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <AlertOctagon className="w-10 h-10 opacity-30" />
                    <p className="text-sm">
                      Selecione um cliente e insira os dados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
