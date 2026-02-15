import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.88.0';
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// Input validation
const VALID_PLAN_TYPES = ['unique', 'recurring'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ConvertInput {
  leadId: string;
  planType: string;
}

function validateInput(data: unknown): { valid: true; data: ConvertInput } | { valid: false; error: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid request body' };
  }

  const input = data as Record<string, unknown>;

  // Validate leadId (required, must be UUID)
  if (!input.leadId || typeof input.leadId !== 'string') {
    return { valid: false, error: 'leadId is required' };
  }
  if (!UUID_REGEX.test(input.leadId)) {
    return { valid: false, error: 'leadId must be a valid UUID' };
  }

  // Validate planType (required, must be valid enum)
  if (!input.planType || typeof input.planType !== 'string') {
    return { valid: false, error: 'planType is required' };
  }
  if (!VALID_PLAN_TYPES.includes(input.planType)) {
    return { valid: false, error: 'planType must be "unique" or "recurring"' };
  }

  return {
    valid: true,
    data: {
      leadId: input.leadId,
      planType: input.planType,
    }
  };
}

// DEFAULT CHECKLIST - Must match frontend structure in src/types/client.ts
// Uses 'items' with 'completed' (not 'tasks' with 'done')
const DEFAULT_CHECKLIST = [
  {
    id: "etapa1",
    title: "1. Onboarding",
    items: [
      { id: "1-1", title: "Fechar venda e criar grupo de comunicação com cliente", completed: false, responsible: "Admin" },
      { id: "1-2", title: "Alterar foto do grupo para foto padrão da agência", completed: false, responsible: "Admin" },
      { id: "1-3", title: "Dar boas vindas no grupo e se deixar à disposição", completed: false, responsible: "Operador" },
      { id: "1-4", title: "Agendar reunião de briefing (até 48h)", completed: false, responsible: "Operador" },
    ],
  },
  {
    id: "etapa2",
    title: "2. Preparação",
    items: [
      { id: "2-1", title: "Criar ou obter conta de e-mail para o cliente", completed: false, responsible: "Operador" },
      { id: "2-2", title: "Criar pasta do cliente no armazenamento em nuvem", completed: false, responsible: "Operador" },
      { id: "2-3", title: "Configurar ferramentas de IA para o projeto", completed: false, responsible: "Operador" },
      { id: "2-4", title: "Registrar métricas ANTES da execução", completed: false, responsible: "Operador" },
      { id: "2-5", title: "Realizar briefing + pegar propriedade do Perfil", completed: false, responsible: "Operador" },
    ],
  },
  {
    id: "etapa3",
    title: "3. Otimização",
    items: [
      { id: "3-1", title: "Atualizar informações principais do cliente no Perfil", completed: false, responsible: "Operador" },
      { id: "3-2", title: "Subir fotos com palavras-chave e geolocalização", completed: false, responsible: "Operador" },
      { id: "3-3", title: "Criar e subir postagens no Perfil", completed: false, responsible: "Operador" },
      { id: "3-4", title: "Responder avaliações usando palavras-chave", completed: false, responsible: "Operador" },
    ],
  },
  {
    id: "etapa4",
    title: "4. Entrega",
    items: [
      { id: "4-1", title: "Registrar métricas DEPOIS da execução", completed: false, responsible: "Operador" },
      { id: "4-2", title: "Criar relatório de entrega comparando ANTES x DEPOIS", completed: false, responsible: "Operador" },
      { id: "4-3", title: "Entregar com apresentação do resultado", completed: false, responsible: "Operador" },
      { id: "4-4", title: "💰 Pagar comissão da equipe", completed: false, responsible: "Admin" },
    ],
  },
];

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get the user from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('[convert-lead-to-client] No authorization header');
      return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
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
      console.error('[convert-lead-to-client] User auth error');
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[convert-lead-to-client] User authenticated:', user.id);

    // Get user's current agency context
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('current_agency_id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.current_agency_id) {
      console.error('[convert-lead-to-client] User profile or agency not found:', user.id);
      return new Response(JSON.stringify({ error: 'Usuário sem agência associada' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userAgencyId = userProfile.current_agency_id;
    console.log('[convert-lead-to-client] User agency:', userAgencyId);

    // Verify user has sales access
    const { data: canSales } = await supabaseAdmin.rpc('can_access_sales', { _user_id: user.id });
    const { data: canAdmin } = await supabaseAdmin.rpc('can_access_admin', { _user_id: user.id });
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });

    if (!canSales && !canAdmin && !isAdmin) {
      console.error('[convert-lead-to-client] User does not have sales access:', user.id);
      return new Response(JSON.stringify({ error: 'Acesso negado. Permissão de vendas necessária.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Corpo da requisição inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validation = validateInput(rawInput);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { leadId, planType } = validation.data;

    console.log('[convert-lead-to-client] Converting lead:', leadId, 'to plan:', planType);

    // 1. Fetch the lead
    const { data: lead, error: leadFetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadFetchError || !lead) {
      console.error('[convert-lead-to-client] Lead fetch error');
      return new Response(JSON.stringify({ error: 'Lead não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Verify user belongs to the same agency as the lead (multi-tenant isolation)
    if (lead.agency_id !== userAgencyId) {
      console.error('[convert-lead-to-client] Agency mismatch! User agency:', userAgencyId, 'Lead agency:', lead.agency_id);
      return new Response(JSON.stringify({ error: 'Acesso negado. Lead pertence a outra agência.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If already converted, return existing client (idempotent)
    if (lead.converted_client_id) {
      console.log('[convert-lead-to-client] Lead already converted, returning existing client:', lead.converted_client_id);
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
      console.error('[convert-lead-to-client] Cannot convert lost lead:', leadId);
      return new Response(JSON.stringify({ error: 'Não é possível converter um lead perdido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create the client (using service role to bypass RLS)
    // IMPORTANT: Must include agency_id from the lead to maintain multi-tenant isolation
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        agency_id: lead.agency_id, // Critical: inherit agency from lead
        company_name: lead.company_name,
        city: lead.city || null,
        main_category: lead.main_category || null,
        notes: lead.notes || null,
        whatsapp_link: lead.whatsapp || null,
        responsible: userProfile?.full_name || 'Equipe',
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
      console.error('[convert-lead-to-client] Client creation error');
      return new Response(JSON.stringify({ error: 'Erro ao criar cliente. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[convert-lead-to-client] Client created:', client.id);

    // 3. If recurring plan, also create recurring_client
    if (planType === 'recurring') {
      const variants = ['A', 'B', 'C', 'D'];
      const randomVariant = variants[Math.floor(Math.random() * variants.length)];

      const { error: recurringError } = await supabaseAdmin
        .from('recurring_clients')
        .insert({
          agency_id: lead.agency_id, // Critical: inherit agency from lead
          client_id: client.id,
          company_name: lead.company_name,
          responsible_name: userProfile?.full_name || 'Equipe',
          responsible_user_id: user.id,
          schedule_variant: randomVariant,
          status: 'active',
        });

      if (recurringError) {
        console.error('[convert-lead-to-client] Recurring client creation error:', recurringError.message);
        // Rollback: delete the client since recurring was requested but failed
        await supabaseAdmin.from('clients').delete().eq('id', client.id);
        return new Response(JSON.stringify({ error: 'Erro ao criar cliente recorrente. Tente novamente.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log('[convert-lead-to-client] Recurring client created for:', client.id);
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
      console.error('[convert-lead-to-client] Lead update error');
      // Rollback: delete the client
      await supabaseAdmin.from('clients').delete().eq('id', client.id);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar lead. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Use already fetched user name for activity
    const userName = userProfile?.full_name || user.email || 'Usuário';

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

    console.log('[convert-lead-to-client] Conversion complete for lead:', leadId, '-> client:', client.id);

    return new Response(JSON.stringify({ 
      success: true, 
      client,
      message: `Lead convertido em cliente com sucesso` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[convert-lead-to-client] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Erro inesperado. Tente novamente.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
