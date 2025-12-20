import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

/**
 * Undo/Redo Context
 * Item 5: Create contexts for global state - Undo/Redo system
 */

export interface Action {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

interface UndoRedoState {
  past: Action[];
  future: Action[];
  maxHistory: number;
}

type UndoRedoAction =
  | { type: 'PUSH'; action: Action }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

const initialState: UndoRedoState = {
  past: [],
  future: [],
  maxHistory: 20, // Limite de 20 ações como solicitado
};

function undoRedoReducer(state: UndoRedoState, action: UndoRedoAction): UndoRedoState {
  switch (action.type) {
    case 'PUSH': {
      const newPast = [...state.past, action.action];
      // Keep only last maxHistory actions
      if (newPast.length > state.maxHistory) {
        newPast.shift();
      }
      return {
        ...state,
        past: newPast,
        future: [], // Clear redo stack on new action
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const lastAction = state.past[state.past.length - 1];
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const nextAction = state.future[0];
      return {
        ...state,
        past: [...state.past, nextAction],
        future: state.future.slice(1),
      };
    }
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface UndoRedoContextValue {
  canUndo: boolean;
  canRedo: boolean;
  past: Action[];
  future: Action[];
  pushAction: (action: Omit<Action, 'id' | 'timestamp'>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(undoRedoReducer, initialState);

  const pushAction = useCallback((action: Omit<Action, 'id' | 'timestamp'>) => {
    dispatch({
      type: 'PUSH',
      action: {
        ...action,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
    });
    console.log('[UndoRedo] Action pushed:', action.type, action.description);
  }, []);

  const undo = useCallback(async () => {
    if (state.past.length === 0) {
      toast.info('Nada para desfazer');
      return;
    }

    const lastAction = state.past[state.past.length - 1];
    try {
      await lastAction.undo();
      dispatch({ type: 'UNDO' });
      toast.success(`Desfeito: ${lastAction.description}`);
      console.log('[UndoRedo] Undone:', lastAction.type);
    } catch (error) {
      console.error('[UndoRedo] Undo failed:', error);
      toast.error('Erro ao desfazer ação');
    }
  }, [state.past]);

  const redo = useCallback(async () => {
    if (state.future.length === 0) {
      toast.info('Nada para refazer');
      return;
    }

    const nextAction = state.future[0];
    try {
      await nextAction.redo();
      dispatch({ type: 'REDO' });
      toast.success(`Refeito: ${nextAction.description}`);
      console.log('[UndoRedo] Redone:', nextAction.type);
    } catch (error) {
      console.error('[UndoRedo] Redo failed:', error);
      toast.error('Erro ao refazer ação');
    }
  }, [state.future]);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <UndoRedoContext.Provider
      value={{
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        past: state.past,
        future: state.future,
        pushAction,
        undo,
        redo,
        clear,
      }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider');
  }
  return context;
}
