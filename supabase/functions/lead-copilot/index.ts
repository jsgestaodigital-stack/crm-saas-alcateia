import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// Input validation
const VALID_TYPES = ['summary', 'suggestion', 'chat', 'analysis'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 2000;

interface CopilotInput {
  leadId: string;
  type: "summary" | "suggestion" | "chat" | "analysis";
  userMessage?: string;
}

function validateInput(data: unknown): { valid: true; data: CopilotInput } | { valid: false; error: string } {
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

  // Validate type (required, must be valid enum)
  if (!input.type || typeof input.type !== 'string') {
    return { valid: false, error: 'type is required' };
  }
  if (!VALID_TYPES.includes(input.type)) {
    return { valid: false, error: 'Invalid type. Must be: summary, suggestion, chat, or analysis' };
  }

  // Validate userMessage for chat type
  if (input.type === 'chat') {
    if (!input.userMessage || typeof input.userMessage !== 'string') {
      return { valid: false, error: 'userMessage is required for chat type' };
    }
    if (input.userMessage.trim().length === 0) {
      return { valid: false, error: 'userMessage cannot be empty' };
    }
  }

  // Validate userMessage length if provided
  if (input.userMessage !== undefined) {
    if (typeof input.userMessage !== 'string' || input.userMessage.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `userMessage must be under ${MAX_MESSAGE_LENGTH} characters` };
    }
  }

  return {
    valid: true,
    data: {
      leadId: input.leadId,
      type: input.type as CopilotInput['type'],
      userMessage: input.userMessage as string | undefined,
    }
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
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

    const { leadId, type, userMessage } = validation.data;
    
    console.log(`[lead-copilot] Processing ${type} for lead ${leadId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("[lead-copilot] Lead not found");
      return new Response(
        JSON.stringify({ error: "Lead não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt based on type
    let systemPrompt = "";
    let userPrompt = "";

    if (type === "summary") {
      systemPrompt = `Você é um assistente de vendas especializado em análise de leads. 
Gere um resumo executivo conciso e objetivo do lead, destacando:
- Pontos principais de contato
- Potencial de conversão
- Informações relevantes para o time comercial
Seja direto e use no máximo 150 palavras.`;

      userPrompt = `Analise e resuma este lead:
Empresa: ${lead.company_name || "N/A"}
Contato: ${lead.contact_name || "N/A"}
Email: ${lead.email || "N/A"}
Telefone: ${lead.phone || "N/A"}
WhatsApp: ${lead.whatsapp || "N/A"}
Cidade: ${lead.city || "N/A"}
Categoria: ${lead.main_category || "N/A"}
Temperatura: ${lead.temperature || "cold"}
Estágio no Funil: ${lead.pipeline_stage || "cold"}
Valor Estimado: ${lead.estimated_value ? `R$ ${lead.estimated_value}` : "N/A"}
Notas: ${lead.notes || "Sem notas"}`;

    } else if (type === "suggestion") {
      // Fetch recent activities and messages
      const { data: activities } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: messages } = await supabase
        .from("lead_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(10);

      systemPrompt = `Você é um consultor de vendas experiente.
Analise o histórico do lead e sugira a PRÓXIMA MELHOR AÇÃO para avançar este lead no funil.
Seja específico e prático. Inclua:
- Ação recomendada (ex: ligar, enviar proposta, agendar reunião)
- Timing sugerido
- Argumentos ou pontos a abordar
Use no máximo 100 palavras.`;

      let historyText = "";
      if (activities && activities.length > 0) {
        historyText += "\n\nÚltimas Atividades:\n";
        activities.forEach((a: Record<string, unknown>) => {
          historyText += `- [${a.type}] ${a.content}\n`;
        });
      }
      if (messages && messages.length > 0) {
        historyText += "\n\nÚltimas Mensagens:\n";
        messages.forEach((m: Record<string, unknown>) => {
          historyText += `- ${m.user_name}: ${m.message}\n`;
        });
      }

      userPrompt = `Lead: ${lead.company_name}
Contato: ${lead.contact_name || "N/A"}
Temperatura: ${lead.temperature || "cold"}
Estágio: ${lead.pipeline_stage || "cold"}
Próxima Ação Planejada: ${lead.next_action || "Nenhuma"}
Data Próxima Ação: ${lead.next_action_date || "N/A"}
${historyText}

Qual a próxima melhor ação para este lead?`;

    } else if (type === "analysis") {
      systemPrompt = `Você é um analista de vendas especializado em qualificação de leads.
Analise o lead e forneça:
1. Score de qualificação (0-100)
2. Pontos fortes
3. Pontos de atenção
4. Probabilidade de conversão
5. Recomendação geral
Seja objetivo e use no máximo 200 palavras.`;

      userPrompt = `Analise a qualidade deste lead:
Empresa: ${lead.company_name}
Contato: ${lead.contact_name || "Não informado"}
Email: ${lead.email || "Não informado"}
Telefone: ${lead.phone || "Não informado"}
Cidade: ${lead.city || "Não informado"}
Categoria: ${lead.main_category || "Não informado"}
Temperatura atual: ${lead.temperature || "cold"}
Estágio: ${lead.pipeline_stage || "cold"}
Valor Estimado: ${lead.estimated_value ? `R$ ${lead.estimated_value}` : "Não informado"}
Notas: ${lead.notes || "Sem notas"}`;

    } else if (type === "chat" && userMessage) {
      systemPrompt = `Você é um assistente de vendas inteligente chamado Copiloto.
Responda perguntas sobre o lead de forma clara e útil.
Use as informações disponíveis para dar respostas contextualizadas.
Seja conciso e profissional.`;

      userPrompt = `Contexto do Lead:
Empresa: ${lead.company_name}
Contato: ${lead.contact_name || "N/A"}
Temperatura: ${lead.temperature || "cold"}
Estágio: ${lead.pipeline_stage || "cold"}

Pergunta do usuário: ${userMessage}`;
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[lead-copilot] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de IA não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[lead-copilot] Calling AI Gateway for ${type}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error("[lead-copilot] AI Gateway error:", aiResponse.status);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "Sem resposta da IA";
    const tokensUsed = aiData.usage?.total_tokens || null;

    console.log(`[lead-copilot] AI response received, tokens: ${tokensUsed}`);

    // Save interaction to database
    const { error: saveError } = await supabase
      .from("lead_ai_interactions")
      .insert({
        lead_id: leadId,
        agency_id: lead.agency_id,
        user_id: userId,
        interaction_type: type,
        prompt: userPrompt,
        ai_response: aiContent,
        model: "google/gemini-2.5-flash",
        tokens_used: tokensUsed,
        metadata: { system_prompt: systemPrompt },
      });

    if (saveError) {
      console.error("[lead-copilot] Error saving interaction (non-fatal)");
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        response: aiContent,
        tokensUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[lead-copilot] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro inesperado. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
