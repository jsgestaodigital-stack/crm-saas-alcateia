import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

interface RecurringRoutine {
  id: string;
  title: string;
  frequency: string;
  occurrences_per_period: number;
  rules_json: Record<string, unknown>;
  active: boolean;
}

interface RecurringClient {
  id: string;
  schedule_variant: string;
  start_date: string;
  status: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is authenticated
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Create admin client for permission checks and data operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has admin or recurring access
    const { data: hasRecurringAccess } = await supabaseAdmin.rpc('can_access_recurring', { _user_id: user.id });
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });
    
    if (!hasRecurringAccess && !isAdmin) {
      console.error(`Access denied for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Access denied. Requires recurring or admin access.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} authorized (admin: ${isAdmin}, recurring: ${hasRecurringAccess})`);
    
    // Parse request body for optional parameters
    let daysAhead = 14;
    try {
      const body = await req.json();
      if (body.daysAhead) daysAhead = Math.min(body.daysAhead, 30);
    } catch {
      // Use defaults
    }

    console.log(`Generating recurring tasks for ${daysAhead} days ahead...`);

    // Fetch active routines
    const { data: routines, error: routinesError } = await supabaseAdmin
      .from('recurring_routines')
      .select('*')
      .eq('active', true)
      .order('sort_order');

    if (routinesError) {
      console.error('Error fetching routines:', routinesError);
      throw routinesError;
    }

    if (!routines || routines.length === 0) {
      console.log('No active routines found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active routines', tasksCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${routines.length} active routines`);

    // Fetch active clients
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('recurring_clients')
      .select('*')
      .eq('status', 'active');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      throw clientsError;
    }

    if (!clients || clients.length === 0) {
      console.log('No active recurring clients found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active recurring clients', tasksCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${clients.length} active recurring clients`);

    // Helper functions
    const addDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const differenceInDays = (date1: Date, date2: Date): number => {
      const diffTime = date1.getTime() - date2.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    const startOfDay = (date: Date): Date => {
      const result = new Date(date);
      result.setHours(0, 0, 0, 0);
      return result;
    };

    // Generate tasks for each client
    const tasksToCreate: Array<{
      recurring_client_id: string;
      routine_id: string;
      due_date: string;
    }> = [];

    const variantOffsets: Record<string, number> = {
      'A': 0, 'B': 1, 'C': 2, 'D': 3,
    };

    const today = startOfDay(new Date());
    const endDate = addDays(today, daysAhead);

    for (const client of clients as RecurringClient[]) {
      const offset = variantOffsets[client.schedule_variant] || 0;
      const clientStartDate = new Date(client.start_date);

      for (const routine of routines as RecurringRoutine[]) {
        let currentDate = new Date(today);

        while (currentDate <= endDate) {
          let shouldCreate = false;
          const dayOfWeek = currentDate.getDay();
          const daysSinceStart = differenceInDays(currentDate, clientStartDate);

          switch (routine.frequency) {
            case 'daily':
              shouldCreate = true;
              break;
              
            case 'weekly': {
              const weeklyDays = [1 + offset, 4 + offset].map(d => d % 7);
              if (routine.occurrences_per_period === 2) {
                shouldCreate = weeklyDays.includes(dayOfWeek);
              } else {
                shouldCreate = dayOfWeek === (1 + offset) % 7;
              }
              break;
            }
            
            case 'biweekly': {
              const biweeklyOffset = (routine.rules_json as any)?.offsetDays || 0;
              const adjustedDays = daysSinceStart + biweeklyOffset;
              const adjustedWeeks = Math.floor(adjustedDays / 7);
              shouldCreate = adjustedWeeks % 2 === 0 && dayOfWeek === (1 + offset) % 7;
              break;
            }
            
            case 'monthly':
              // First Monday of each month
              shouldCreate = currentDate.getDate() <= 7 && dayOfWeek === 1;
              break;
          }

          if (shouldCreate) {
            tasksToCreate.push({
              recurring_client_id: client.id,
              routine_id: routine.id,
              due_date: formatDate(currentDate),
            });
          }

          currentDate = addDays(currentDate, 1);
        }
      }
    }

    console.log(`Generated ${tasksToCreate.length} potential tasks`);

    // Insert tasks with ON CONFLICT DO NOTHING (via unique constraint)
    let tasksCreated = 0;
    
    if (tasksToCreate.length > 0) {
      // Insert in batches of 500 to avoid payload limits
      const batchSize = 500;
      for (let i = 0; i < tasksToCreate.length; i += batchSize) {
        const batch = tasksToCreate.slice(i, i + batchSize);
        
        const { data, error } = await supabaseAdmin
          .from('recurring_tasks')
          .upsert(batch, { 
            onConflict: 'recurring_client_id,routine_id,due_date',
            ignoreDuplicates: true 
          })
          .select();

        if (error) {
          console.error('Error inserting tasks batch:', error);
          // Continue with other batches
        } else if (data) {
          tasksCreated += data.length;
        }
      }
    }

    console.log(`Successfully created ${tasksCreated} new tasks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated tasks for ${daysAhead} days`,
        tasksCreated,
        totalClients: clients.length,
        totalRoutines: routines.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating recurring tasks:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
