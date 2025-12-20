import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for consistent toast feedback across the app
 * Item 7: Toast for user feedback - every important action should show toast
 */
export function useToastFeedback() {
  const success = useCallback((message: string, description?: string) => {
    toast.success(message, { description });
  }, []);

  const error = useCallback((message: string, description?: string) => {
    toast.error(message, { description });
  }, []);

  const warning = useCallback((message: string, description?: string) => {
    toast.warning(message, { description });
  }, []);

  const info = useCallback((message: string, description?: string) => {
    toast.info(message, { description });
  }, []);

  const loading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  const dismiss = useCallback((toastId?: string | number) => {
    toast.dismiss(toastId);
  }, []);

  const promise = useCallback(<T,>(
    promiseFn: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promiseFn, messages);
  }, []);

  // Action-specific feedback
  const clientCreated = useCallback((name: string) => {
    success(`Cliente "${name}" criado com sucesso!`);
  }, [success]);

  const clientUpdated = useCallback((name: string) => {
    success(`Cliente "${name}" atualizado!`);
  }, [success]);

  const clientDeleted = useCallback((name: string) => {
    success(`Cliente "${name}" movido para lixeira`);
  }, [success]);

  const clientRestored = useCallback((name: string) => {
    success(`Cliente "${name}" restaurado!`);
  }, [success]);

  const taskCompleted = useCallback((taskName: string) => {
    success(`Tarefa concluída: ${taskName}`);
  }, [success]);

  const saveSuccess = useCallback(() => {
    success('Alterações salvas!');
  }, [success]);

  const saveError = useCallback((err?: string) => {
    error('Erro ao salvar', err);
  }, [error]);

  const connectionError = useCallback(() => {
    error('Erro de conexão', 'Verifique sua internet e tente novamente');
  }, [error]);

  return {
    // Basic methods
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
    // Action-specific methods
    clientCreated,
    clientUpdated,
    clientDeleted,
    clientRestored,
    taskCompleted,
    saveSuccess,
    saveError,
    connectionError,
  };
}
