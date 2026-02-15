import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// Autentique integration is disabled
// To re-enable, configure AUTENTIQUE_TOKEN and restore the original implementation
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  console.log('[send-to-autentique] Integration disabled');
  
  return new Response(
    JSON.stringify({ disabled: true, message: 'Autentique integration is currently disabled' }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
