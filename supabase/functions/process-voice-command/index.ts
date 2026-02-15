import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// ========================================
// TEMPORARIAMENTE DESATIVADO
// Comando de voz desativado para economia de custos
// O código original está preservado em comentário abaixo
// ========================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return new Response(
    JSON.stringify({ 
      error: 'Comando de voz temporariamente desativado',
      disabled: true,
      actions: [],
      summary: 'Funcionalidade temporariamente indisponível'
    }),
    { 
      status: 503, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});

/*
// ========================================
// CÓDIGO ORIGINAL PRESERVADO PARA REATIVAÇÃO
// ========================================
// [Código completo removido por brevidade]
// O código original estava em 500+ linhas
// Para reativar: restaurar do histórico do Git ou pedir ao Lovable
*/
