import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...params } = await req.json();
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log(`[security-check] Action: ${action}, IP: ${clientIp}`);

    switch (action) {
      case 'check_rate_limit': {
        // Verificar se email/IP está bloqueado por tentativas excessivas
        const { email } = params;
        
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase.rpc('check_login_rate_limit', {
          _email: email,
          _ip_address: clientIp !== 'unknown' ? clientIp : null
        });

        if (error) {
          console.error('[security-check] Rate limit check error:', error);
          return new Response(
            JSON.stringify({ error: 'Erro ao verificar rate limit' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'record_failed_login': {
        // Registrar tentativa de login falhada
        const { email } = params;
        
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase.rpc('record_failed_login', {
          _email: email,
          _ip_address: clientIp !== 'unknown' ? clientIp : null,
          _user_agent: userAgent
        });

        console.log(`[security-check] Recorded failed login for ${email}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_user_status': {
        // Verificar se usuário está bloqueado ou email não verificado
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Token inválido' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar se está bloqueado
        const { data: blockData } = await supabase.rpc('is_user_blocked', { _user_id: user.id });
        
        // Verificar email confirmado
        const emailConfirmed = user.email_confirmed_at !== null;

        return new Response(
          JSON.stringify({
            user_id: user.id,
            email: user.email,
            email_confirmed: emailConfirmed,
            blocked: blockData?.blocked || false,
            blocked_reason: blockData?.blocked_reason || null,
            blocked_at: blockData?.blocked_at || null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'log_login_success': {
        // Registrar login bem sucedido
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const token = authHeader.replace('Bearer ', '');
        const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { error } = await userSupabase.rpc('log_successful_login', {
          _ip_address: clientIp !== 'unknown' ? clientIp : null,
          _user_agent: userAgent,
          _location: params.location || null
        });

        if (error) {
          console.error('[security-check] Log login error:', error);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'invalidate_sessions': {
        // Invalidar todas as sessões de um usuário
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Usuário não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const targetUserId = params.user_id || user.id;

        const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { error } = await userSupabase.rpc('invalidate_all_sessions', { _user_id: targetUserId });

        if (error) {
          console.error('[security-check] Invalidate sessions error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'block_user': {
        // Bloquear usuário (apenas admins)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { user_id, reason } = params;
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const token = authHeader.replace('Bearer ', '');
        const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { error } = await userSupabase.rpc('block_user', { 
          _user_id: user_id, 
          _reason: reason || 'Bloqueado pelo administrador' 
        });

        if (error) {
          console.error('[security-check] Block user error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[security-check] User ${user_id} blocked`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unblock_user': {
        // Desbloquear usuário (apenas admins)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { user_id } = params;
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const token = authHeader.replace('Bearer ', '');
        const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { error } = await userSupabase.rpc('unblock_user', { _user_id: user_id });

        if (error) {
          console.error('[security-check] Unblock user error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[security-check] User ${user_id} unblocked`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[security-check] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
