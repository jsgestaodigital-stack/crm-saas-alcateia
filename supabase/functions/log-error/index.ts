import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorLogPayload {
  error_type: string;
  error_message: string;
  error_stack?: string;
  component?: string;
  route?: string;
  browser?: string;
  device?: string;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warn' | 'error' | 'critical';
  agency_id?: string;
  user_id?: string;
  user_email?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ErrorLogPayload = await req.json();
    console.log('[log-error] Received error log:', {
      type: payload.error_type,
      message: payload.error_message?.substring(0, 100),
      severity: payload.severity,
      route: payload.route,
    });

    // Validate required fields
    if (!payload.error_type || !payload.error_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: error_type, error_message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert error log
    const { data, error } = await supabase
      .from('system_health_logs')
      .insert({
        agency_id: payload.agency_id || null,
        user_id: payload.user_id || null,
        user_email: payload.user_email || null,
        error_type: payload.error_type,
        error_message: payload.error_message.substring(0, 2000), // Limit message size
        error_stack: payload.error_stack?.substring(0, 5000) || null,
        component: payload.component || null,
        route: payload.route || null,
        browser: payload.browser || null,
        device: payload.device || null,
        metadata: payload.metadata || {},
        severity: payload.severity || 'error',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[log-error] Failed to insert log:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[log-error] Error logged successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[log-error] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
