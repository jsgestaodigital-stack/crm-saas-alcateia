import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircleQuestion, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter,
  Trash2,
  MessageSquare,
  ArrowLeft,
  Plus,
  XCircle
} from 'lucide-react';
import { useQuestions, Question } from '@/hooks/useQuestions';
import { useAuth } from '@/contexts/AuthContext';
import { useClientStore } from '@/stores/clientStore';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Questions() {
  const { questions, loading, createQuestion, answerQuestion, markAsResolved, deleteQuestion } = useQuestions();
  const { isAdmin, user, isLoading: authLoading, derived } = useAuth();
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
  
  const { clients } = useClientStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  
  // New question state
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.client_name.toLowerCase().includes(search.toLowerCase()) ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.asked_by_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    const success = await answerQuestion(questionId, answerText);
    if (success) {
      setAnsweringId(null);
      setAnswerText('');
    }
  };

  const handleNewQuestion = async () => {
    if (!selectedClientId || !newQuestionText.trim()) return;
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return;
    
    setIsSubmitting(true);
    const success = await createQuestion(selectedClientId, selectedClient.companyName, newQuestionText);
    setIsSubmitting(false);
    
    if (success) {
      setIsNewQuestionOpen(false);
      setSelectedClientId('');
      setNewQuestionText('');
    }
  };

  const handleNewQuestionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNewQuestion();
    }
  };

  // Sort clients alphabetically for selection
  const sortedClients = [...clients].sort((a, b) => 
    a.companyName.localeCompare(b.companyName)
  );

  const getStatusBadge = (status: Question['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">Pendente</Badge>;
      case 'answered':
        return <Badge variant="default" className="bg-primary">Respondida</Badge>;
      case 'resolved':
        return <Badge variant="secondary">Resolvida</Badge>;
    }
  };

  const stats = {
    total: questions.length,
    pending: questions.filter(q => q.status === 'pending').length,
    answered: questions.filter(q => q.status === 'answered').length,
    resolved: questions.filter(q => q.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-4 gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
          <MessageCircleQuestion className="h-7 w-7 text-primary" />
          Dúvidas da Equipe
        </h1>
        <p className="text-muted-foreground">
          Comunicação interna sobre clientes entre Gestor e Operacional
        </p>
        
        {/* New Question Button */}
        <Dialog open={isNewQuestionOpen} onOpenChange={setIsNewQuestionOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Nova Dúvida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nova Dúvida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {sortedClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Dúvida</label>
                <Textarea
                  placeholder="Digite sua dúvida... (Enter para enviar, Shift+Enter para nova linha)"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  onKeyDown={handleNewQuestionKeyDown}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsNewQuestionOpen(false);
                    setSelectedClientId('');
                    setNewQuestionText('');
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleNewQuestion}
                  disabled={!selectedClientId || !newQuestionText.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Dúvida'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-surface-1 border border-border/30 p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-sm text-red-400">Pendentes</p>
          <p className="text-2xl font-bold text-red-400">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/30 p-4">
          <p className="text-sm text-primary">Respondidas</p>
          <p className="text-2xl font-bold text-primary">{stats.answered}</p>
        </div>
        <div className="rounded-xl bg-surface-1 border border-border/30 p-4">
          <p className="text-sm text-muted-foreground">Resolvidas</p>
          <p className="text-2xl font-bold">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, pergunta ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="answered">Respondidas</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircleQuestion className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nenhuma dúvida encontrada</p>
          <p className="text-sm">
            {search || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros' 
              : 'As dúvidas criadas aparecerão aqui'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border-2 p-5 transition-all shadow-lg",
                q.status === 'pending' 
                  ? "bg-red-950/40 border-red-500/50 shadow-red-500/10" 
                  : "bg-surface-2/80 border-border/60 shadow-black/20"
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{q.client_name}</h3>
                    {getStatusBadge(q.status)}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(q.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    <span>•</span>
                    Perguntado por <span className="text-foreground">{q.asked_by_name}</span>
                  </p>
                </div>
                
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir dúvida?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteQuestion(q.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="bg-background/50 rounded-lg p-4 mb-3">
                <p className="text-foreground">{q.question}</p>
              </div>

              {q.answer && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Resposta de {q.answered_by_name}
                    {q.answered_at && (
                      <span className="ml-2">
                        • {formatDistanceToNow(new Date(q.answered_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                  </p>
                  <p className="text-foreground">{q.answer}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {isAdmin && q.status === 'pending' && (
                  <>
                    {answeringId === q.id ? (
                      <div className="w-full space-y-3">
                        <Textarea
                          placeholder="Digite sua resposta..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleAnswer(q.id)} disabled={!answerText.trim()}>
                            Enviar Resposta
                          </Button>
                          <Button variant="ghost" onClick={() => { setAnsweringId(null); setAnswerText(''); }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button onClick={() => setAnsweringId(q.id)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Responder
                        </Button>
                        <Button variant="outline" onClick={() => markAsResolved(q.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marcar como Resolvido
                        </Button>
                      </>
                    )}
                  </>
                )}

                {q.status === 'answered' && (
                  <Button variant="outline" onClick={() => markAsResolved(q.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Resolvido
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
