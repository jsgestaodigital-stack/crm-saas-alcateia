import { useState } from 'react';
import { MessageCircleQuestion, Send } from 'lucide-react';
import { useQuestions } from '@/hooks/useQuestions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AskQuestionButtonProps {
  clientId: string;
  clientName: string;
}

export function AskQuestionButton({ clientId, clientName }: AskQuestionButtonProps) {
  const { createQuestion } = useQuestions();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    const success = await createQuestion(clientId, clientName, question.trim());
    setLoading(false);
    
    if (success) {
      setQuestion('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
        >
          <MessageCircleQuestion className="h-4 w-4" />
          Tenho uma dúvida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
            Nova Dúvida
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cliente</p>
            <p className="font-medium">{clientName}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Sua dúvida</p>
            <Textarea
              placeholder="Ex: Já tem a logo nova desse cliente? / Vou tirar fotos ou o cliente vai enviar?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="min-h-[100px]"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Pressione Enter para enviar ou Shift+Enter para nova linha
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!question.trim() || loading}
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Dúvida'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
