import { useState } from 'react';
import { Bell, MessageCircleQuestion, Clock, CheckCircle2, X } from 'lucide-react';
import { useQuestions, Question } from '@/hooks/useQuestions';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TOOLTIP_CONTENT } from '@/lib/tooltipContent';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { questions, pendingCount, answerQuestion, markAsResolved } = useQuestions();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const recentQuestions = questions.slice(0, 10);

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    const success = await answerQuestion(questionId, answerText);
    if (success) {
      setAnsweringId(null);
      setAnswerText('');
    }
  };

  const getStatusBadge = (status: Question['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive" className="text-xs">Pendente</Badge>;
      case 'answered':
        return <Badge variant="default" className="text-xs bg-primary">Respondida</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="text-xs">Resolvida</Badge>;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={1000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-surface-2"
              >
                <Bell className="h-5 w-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-bold animate-pulse">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="glass max-w-[280px]">
            <p className="font-medium mb-1">Notificações</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{TOOLTIP_CONTENT.actions.notifications}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent 
        className="w-96 p-0 bg-surface-1 border-border/50" 
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Dúvidas da Equipe</h3>
            </div>
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {recentQuestions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageCircleQuestion className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhuma dúvida registrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {recentQuestions.map((q) => (
                <div
                  key={q.id}
                  className={cn(
                    "p-4 transition-colors",
                    q.status === 'pending' && "bg-red-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {q.client_name}
                        </span>
                        {getStatusBadge(q.status)}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(q.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                        <span className="mx-1">•</span>
                        por {q.asked_by_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm mb-2 text-foreground/90">{q.question}</p>

                  {q.answer && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Resposta de {q.answered_by_name}:
                      </p>
                      <p className="text-sm">{q.answer}</p>
                    </div>
                  )}

                  {isAdmin && q.status === 'pending' && (
                    <div className="mt-3">
                      {answeringId === q.id ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Digite sua resposta..."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="min-h-[60px] text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAnswer(q.id)}
                              disabled={!answerText.trim()}
                            >
                              Enviar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAnsweringId(null);
                                setAnswerText('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAnsweringId(q.id)}
                          >
                            Responder
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsResolved(q.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Resolvido
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {q.status === 'answered' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      onClick={() => markAsResolved(q.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como resolvido
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border/30">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setOpen(false);
              window.location.href = '/duvidas';
            }}
          >
            Ver todas as dúvidas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
