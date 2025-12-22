import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// TEMPORARIAMENTE DESATIVADO
// Comando de voz desativado para economia de custos
// O código original está preservado em comentário abaixo
// ========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
