import { useEffect, useCallback } from 'react';
import { useUndoRedo } from '@/contexts/UndoRedoContext';

/**
 * Hook para gerenciar atalhos de teclado globais de undo/redo
 * Ctrl+Z = Desfazer
 * Ctrl+Shift+Z ou Ctrl+Y = Refazer
 */
export function useUndoRedoKeyboard() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorar se estiver digitando em input/textarea
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Ctrl+Z = Undo
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      if (canUndo) {
        undo();
      }
      return;
    }

    // Ctrl+Shift+Z ou Ctrl+Y = Redo
    if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
      e.preventDefault();
      if (canRedo) {
        redo();
      }
      return;
    }
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { undo, redo, canUndo, canRedo };
}
