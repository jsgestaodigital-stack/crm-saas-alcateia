import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// Input validation
const MAX_TRANSCRIPTION_LENGTH = 100000; // ~100KB of text
const MAX_LEAD_NAME_LENGTH = 200;

interface RaioXInput {
  transcription: string;
  leadName?: string;
}

function validateInput(data: unknown): { valid: true; data: RaioXInput } | { valid: false; error: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid request body' };
  }

  const input = data as Record<string, unknown>;

  // Validate transcription (required)
  if (!input.transcription || typeof input.transcription !== 'string') {
    return { valid: false, error: 'Transcrição é obrigatória' };
  }
  if (input.transcription.trim().length === 0) {
    return { valid: false, error: 'Transcrição não pode estar vazia' };
  }
  if (input.transcription.length > MAX_TRANSCRIPTION_LENGTH) {
    return { valid: false, error: `Transcrição muito longa. Máximo: ${MAX_TRANSCRIPTION_LENGTH} caracteres` };
  }

  // Validate leadName (optional)
  if (input.leadName !== undefined) {
    if (typeof input.leadName !== 'string' || input.leadName.length > MAX_LEAD_NAME_LENGTH) {
      return { valid: false, error: 'Nome do lead deve ter no máximo 200 caracteres' };
    }
  }

  return {
    valid: true,
    data: {
      transcription: input.transcription.trim(),
      leadName: input.leadName as string | undefined,
    }
  };
}

const SYSTEM_PROMPT = `Atue como um consultor especialista em vendas consultivas, psicologia do consumidor e marketing digital com foco em tráfego orgânico e SEO local para negócios físicos.

Você tem 20 anos de campo ajudando agências e consultores a venderem serviços de Google Meu Negócio, SEO local e presença digital para negócios locais como restaurantes, salões, clínicas, pet shops e comércios de bairro.

Seu papel agora é analisar uma reunião de vendas gravada entre um consultor e um possível cliente, a partir da transcrição completa da conversa (que vou colar em seguida). Sua missão é destrinchar os elementos estratégicos da conversa e entregar um diagnóstico prático, direto, com sugestões que ajudem o consultor a:

🎯 OBJETIVOS:

Entender como o cliente pensa: captar emoções, crenças, medos e desejos — mesmo os que ele não disse claramente.

Encontrar brechas e oportunidades escondidas nas falas dele.

Mostrar como personalizar a proposta de acordo com a realidade da empresa e com o que ele falou na reunião.

Criar um roteiro de follow-up inteligente e estratégico com base no nível de consciência do cliente.

Sugerir argumentos com gatilhos mentais (autoridade, escassez, prova social, reciprocidade, segurança, exclusividade).

Apontar erros cometidos na reunião que não devem se repetir com esse perfil de cliente.

Oferecer um plano de ação simples e tático pra transformar esse papo em contrato fechado.

📑 FORMATO DA SUA RESPOSTA:

1. Diagnóstico do Cliente

Situação atual percebida

Dores e preocupações mais citadas

Sonhos e desejos revelados

Medos e crenças limitantes

Possíveis objeções (implícitas ou ditas claramente)

2. Sinais de Interesse

Frases que mostraram abertura

Ponto exato em que rolou conexão emocional

Gatilhos mentais que bateram melhor nessa conversa

3. Argumentos recomendados para o pitch final

Direto da fala do cliente

Personalizados com técnicas de venda consultiva

Linguagem simples, próxima, sem enrolar

4. Sugestão de Roteiro para Follow-up

Texto modelo para WhatsApp, e-mail ou ligação

Tom: consultivo e empático (como quem quer ajudar de verdade)

Próximos passos sugeridos

5. Plano de Ação Final

O que o consultor precisa resolver antes do próximo contato

Pontos que precisam ser reforçados

Formas de gerar urgência e compromisso (sem pressão forçada)

6. Se for gerar slides com base nessa reunião, siga essa estrutura:

(Use isso apenas se for solicitado)

Slide 1: Visão geral do mercado e dos desafios do cliente

Slide 2: Situação atual da empresa com base na reunião

Slide 3: Oportunidades encontradas

Slide 4: Solução proposta com benefícios claros

Slide 5: Riscos de não agir agora

Slide 6: Plano de ação sugerido com próximos passos

Slide 7: Provas (depoimentos ou cases reais, se tiver)

Slide 8: CTA final com frase de impacto e os principais motivos pra ele fechar agora

✅ Instruções finais:

Fale direto, sem rodeio.

Use uma linguagem simples, fácil de entender, mas sem perder a autoridade.

Organize por blocos com títulos destacados.

Nada de parágrafos gigantes ou frases soltas demais.

Sempre entregue valor prático que o consultor pode usar agora.`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[analyze-raiox] Request from user: ${user.id}`);

    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateInput(rawInput);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { transcription, leadName } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-raiox] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de IA não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = leadName 
      ? `Analise a seguinte transcrição de reunião de vendas com o lead "${leadName}":\n\n${transcription}`
      : `Analise a seguinte transcrição de reunião de vendas:\n\n${transcription}`;

    console.log("[analyze-raiox] Calling Lovable AI for analysis...");
    console.log("[analyze-raiox] Transcription length:", transcription.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("[analyze-raiox] AI Gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar análise. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysisContent = data.choices?.[0]?.message?.content;

    if (!analysisContent) {
      console.error("[analyze-raiox] No content in AI response");
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-raiox] Analysis completed successfully");

    return new Response(
      JSON.stringify({ analysis: analysisContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-raiox] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro inesperado. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
