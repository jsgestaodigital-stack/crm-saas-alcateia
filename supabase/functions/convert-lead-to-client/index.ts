import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.88.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_CHECKLIST = [
  {
    id: "section-1",
    title: "📋 Onboarding",
    tasks: [
      { id: "task-1-1", label: "Briefing recebido", done: false },
      { id: "task-1-2", label: "Acesso GMN configurado", done: false },
      { id: "task-1-3", label: "Criar pasta Drive", done: false },
    ]
  },
  {
    id: "section-2",
    title: "⚙️ Otimização GMN",
    tasks: [
      { id: "task-2-1", label: "Informações básicas", done: false },
      { id: "task-2-2", label: "Categorias e serviços", done: false },
      { id: "task-2-3", label: "Fotos otimizadas", done: false },
      { id: "task-2-4", label: "Descrição com palavras-chave", done: false },
      { id: "task-2-5", label: "Horário de funcionamento", done: false },
      { id: "task-2-6", label: "Atributos preenchidos", done: false },
    ]
  },
  {
    id: "section-3",
    title: "✅ Finalização",
    tasks: [
      { id: "task-3-1", label: "Revisão final", done: false },
      { id: "task-3-2", label: "Entrega ao cliente", done: false },
      { id: "task-3-3", label: "Feedback coletado", done: false },
    ]
  }
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get the user from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin client (service role for bypassing RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to verify auth and get user info
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Verify user has sales access
    const { data: canSales } = await supabaseAdmin.rpc('can_access_sales', { _user_id: user.id });
    const { data: canAdmin } = await supabaseAdmin.rpc('can_access_admin', { _user_id: user.id });
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });

    if (!canSales && !canAdmin && !isAdmin) {
      console.error('User does not have sales access:', user.id);
      return new Response(JSON.stringify({ error: 'Access denied - Sales permission required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { leadId, planType } = await req.json();

    if (!leadId || !planType) {
      return new Response(JSON.stringify({ error: 'leadId and planType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Converting lead:', leadId, 'to plan:', planType);

    // 1. Fetch the lead
    const { data: lead, error: leadFetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadFetchError || !lead) {
      console.error('Lead fetch error:', leadFetchError);
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If already converted, return existing client (idempotent)
    if (lead.converted_client_id) {
      console.log('Lead already converted, returning existing client:', lead.converted_client_id);
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', lead.converted_client_id)
        .single();
      
      return new Response(JSON.stringify({ 
        success: true, 
        client: existingClient,
        message: 'Lead já foi convertido anteriormente',
        alreadyConverted: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate lead status - cannot convert lost leads
    if (lead.status === 'lost') {
      console.error('Cannot convert lost lead:', leadId);
      return new Response(JSON.stringify({ error: 'Não é possível converter um lead perdido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create the client (using service role to bypass RLS)
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        company_name: lead.company_name,
        city: lead.city || null,
        main_category: lead.main_category || null,
        notes: lead.notes || null,
        whatsapp_link: lead.whatsapp || null,
        responsible: 'Amanda',
        plan_type: planType,
        status: 'on_track',
        column_id: 'onboarding',
        checklist: DEFAULT_CHECKLIST,
        comparisons: [],
        history: [],
      })
      .select()
      .single();

    if (clientError) {
      console.error('Client creation error:', clientError);
      return new Response(JSON.stringify({ error: 'Failed to create client', details: clientError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Client created:', client.id);

    // 3. If recurring plan, also create recurring_client
    if (planType === 'recurring') {
      const variants = ['A', 'B', 'C', 'D'];
      const randomVariant = variants[Math.floor(Math.random() * variants.length)];

      const { error: recurringError } = await supabaseAdmin
        .from('recurring_clients')
        .insert({
          client_id: client.id,
          company_name: lead.company_name,
          responsible_name: 'Amanda',
          responsible_user_id: user.id,
          schedule_variant: randomVariant,
          status: 'active',
        });

      if (recurringError) {
        console.error('Recurring client creation error:', recurringError);
        // Don't fail the whole operation, just log the error
      } else {
        console.log('Recurring client created for:', client.id);
      }
    }

    // 4. Update the lead with conversion info
    const { error: leadUpdateError } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'gained',
        pipeline_stage: 'gained',
        converted_client_id: client.id,
        converted_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (leadUpdateError) {
      console.error('Lead update error:', leadUpdateError);
      // Rollback: delete the client
      await supabaseAdmin.from('clients').delete().eq('id', client.id);
      return new Response(JSON.stringify({ error: 'Failed to update lead', details: leadUpdateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Get user name for activity
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.email || 'Usuário';

    // 6. Add activity to lead
    await supabaseAdmin
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        type: 'note',
        content: `✅ Lead convertido em Cliente! Plano: ${planType === 'unique' ? 'Único' : 'Recorrente'}${planType === 'recurring' ? ' - Cliente será gerenciado na Recorrência' : ''}`,
        created_by: user.id,
        created_by_name: userName,
      });

    console.log('Conversion complete for lead:', leadId, '-> client:', client.id);

    return new Response(JSON.stringify({ 
      success: true, 
      client,
      message: `Lead convertido em cliente com sucesso` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in convert-lead-to-client:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
