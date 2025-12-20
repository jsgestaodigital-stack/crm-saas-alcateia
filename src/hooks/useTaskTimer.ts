import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ActiveTimer {
  clientId: string;
  clientName: string;
  taskId: string;
  taskTitle: string;
  sectionTitle: string;
  startedAt: Date;
}

export interface TaskTimeEntry {
  id: string;
  client_id: string;
  client_name: string;
  task_id: string;
  task_title: string;
  section_title: string;
  user_id: string;
  user_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  created_at: string;
}

// Global state for active timer (persists across components)
let globalActiveTimer: ActiveTimer | null = null;
let globalListeners: Set<() => void> = new Set();

const notifyListeners = () => {
  globalListeners.forEach(listener => listener());
};

export function useTaskTimer() {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(globalActiveTimer);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => {
      setActiveTimer(globalActiveTimer);
    };
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  // Update elapsed time every second when timer is active
  useEffect(() => {
    if (activeTimer) {
      const updateElapsed = () => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - activeTimer.startedAt.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      };

      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setElapsedSeconds(0);
    }
  }, [activeTimer]);

  const startTimer = useCallback((
    clientId: string,
    clientName: string,
    taskId: string,
    taskTitle: string,
    sectionTitle: string
  ) => {
    if (globalActiveTimer) {
      toast.error('Já existe um cronômetro ativo. Pare-o antes de iniciar outro.');
      return false;
    }

    const newTimer: ActiveTimer = {
      clientId,
      clientName,
      taskId,
      taskTitle,
      sectionTitle,
      startedAt: new Date(),
    };

    globalActiveTimer = newTimer;
    setActiveTimer(newTimer);
    notifyListeners();
    toast.success(`Cronômetro iniciado: ${taskTitle}`);
    return true;
  }, []);

  const stopTimer = useCallback(async () => {
    if (!globalActiveTimer || !user) {
      return false;
    }

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - globalActiveTimer.startedAt.getTime()) / 1000);

    try {
      const { error } = await supabase.from('task_time_entries').insert({
        client_id: globalActiveTimer.clientId,
        client_name: globalActiveTimer.clientName,
        task_id: globalActiveTimer.taskId,
        task_title: globalActiveTimer.taskTitle,
        section_title: globalActiveTimer.sectionTitle,
        user_id: user.id,
        user_name: userName,
        started_at: globalActiveTimer.startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      });

      if (error) throw error;

      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      toast.success(`Tempo registrado: ${minutes}m ${seconds}s`);

      globalActiveTimer = null;
      setActiveTimer(null);
      notifyListeners();
      return true;
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error('Erro ao salvar tempo');
      return false;
    }
  }, [user, userName]);

  const cancelTimer = useCallback(() => {
    globalActiveTimer = null;
    setActiveTimer(null);
    notifyListeners();
    toast.info('Cronômetro cancelado');
  }, []);

  const isTimerActiveForTask = useCallback((taskId: string) => {
    return globalActiveTimer?.taskId === taskId;
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    activeTimer,
    elapsedSeconds,
    startTimer,
    stopTimer,
    cancelTimer,
    isTimerActiveForTask,
    formatTime,
    hasActiveTimer: !!activeTimer,
  };
}

// Hook to fetch time entries for analytics
export function useTaskTimeEntries(clientId?: string) {
  const [entries, setEntries] = useState<TaskTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        let query = supabase
          .from('task_time_entries')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientId) {
          query = query.eq('client_id', clientId);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        setEntries((data as TaskTimeEntry[]) || []);
      } catch (error) {
        console.error('Error fetching time entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [clientId]);

  // Calculate average time per task
  const getAverageTimeByTask = useCallback(() => {
    const taskTimes: Record<string, { total: number; count: number; title: string }> = {};

    entries.forEach(entry => {
      if (!taskTimes[entry.task_id]) {
        taskTimes[entry.task_id] = { total: 0, count: 0, title: entry.task_title };
      }
      taskTimes[entry.task_id].total += entry.duration_seconds;
      taskTimes[entry.task_id].count += 1;
    });

    return Object.entries(taskTimes).map(([taskId, data]) => ({
      taskId,
      taskTitle: data.title,
      averageSeconds: Math.round(data.total / data.count),
      totalEntries: data.count,
    }));
  }, [entries]);

  return {
    entries,
    loading,
    getAverageTimeByTask,
  };
}
