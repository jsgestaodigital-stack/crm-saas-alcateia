import { useState, useEffect, useCallback } from 'react';
import { LEAD_COLUMNS, LeadPipelineStage } from '@/types/lead';

export interface PipelineColumn {
  id: string;
  title: string;
  emoji: string;
  color: string;
  order: number;
  isDefault: boolean;
}

const STORAGE_KEY = 'rankeia-pipeline-columns';

// Default columns from lead.ts
const getDefaultColumns = (): PipelineColumn[] => {
  return LEAD_COLUMNS.map((col, index) => ({
    ...col,
    order: index,
    isDefault: true,
  }));
};

export function usePipelineColumns() {
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);

  // Load columns from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new columns
        const defaults = getDefaultColumns();
        const merged = defaults.map(def => {
          const saved = parsed.find((p: PipelineColumn) => p.id === def.id);
          return saved ? { ...def, ...saved } : def;
        });
        // Add any custom columns
        const customColumns = parsed.filter((p: PipelineColumn) => !p.isDefault);
        setColumns([...merged, ...customColumns].sort((a, b) => a.order - b.order));
      } else {
        setColumns(getDefaultColumns());
      }
    } catch (error) {
      console.error('Error loading columns:', error);
      setColumns(getDefaultColumns());
    } finally {
      setLoading(false);
    }
  }, []);

  // Save columns to localStorage (supports functional updates to avoid stale state)
  const saveColumns = useCallback(
    (
      next:
        | PipelineColumn[]
        | ((prev: PipelineColumn[]) => PipelineColumn[]),
    ) => {
      setColumns(prev => {
        const newColumns = typeof next === 'function' ? next(prev) : next;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
        } catch (error) {
          console.error('Error saving columns:', error);
        }
        return newColumns;
      });
    },
    [],
  );

  // Add new column
  const addColumn = useCallback(
    (title: string, emoji: string, color: string) => {
      const id = `custom_${Date.now()}`;
      saveColumns(prev => {
        const newColumn: PipelineColumn = {
          id,
          title,
          emoji,
          color,
          order: prev.length,
          isDefault: false,
        };
        return [...prev, newColumn];
      });
      return id;
    },
    [saveColumns],
  );

  // Update column
  const updateColumn = useCallback(
    (id: string, updates: Partial<PipelineColumn>) => {
      saveColumns(prev =>
        prev.map(col => (col.id === id ? { ...col, ...updates } : col)),
      );
    },
    [saveColumns],
  );

  // Delete column (only custom columns, unless admin)
  const deleteColumn = useCallback(
    (id: string, isAdmin: boolean = false) => {
      const column = columns.find(c => c.id === id);
      if (column?.isDefault && !isAdmin) {
        console.warn('Cannot delete default columns without admin privileges');
        return false;
      }
      saveColumns(prev => prev.filter(col => col.id !== id));
      return true;
    },
    [columns, saveColumns],
  );

  // Reorder columns
  const reorderColumns = useCallback((orderedIds: string[]) => {
    const newColumns = orderedIds.map((id, index) => {
      const col = columns.find(c => c.id === id);
      return col ? { ...col, order: index } : null;
    }).filter(Boolean) as PipelineColumn[];
    saveColumns(newColumns);
  }, [columns, saveColumns]);

  // Move column
  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    const newColumns = [...columns];
    const [moved] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, moved);
    const reordered = newColumns.map((col, i) => ({ ...col, order: i }));
    saveColumns(reordered);
  }, [columns, saveColumns]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultColumns();
    saveColumns(defaults);
  }, [saveColumns]);

  return {
    columns,
    loading,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    moveColumn,
    resetToDefaults,
  };
}
