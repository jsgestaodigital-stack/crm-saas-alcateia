import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-autentique-signature',
};

// Autentique webhook integration is disabled
// To re-enable, configure AUTENTIQUE_WEBHOOK_SECRET and restore the original implementation
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[autentique-webhook] Integration disabled');
  
  return new Response(
    JSON.stringify({ disabled: true, message: 'Autentique webhook is currently disabled' }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
