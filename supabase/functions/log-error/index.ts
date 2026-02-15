import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

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

// Simple in-memory rate limiter (per isolate lifetime)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

// Cleanup old entries periodically to prevent memory leak
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Periodic cleanup
    if (Math.random() < 0.05) cleanupRateLimitMap();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Limit request body size
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 10_000) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: ErrorLogPayload = await req.json();

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
        error_type: payload.error_type.substring(0, 200),
        error_message: payload.error_message.substring(0, 2000),
        error_stack: payload.error_stack?.substring(0, 5000) || null,
        component: payload.component?.substring(0, 200) || null,
        route: payload.route?.substring(0, 500) || null,
        browser: payload.browser?.substring(0, 200) || null,
        device: payload.device?.substring(0, 200) || null,
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
