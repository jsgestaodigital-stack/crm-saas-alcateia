import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, endOfWeek, addDays, subDays, isToday, isBefore, parseISO, startOfDay, differenceInDays } from "date-fns";

// Types
export interface RecurringRoutine {
  id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  occurrences_per_period: number;
  rules_json: Record<string, unknown>;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringClient {
  id: string;
  client_id: string | null;
  company_name: string;
  status: 'active' | 'paused' | 'cancelled';
  responsible_user_id: string | null;
  responsible_name: string;
  schedule_variant: string;
  start_date: string;
  timezone: string | null;
  notes: string | null;
  monthly_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTask {
  id: string;
  recurring_client_id: string;
  routine_id: string;
  due_date: string;
  status: 'todo' | 'done' | 'skipped';
  completed_at: string | null;
  completed_by: string | null;
  completed_by_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  recurring_client?: RecurringClient;
  routine?: RecurringRoutine;
}

export interface RecurringStats {
  todayTasks: number;
  todayCompleted: number;
  weekTasks: number;
  weekCompleted: number;
  overdueTasks: number;
  activeClients: number;
  weeklyComplianceRate: number;
}

export function useRecurring() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<RecurringRoutine[]>([]);
  const [allRoutines, setAllRoutines] = useState<RecurringRoutine[]>([]);
  const [clients, setClients] = useState<RecurringClient[]>([]);
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RecurringStats>({
    todayTasks: 0,
    todayCompleted: 0,
    weekTasks: 0,
    weekCompleted: 0,
    overdueTasks: 0,
    activeClients: 0,
    weeklyComplianceRate: 0,
  });

  // Helper: Create default routines if none exist
  const ensureDefaultRoutines = useCallback(async () => {
    const defaultRoutines = [
      { title: 'Verificar Perfil GMB', description: 'Revisar informações do perfil no Google Meu Negócio', frequency: 'weekly', occurrences_per_period: 2, sort_order: 1 },
      { title: 'Postar Atualização', description: 'Publicar uma atualização ou post no GMB', frequency: 'weekly', occurrences_per_period: 2, sort_order: 2 },
      { title: 'Responder Avaliações', description: 'Responder novas avaliações recebidas', frequency: 'weekly', occurrences_per_period: 2, sort_order: 3 },
      { title: 'Verificar Insights', description: 'Analisar métricas e insights do perfil', frequency: 'weekly', occurrences_per_period: 1, sort_order: 4 },
      { title: 'Atualizar Fotos', description: 'Adicionar ou atualizar fotos do negócio', frequency: 'biweekly', occurrences_per_period: 1, sort_order: 5 },
      { title: 'Relatório Mensal', description: 'Gerar e enviar relatório mensal ao cliente', frequency: 'monthly', occurrences_per_period: 1, sort_order: 6 },
    ];

    const { error } = await supabase
      .from("recurring_routines")
      .insert(defaultRoutines.map(r => ({
        ...r,
        rules_json: {},
        active: true,
      })));

    if (error && !error.message.includes('duplicate')) {
      console.error("Error creating default routines:", error);
      return false;
    }
    return true;
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch all routines (for admin)
      let { data: allRoutinesData, error: allRoutinesError } = await supabase
        .from("recurring_routines")
        .select("*")
        .order("sort_order");
      
      if (allRoutinesError) throw allRoutinesError;
      
      // If no routines exist, create default ones
      if (!allRoutinesData || allRoutinesData.length === 0) {
        console.log("No routines found, creating defaults...");
        const created = await ensureDefaultRoutines();
        if (created) {
          // Re-fetch routines after creation
          const { data: newRoutinesData } = await supabase
            .from("recurring_routines")
            .select("*")
            .order("sort_order");
          allRoutinesData = newRoutinesData || [];
        }
      }
      
      setAllRoutines((allRoutinesData as RecurringRoutine[]) || []);
      
      // Filter active routines
      const activeRoutines = (allRoutinesData as RecurringRoutine[])?.filter(r => r.active) || [];
      setRoutines(activeRoutines);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("recurring_clients")
        .select("*")
        .eq("status", "active")
        .order("company_name");
      
      if (clientsError) throw clientsError;
      setClients((clientsData as RecurringClient[]) || []);

      // Fetch tasks for the current week + overdue
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const pastStart = subDays(today, 30); // Get 30 days back for overdue

      const { data: tasksData, error: tasksError } = await supabase
        .from("recurring_tasks")
        .select("*")
        .gte("due_date", format(pastStart, "yyyy-MM-dd"))
        .lte("due_date", format(weekEnd, "yyyy-MM-dd"))
        .order("due_date");
      
      if (tasksError) throw tasksError;
      
      // Enrich tasks with client and routine data
      const enrichedTasks: RecurringTask[] = ((tasksData as RecurringTask[]) || []).map(task => ({
        ...task,
        recurring_client: (clientsData as RecurringClient[])?.find(c => c.id === task.recurring_client_id),
        routine: (allRoutinesData as RecurringRoutine[])?.find(r => r.id === task.routine_id),
      }));
      
      setTasks(enrichedTasks);

      // Calculate stats
      const todayStr = format(today, "yyyy-MM-dd");
      const todayTasks = enrichedTasks.filter(t => t.due_date === todayStr);
      const weekTasks = enrichedTasks.filter(t => {
        const dueDate = parseISO(t.due_date);
        return dueDate >= weekStart && dueDate <= weekEnd;
      });
      const overdueTasks = enrichedTasks.filter(t => {
        const dueDate = parseISO(t.due_date);
        return isBefore(dueDate, startOfDay(today)) && t.status === 'todo';
      });

      const weekCompleted = weekTasks.filter(t => t.status === 'done').length;
      const weeklyComplianceRate = weekTasks.length > 0 
        ? Math.round((weekCompleted / weekTasks.length) * 100)
        : 0;

      setStats({
        todayTasks: todayTasks.length,
        todayCompleted: todayTasks.filter(t => t.status === 'done').length,
        weekTasks: weekTasks.length,
        weekCompleted,
        overdueTasks: overdueTasks.length,
        activeClients: (clientsData as RecurringClient[])?.length || 0,
        weeklyComplianceRate,
      });

    } catch (error) {
      console.error("Error fetching recurring data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, ensureDefaultRoutines]);

  // Generate tasks for a client (idempotent)
  const generateTasksForClient = useCallback(async (clientId: string, daysAhead: number = 14) => {
    if (!user || routines.length === 0) return;

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const today = startOfDay(new Date());
    const endDate = addDays(today, daysAhead);
    const tasksToCreate: Array<{
      recurring_client_id: string;
      routine_id: string;
      due_date: string;
    }> = [];

    // Get schedule variant offsets
    const variantOffsets: Record<string, number> = {
      'A': 0,
      'B': 1,
      'C': 2,
      'D': 3,
    };
    const offset = variantOffsets[client.schedule_variant] || 0;

    for (const routine of routines) {
      const startDate = parseISO(client.start_date);
      let currentDate = today;

      while (currentDate <= endDate) {
        let shouldCreate = false;
        const dayOfWeek = currentDate.getDay();
        const daysSinceStart = differenceInDays(currentDate, startDate);

        switch (routine.frequency) {
          case 'daily':
            shouldCreate = true;
            break;
          case 'weekly':
            // Use schedule variant for day distribution
            const weeklyDays = [1 + offset, 4 + offset].map(d => d % 7); // Mon/Thu or Tue/Fri based on variant
            if (routine.occurrences_per_period === 2) {
              shouldCreate = weeklyDays.includes(dayOfWeek);
            } else {
              shouldCreate = dayOfWeek === (1 + offset) % 7;
            }
            break;
          case 'biweekly':
            const weeksSinceStart = Math.floor(daysSinceStart / 7);
            const biweeklyOffset = (routine.rules_json as any)?.offsetDays || 0;
            const adjustedWeeks = Math.floor((daysSinceStart + biweeklyOffset) / 7);
            shouldCreate = adjustedWeeks % 2 === 0 && dayOfWeek === (1 + offset) % 7;
            break;
          case 'monthly':
            // First Monday of each month
            shouldCreate = currentDate.getDate() <= 7 && dayOfWeek === 1;
            break;
        }

        if (shouldCreate) {
          tasksToCreate.push({
            recurring_client_id: clientId,
            routine_id: routine.id,
            due_date: format(currentDate, "yyyy-MM-dd"),
          });
        }

        currentDate = addDays(currentDate, 1);
      }
    }

    // Insert tasks (ON CONFLICT DO NOTHING via unique constraint)
    if (tasksToCreate.length > 0) {
      const { error } = await supabase
        .from("recurring_tasks")
        .upsert(tasksToCreate, { onConflict: 'recurring_client_id,routine_id,due_date', ignoreDuplicates: true });
      
      if (error) {
        console.error("Error generating tasks:", error);
      }
    }
  }, [user, routines, clients]);

  // Generate tasks for all active clients
  const generateAllTasks = useCallback(async () => {
    for (const client of clients) {
      await generateTasksForClient(client.id);
    }
    await fetchData();
  }, [clients, generateTasksForClient, fetchData]);

  // Complete a task
  const completeTask = useCallback(async (taskId: string, userName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("recurring_tasks")
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        completed_by_name: userName,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Error completing task:", error);
      return false;
    }

    await fetchData();
    return true;
  }, [user, fetchData]);

  // Skip a task
  const skipTask = useCallback(async (taskId: string, notes?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("recurring_tasks")
      .update({
        status: 'skipped',
        notes,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Error skipping task:", error);
      return false;
    }

    await fetchData();
    return true;
  }, [user, fetchData]);

  // Reopen a task
  const reopenTask = useCallback(async (taskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("recurring_tasks")
      .update({
        status: 'todo',
        completed_at: null,
        completed_by: null,
        completed_by_name: null,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Error reopening task:", error);
      return false;
    }

    await fetchData();
    return true;
  }, [user, fetchData]);

  // Add a new recurring client
  const addRecurringClient = useCallback(async (data: {
    client_id?: string;
    company_name: string;
    responsible_name: string;
    monthly_value?: number;
  }): Promise<RecurringClient | null> => {
    if (!user) {
      console.error("No user authenticated");
      return null;
    }

    // CRITICAL: Ensure routines exist before creating client
    // This fixes the issue where clients are created but no tasks appear
    let currentRoutines = routines;
    if (currentRoutines.length === 0) {
      console.log("No routines found, creating defaults before adding client...");
      await ensureDefaultRoutines();
      // Re-fetch routines
      const { data: freshRoutines } = await supabase
        .from("recurring_routines")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      currentRoutines = (freshRoutines as RecurringRoutine[]) || [];
      setRoutines(currentRoutines);
    }

    // Assign random schedule variant
    const variants = ['A', 'B', 'C', 'D'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];

    // Build insert data
    const insertData = {
      client_id: data.client_id || null,
      company_name: data.company_name,
      responsible_name: data.responsible_name,
      schedule_variant: randomVariant,
      responsible_user_id: user.id,
      start_date: format(new Date(), "yyyy-MM-dd"),
      monthly_value: data.monthly_value && data.monthly_value > 0 ? data.monthly_value : undefined,
    };

    const { data: newClient, error } = await supabase
      .from("recurring_clients")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error adding recurring client:", error);
      // Provide more specific error messages
      if (error.message.includes('agency')) {
        console.error("Agency ID issue - user may not have an agency selected");
      }
      return null;
    }

    if (!newClient) {
      console.error("Client inserted but no data returned");
      return null;
    }

    console.log("Recurring client created successfully:", newClient.id);

    // Generate tasks for the new client
    if (currentRoutines.length > 0) {
      const today = startOfDay(new Date());
      const endDate = addDays(today, 14);
      const tasksToCreate: Array<{
        recurring_client_id: string;
        routine_id: string;
        due_date: string;
      }> = [];

      const variantOffsets: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      const offset = variantOffsets[randomVariant] || 0;

      for (const routine of currentRoutines) {
        let currentDate = today;
        while (currentDate <= endDate) {
          let shouldCreate = false;
          const dayOfWeek = currentDate.getDay();

          switch (routine.frequency) {
            case 'daily':
              shouldCreate = true;
              break;
            case 'weekly':
              const weeklyDays = [1 + offset, 4 + offset].map(d => d % 7);
              shouldCreate = routine.occurrences_per_period === 2 
                ? weeklyDays.includes(dayOfWeek)
                : dayOfWeek === (1 + offset) % 7;
              break;
            case 'biweekly':
              shouldCreate = dayOfWeek === (1 + offset) % 7;
              break;
            case 'monthly':
              shouldCreate = currentDate.getDate() <= 7 && dayOfWeek === 1;
              break;
          }

          if (shouldCreate) {
            tasksToCreate.push({
              recurring_client_id: newClient.id,
              routine_id: routine.id,
              due_date: format(currentDate, "yyyy-MM-dd"),
            });
          }
          currentDate = addDays(currentDate, 1);
        }
      }

      if (tasksToCreate.length > 0) {
        const { error: taskError } = await supabase
          .from("recurring_tasks")
          .upsert(tasksToCreate, { onConflict: 'recurring_client_id,routine_id,due_date', ignoreDuplicates: true });
        
        if (taskError) {
          console.error("Error creating tasks for new client:", taskError);
        } else {
          console.log(`Created ${tasksToCreate.length} tasks for new recurring client`);
        }
      }
    } else {
      console.warn("No routines available to generate tasks");
    }
    
    // Refresh data to update UI
    await fetchData();

    return newClient as RecurringClient;
  }, [user, fetchData, routines, ensureDefaultRoutines]);

  // Create a new routine (admin only)
  const createRoutine = useCallback(async (data: {
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    occurrences_per_period?: number;
    rules_json?: Record<string, unknown>;
    active?: boolean;
  }) => {
    if (!user) return null;

    // Get max sort_order
    const maxOrder = allRoutines.reduce((max, r) => Math.max(max, r.sort_order), 0);

    const { data: newRoutine, error } = await supabase
      .from("recurring_routines")
      .insert([{
        title: data.title,
        description: data.description || null,
        frequency: data.frequency,
        occurrences_per_period: data.occurrences_per_period || 1,
        rules_json: (data.rules_json || {}) as any,
        active: data.active ?? true,
        sort_order: maxOrder + 1,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating routine:", error);
      return null;
    }

    await fetchData();
    return newRoutine;
  }, [user, fetchData, allRoutines]);

  // Update a routine (admin only)
  const updateRoutine = useCallback(async (routineId: string, data: Partial<{
    title: string;
    description: string | null;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    occurrences_per_period: number;
    rules_json: Record<string, unknown>;
    active: boolean;
    sort_order: number;
  }>) => {
    if (!user) return false;

    const updateData: any = { ...data };
    if (data.rules_json) {
      updateData.rules_json = data.rules_json as any;
    }
    
    const { error } = await supabase
      .from("recurring_routines")
      .update(updateData)
      .eq("id", routineId);

    if (error) {
      console.error("Error updating routine:", error);
      return false;
    }

    await fetchData();
    return true;
  }, [user, fetchData]);

  // Delete a routine (admin only)
  const deleteRoutine = useCallback(async (routineId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("recurring_routines")
      .delete()
      .eq("id", routineId);

    if (error) {
      console.error("Error deleting routine:", error);
      return false;
    }

    await fetchData();
    return true;
  }, [user, fetchData]);

  // Update recurring client (e.g., monthly_value)
  const updateRecurringClient = useCallback(async (clientId: string, data: Partial<{
    monthly_value: number | null;
    notes: string | null;
    status: 'active' | 'paused' | 'cancelled';
  }>) => {
    if (!user) return false;

    const { error } = await supabase
      .from("recurring_clients")
      .update(data)
      .eq("id", clientId);

    if (error) {
      console.error("Error updating recurring client:", error);
      return false;
    }

    await fetchData();
    return true;
  }, [user, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get tasks by filter
  const getTodayTasks = useCallback(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return tasks.filter(t => t.due_date === todayStr);
  }, [tasks]);

  const getWeekTasks = useCallback(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    return tasks.filter(t => {
      const dueDate = parseISO(t.due_date);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const today = startOfDay(new Date());
    return tasks.filter(t => {
      const dueDate = parseISO(t.due_date);
      return isBefore(dueDate, today) && t.status === 'todo';
    });
  }, [tasks]);

  const getTasksByClient = useCallback((clientId: string) => {
    return tasks.filter(t => t.recurring_client_id === clientId);
  }, [tasks]);

  // Get client stats
  const getClientStats = useCallback((clientId: string) => {
    const clientTasks = getTasksByClient(clientId);
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    const weekTasks = clientTasks.filter(t => {
      const dueDate = parseISO(t.due_date);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });
    
    const completedWeek = weekTasks.filter(t => t.status === 'done').length;
    const complianceRate = weekTasks.length > 0 
      ? Math.round((completedWeek / weekTasks.length) * 100)
      : 0;
    
    const pendingTasks = clientTasks.filter(t => t.status === 'todo').length;
    
    // Last action date
    const completedTasks = clientTasks.filter(t => t.completed_at);
    const lastAction = completedTasks.length > 0
      ? completedTasks.sort((a, b) => 
          new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
        )[0].completed_at
      : null;

    return {
      complianceRate,
      pendingTasks,
      lastAction,
      totalThisWeek: weekTasks.length,
      completedThisWeek: completedWeek,
    };
  }, [getTasksByClient]);

  return {
    routines,
    allRoutines,
    clients,
    tasks,
    stats,
    loading,
    fetchData,
    generateAllTasks,
    completeTask,
    skipTask,
    reopenTask,
    addRecurringClient,
    updateRecurringClient,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getTodayTasks,
    getWeekTasks,
    getOverdueTasks,
    getTasksByClient,
    getClientStats,
  };
}