import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    
    console.log('[autentique-webhook] Received payload:', JSON.stringify(payload));

    const documentId = payload.document?.id || payload.data?.document?.id;
    const eventType = payload.event || payload.type;

    if (!documentId) {
      console.log('[autentique-webhook] No document ID found');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[autentique-webhook] Processing event: ${eventType} for document: ${documentId}`);

    // Find contract by Autentique document ID
    const { data: contract, error: findError } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('autentique_document_id', documentId)
      .single();

    if (findError || !contract) {
      console.log('[autentique-webhook] Contract not found for document:', documentId);
      return new Response(JSON.stringify({ received: true, found: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[autentique-webhook] Found contract: ${contract.id}`);

    // Map Autentique events to contract status
    let newStatus: string | null = null;
    let autentiqueStatus: string | null = null;

    switch (eventType) {
      case 'document.viewed':
        if (contract.status === 'sent') {
          newStatus = 'viewed';
        }
        autentiqueStatus = 'viewed';
        break;
      case 'document.signed':
      case 'document.finished':
        newStatus = 'signed';
        autentiqueStatus = 'signed';
        break;
      case 'document.cancelled':
        newStatus = 'cancelled';
        autentiqueStatus = 'cancelled';
        break;
      case 'document.expired':
        newStatus = 'expired';
        autentiqueStatus = 'expired';
        break;
      case 'signature.signed':
        // Individual signature - keep as viewed or update to signed if all signed
        autentiqueStatus = 'partial_signed';
        break;
      default:
        console.log(`[autentique-webhook] Unknown event type: ${eventType}`);
    }

    // Update contract
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (newStatus) {
      updateData.status = newStatus;
      if (newStatus === 'signed') {
        updateData.signed_at = new Date().toISOString();
      }
    }

    if (autentiqueStatus) {
      updateData.autentique_status = autentiqueStatus;
    }

    if (eventType === 'document.viewed' && contract.status === 'sent') {
      updateData.first_viewed_at = new Date().toISOString();
    }
    updateData.last_viewed_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contract.id);

    if (updateError) {
      console.error('[autentique-webhook] Update error:', updateError);
    }

    // Log event
    await supabase.from('contract_events').insert({
      contract_id: contract.id,
      event_type: `autentique.${eventType}`,
      payload: payload,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      user_agent: req.headers.get('user-agent')
    });

    console.log(`[autentique-webhook] Updated contract ${contract.id} with status ${newStatus || 'unchanged'}`);

    return new Response(JSON.stringify({ 
      success: true,
      contractId: contract.id,
      newStatus 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[autentique-webhook] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
