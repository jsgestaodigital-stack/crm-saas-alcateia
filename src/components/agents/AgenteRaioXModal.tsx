import { useState } from 'react';
import { 
  Zap, 
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
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgenteRaioXModalProps {
  trigger?: React.ReactNode;
}

export function AgenteRaioXModal({ trigger }: AgenteRaioXModalProps) {
  const { leads } = useLeads();
  const { user, derived } = useAuth();
  
  const canAccessSales = derived?.canSalesOrAdmin ?? false;
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [transcription, setTranscription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('analyze-raiox', {
        body: { 
          transcription,
          leadName: selectedLead?.company_name || ''
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar análise');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const analysisContent = data?.analysis || '';
      setResult(analysisContent);

      // Salvar no banco de dados
      if (user) {
        await supabase.from('raiox_analyses').insert({
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
      }

      toast.success('Análise concluída!');
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
    setSelectedLeadId('');
    setTranscription('');
    setResult(null);
  };

  if (!canAccessSales) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-purple-500/30 hover:bg-purple-500/10">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Raio-X</span>
            <Sparkles className="w-3 h-3 text-purple-400" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            Raio-X do Fechamento
            <Badge variant="outline" className="ml-2 text-[10px] border-purple-500/30 text-purple-400">
              Vendas
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Left: Input */}
          <div className="space-y-4">
            {/* Lead Selection */}
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
            </div>

            {/* Transcription */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> Transcrição da Call *
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
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !transcription.trim() || !selectedLeadId}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
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
                      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <Zap className="w-5 h-5 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Analisando reunião...
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
                    <Zap className="w-10 h-10 opacity-30" />
                    <p className="text-sm">
                      Selecione um lead e insira a transcrição
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
