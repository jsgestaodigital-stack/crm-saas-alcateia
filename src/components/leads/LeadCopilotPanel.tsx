import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useLeadCopilot, CopilotInteractionType } from '@/hooks/useLeadCopilot';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sparkles,
  FileText,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Send,
  Loader2,
  Clock,
  User,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LeadCopilotPanelProps {
  leadId: string;
}

const INTERACTION_TYPES = {
  summary: { label: 'Resumo', icon: FileText, color: 'text-blue-400' },
  suggestion: { label: 'Sugestão', icon: Lightbulb, color: 'text-amber-400' },
  analysis: { label: 'Análise', icon: BarChart3, color: 'text-purple-400' },
  chat: { label: 'Chat', icon: MessageSquare, color: 'text-green-400' },
};

export function LeadCopilotPanel({ leadId }: LeadCopilotPanelProps) {
  const { derived } = useAuth();
  const canUseAI = derived?.canSalesOrAdmin ?? false;

  const {
    isLoading,
    loadingType,
    error,
    interactions,
    interactionsLoading,
    generateSummary,
    suggestNextAction,
    analyzeQuality,
    chat,
    fetchInteractions,
  } = useLeadCopilot(leadId);

  const [activeTab, setActiveTab] = useState('actions');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [chatMessage, setChatMessage] = useState('');
  const [lastResponse, setLastResponse] = useState<{ type: string; content: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (leadId) {
      fetchInteractions(historyFilter === 'all' ? undefined : historyFilter);
    }
  }, [leadId, historyFilter, fetchInteractions]);

  const handleAction = async (action: () => Promise<any>, type: CopilotInteractionType) => {
    const result = await action();
    if (result?.response) {
      setLastResponse({ type, content: result.response });
      toast({
        title: 'IA Copiloto',
        description: `${INTERACTION_TYPES[type].label} gerado com sucesso!`,
      });
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    const result = await chat(chatMessage);
    if (result?.response) {
      setLastResponse({ type: 'chat', content: result.response });
      setChatMessage('');
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ description: 'Copiado para a área de transferência' });
  };

  if (!canUseAI) {
    return (
      <Card className="border-border/50 bg-muted/10">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Você não tem permissão para usar o Copiloto de IA.
            </p>
            <p className="text-xs text-muted-foreground">
              Entre em contato com o administrador da sua agência.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <Card className="border-border/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Copiloto IA
          </CardTitle>
          <CardDescription>
            Use inteligência artificial para analisar e obter insights sobre este lead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/30"
              onClick={() => handleAction(generateSummary, 'summary')}
              disabled={isLoading}
            >
              {loadingType === 'summary' ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              ) : (
                <FileText className="h-5 w-5 text-blue-400" />
              )}
              <span className="text-xs font-medium">Gerar Resumo</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1 bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30"
              onClick={() => handleAction(suggestNextAction, 'suggestion')}
              disabled={isLoading}
            >
              {loadingType === 'suggestion' ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              ) : (
                <Lightbulb className="h-5 w-5 text-amber-400" />
              )}
              <span className="text-xs font-medium">Sugerir Ação</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1 bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30"
              onClick={() => handleAction(analyzeQuality, 'analysis')}
              disabled={isLoading}
            >
              {loadingType === 'analysis' ? (
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              ) : (
                <BarChart3 className="h-5 w-5 text-purple-400" />
              )}
              <span className="text-xs font-medium">Analisar Lead</span>
            </Button>
          </div>

          {/* Chat Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Textarea
                placeholder="Faça uma pergunta sobre este lead..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="min-h-[60px] bg-muted/20 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChat();
                  }
                }}
              />
              <Button
                size="icon"
                className="h-[60px] w-12 bg-green-500/20 hover:bg-green-500/30 border-green-500/30"
                variant="outline"
                onClick={handleChat}
                disabled={isLoading || !chatMessage.trim()}
              >
                {loadingType === 'chat' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-green-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Last Response */}
          {lastResponse && (
            <Card className="border-border/30 bg-muted/20">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium">
                      {INTERACTION_TYPES[lastResponse.type as CopilotInteractionType]?.label || 'Resposta'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(lastResponse.content, 'last')}
                  >
                    {copiedId === 'last' ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {lastResponse.content}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Interaction History */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Histórico de IA
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => fetchInteractions(historyFilter === 'all' ? undefined : historyFilter)}
            >
              <RefreshCw className={cn("h-3 w-3", interactionsLoading && "animate-spin")} />
            </Button>
          </div>
          <div className="flex gap-1 mt-2">
            {['all', 'summary', 'suggestion', 'analysis', 'chat'].map((filter) => (
              <Badge
                key={filter}
                variant={historyFilter === filter ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer text-xs",
                  historyFilter === filter && "bg-purple-500/20 text-purple-400 border-purple-500/30"
                )}
                onClick={() => setHistoryFilter(filter)}
              >
                {filter === 'all' ? 'Todos' : INTERACTION_TYPES[filter as CopilotInteractionType]?.label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {interactionsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : interactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma interação com IA ainda.
                </p>
                <p className="text-xs text-muted-foreground">
                  Use os botões acima para começar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction) => {
                  const typeConfig = INTERACTION_TYPES[interaction.interaction_type as CopilotInteractionType];
                  const TypeIcon = typeConfig?.icon || MessageSquare;

                  return (
                    <div
                      key={interaction.id}
                      className="p-3 rounded-lg bg-muted/10 border border-border/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={cn("h-4 w-4", typeConfig?.color || "text-muted-foreground")} />
                          <Badge variant="outline" className="text-xs">
                            {typeConfig?.label || interaction.interaction_type}
                          </Badge>
                          {interaction.tokens_used && (
                            <span className="text-xs text-muted-foreground">
                              {interaction.tokens_used} tokens
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(interaction.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(interaction.ai_response || '', interaction.id)}
                          >
                            {copiedId === interaction.id ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {interaction.user_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {interaction.user_name}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {interaction.ai_response}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
