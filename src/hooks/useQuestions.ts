import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Question {
  id: string;
  client_id: string;
  client_name: string;
  asked_by: string;
  asked_by_name: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  answered_by_name: string | null;
  status: 'pending' | 'answered' | 'resolved';
  created_at: string;
  updated_at: string;
  answered_at: string | null;
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions((data as Question[]) || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('questions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'questions' },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingCount = questions.filter(q => q.status === 'pending').length;

  const createQuestion = async (clientId: string, clientName: string, questionText: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar uma dúvida');
      return false;
    }

    try {
      const { error } = await supabase.from('questions').insert({
        client_id: clientId,
        client_name: clientName,
        asked_by: user.id,
        asked_by_name: userName,
        question: questionText,
      });

      if (error) throw error;
      toast.success('Dúvida enviada com sucesso!');
      return true;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Erro ao enviar dúvida');
      return false;
    }
  };

  const answerQuestion = async (questionId: string, answerText: string) => {
    if (!user || !isAdmin) {
      toast.error('Apenas administradores podem responder dúvidas');
      return false;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .update({
          answer: answerText,
          answered_by: user.id,
          answered_by_name: userName,
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
      toast.success('Resposta enviada!');
      return true;
    } catch (error) {
      console.error('Error answering question:', error);
      toast.error('Erro ao responder dúvida');
      return false;
    }
  };

  const markAsResolved = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: 'resolved' })
        .eq('id', questionId);

      if (error) throw error;
      toast.success('Dúvida marcada como resolvida');
      return true;
    } catch (error) {
      console.error('Error marking as resolved:', error);
      toast.error('Erro ao marcar como resolvida');
      return false;
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      toast.success('Dúvida excluída');
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Erro ao excluir dúvida');
      return false;
    }
  };

  return {
    questions,
    loading,
    pendingCount,
    createQuestion,
    answerQuestion,
    markAsResolved,
    deleteQuestion,
    refetch: fetchQuestions,
  };
}
