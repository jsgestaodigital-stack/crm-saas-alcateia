import { useUndoRedoKeyboard } from '@/hooks/useUndoRedoKeyboard';

/**
 * Component that activates global Ctrl+Z / Ctrl+Y keyboard shortcuts
 * Must be rendered inside UndoRedoProvider
 */
export function GlobalUndoRedoKeyboard() {
  useUndoRedoKeyboard();
  return null;
}
