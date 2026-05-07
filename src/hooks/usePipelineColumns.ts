import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LEAD_COLUMNS } from '@/types/lead';

export interface PipelineColumn {
  id: string;
  title: string;
  emoji: string;
  color: string;
  order: number;
  isDefault: boolean;
}

const LEGACY_STORAGE_KEY = 'rankeia-pipeline-columns';

const getDefaultColumns = (): PipelineColumn[] =>
  LEAD_COLUMNS.map((col, index) => ({
    ...col,
    order: index,
    isDefault: true,
  }));

interface DbRow {
  id: string;
  title: string;
  emoji: string;
  color: string;
  position: number;
  is_default: boolean;
}

const rowToColumn = (r: DbRow): PipelineColumn => ({
  id: r.id,
  title: r.title,
  emoji: r.emoji,
  color: r.color,
  order: r.position,
  isDefault: r.is_default,
});

export function usePipelineColumns() {
  const { currentAgencyId } = useAuth();
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef<string | null>(null);

  const fetchColumns = useCallback(async (agencyId: string): Promise<PipelineColumn[]> => {
    const { data, error } = await (supabase as any)
      .from('pipeline_columns')
      .select('id, title, emoji, color, position, is_default')
      .eq('agency_id', agencyId)
      .order('position', { ascending: true });
    if (error) {
      console.error('[pipeline_columns] fetch error', error);
      return getDefaultColumns();
    }
    return (data as DbRow[]).map(rowToColumn);
  }, []);

  const seedDefaults = useCallback(async (agencyId: string) => {
    const defaults = getDefaultColumns();
    const rows = defaults.map(c => ({
      id: c.id,
      agency_id: agencyId,
      title: c.title,
      emoji: c.emoji,
      color: c.color,
      position: c.order,
      is_default: true,
    }));
    await (supabase as any)
      .from('pipeline_columns')
      .upsert(rows, { onConflict: 'id' });
  }, []);

  const migrateFromLocalStorage = useCallback(async (agencyId: string) => {
    try {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as PipelineColumn[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return;
      }
      const rows = parsed.map((c, i) => ({
        id: c.id,
        agency_id: agencyId,
        title: c.title,
        emoji: c.emoji,
        color: c.color,
        position: typeof c.order === 'number' ? c.order : i,
        is_default: !!c.isDefault,
      }));
      await (supabase as any)
        .from('pipeline_columns')
        .upsert(rows, { onConflict: 'id' });
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (e) {
      console.error('[pipeline_columns] localStorage migration failed', e);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!currentAgencyId) return;
    const cols = await fetchColumns(currentAgencyId);
    setColumns(cols);
  }, [currentAgencyId, fetchColumns]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentAgencyId) {
        setColumns(getDefaultColumns());
        setLoading(false);
        return;
      }
      setLoading(true);

      // One-time per agency: migrate localStorage + seed defaults if empty
      if (seededRef.current !== currentAgencyId) {
        await migrateFromLocalStorage(currentAgencyId);
        const existing = await fetchColumns(currentAgencyId);
        if (existing.length === 0) {
          await seedDefaults(currentAgencyId);
        }
        seededRef.current = currentAgencyId;
      }

      const cols = await fetchColumns(currentAgencyId);
      if (!cancelled) {
        setColumns(cols);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentAgencyId, fetchColumns, migrateFromLocalStorage, seedDefaults]);

  // Realtime sync
  useEffect(() => {
    if (!currentAgencyId) return;
    const channel = supabase
      .channel(`pipeline_columns:${currentAgencyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_columns', filter: `agency_id=eq.${currentAgencyId}` },
        () => { reload(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentAgencyId, reload]);

  const addColumn = useCallback(
    (title: string, emoji: string, color: string) => {
      const id = `custom_${Date.now()}`;
      if (!currentAgencyId) return id;
      const nextPos = columns.length;
      // Optimistic
      setColumns(prev => [...prev, { id, title, emoji, color, order: nextPos, isDefault: false }]);
      (supabase as any)
        .from('pipeline_columns')
        .insert({
          id,
          agency_id: currentAgencyId,
          title,
          emoji,
          color,
          position: nextPos,
          is_default: false,
        })
        .then(({ error }: any) => {
          if (error) {
            console.error('[pipeline_columns] insert failed', error);
            reload();
          }
        });
      return id;
    },
    [columns.length, currentAgencyId, reload],
  );

  const updateColumn = useCallback(
    (id: string, updates: Partial<PipelineColumn>) => {
      setColumns(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.emoji !== undefined) payload.emoji = updates.emoji;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.order !== undefined) payload.position = updates.order;
      (supabase as any)
        .from('pipeline_columns')
        .update(payload)
        .eq('id', id)
        .then(({ error }: any) => {
          if (error) {
            console.error('[pipeline_columns] update failed', error);
            reload();
          }
        });
    },
    [reload],
  );

  const deleteColumn = useCallback(
    (id: string, isAdmin: boolean = false) => {
      const column = columns.find(c => c.id === id);
      if (column?.isDefault && !isAdmin) {
        console.warn('Cannot delete default columns without admin privileges');
        return false;
      }
      setColumns(prev => prev.filter(c => c.id !== id));
      (supabase as any)
        .from('pipeline_columns')
        .delete()
        .eq('id', id)
        .then(({ error }: any) => {
          if (error) {
            console.error('[pipeline_columns] delete failed', error);
            reload();
          }
        });
      return true;
    },
    [columns, reload],
  );

  const persistOrder = useCallback(
    async (ordered: PipelineColumn[]) => {
      if (!currentAgencyId) return;
      const rows = ordered.map((c, i) => ({
        id: c.id,
        agency_id: currentAgencyId,
        title: c.title,
        emoji: c.emoji,
        color: c.color,
        position: i,
        is_default: c.isDefault,
      }));
      const { error } = await (supabase as any)
        .from('pipeline_columns')
        .upsert(rows, { onConflict: 'id' });
      if (error) {
        console.error('[pipeline_columns] reorder failed', error);
        reload();
      }
    },
    [currentAgencyId, reload],
  );

  const reorderColumns = useCallback(
    (orderedIds: string[]) => {
      const newColumns = orderedIds
        .map((id, index) => {
          const col = columns.find(c => c.id === id);
          return col ? { ...col, order: index } : null;
        })
        .filter(Boolean) as PipelineColumn[];
      setColumns(newColumns);
      persistOrder(newColumns);
    },
    [columns, persistOrder],
  );

  const moveColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newColumns = [...columns];
      const [moved] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, moved);
      const reordered = newColumns.map((col, i) => ({ ...col, order: i }));
      setColumns(reordered);
      persistOrder(reordered);
    },
    [columns, persistOrder],
  );

  const resetToDefaults = useCallback(async () => {
    if (!currentAgencyId) return;
    const defaults = getDefaultColumns();
    // Delete all custom and reseed defaults
    await (supabase as any)
      .from('pipeline_columns')
      .delete()
      .eq('agency_id', currentAgencyId)
      .eq('is_default', false);
    await seedDefaults(currentAgencyId);
    reload();
  }, [currentAgencyId, reload, seedDefaults]);

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
