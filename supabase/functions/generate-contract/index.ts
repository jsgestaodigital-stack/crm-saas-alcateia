import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
interface ContractInput {
  contractType: string;
  clientName?: string;
  companyName?: string;
  city?: string;
  services?: string;
  customPrompt?: string;
}

const VALID_CONTRACT_TYPES = ['single_optimization', 'recurring'];

function validateInput(data: unknown): { valid: true; data: ContractInput } | { valid: false; error: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid request body' };
  }

  const input = data as Record<string, unknown>;

  // Validate contractType (required)
  if (!input.contractType || typeof input.contractType !== 'string') {
    return { valid: false, error: 'contractType is required' };
  }
  if (!VALID_CONTRACT_TYPES.includes(input.contractType)) {
    return { valid: false, error: 'Invalid contract type' };
  }

  // Validate optional strings with length limits
  if (input.clientName !== undefined && (typeof input.clientName !== 'string' || input.clientName.length > 200)) {
    return { valid: false, error: 'clientName must be under 200 characters' };
  }
  if (input.companyName !== undefined && (typeof input.companyName !== 'string' || input.companyName.length > 200)) {
    return { valid: false, error: 'companyName must be under 200 characters' };
  }
  if (input.city !== undefined && (typeof input.city !== 'string' || input.city.length > 100)) {
    return { valid: false, error: 'city must be under 100 characters' };
  }
  if (input.services !== undefined && (typeof input.services !== 'string' || input.services.length > 1000)) {
    return { valid: false, error: 'services must be under 1000 characters' };
  }
  if (input.customPrompt !== undefined && (typeof input.customPrompt !== 'string' || input.customPrompt.length > 2000)) {
    return { valid: false, error: 'customPrompt must be under 2000 characters' };
  }

  return {
    valid: true,
    data: {
      contractType: input.contractType as string,
      clientName: input.clientName as string | undefined,
      companyName: input.companyName as string | undefined,
      city: input.city as string | undefined,
      services: input.services as string | undefined,
      customPrompt: input.customPrompt as string | undefined,
    }
  };
}

const SYSTEM_PROMPT = `Você é um especialista em criação de contratos profissionais para agências de marketing digital especializadas em Google Meu Negócio e SEO local.

Seu objetivo é gerar cláusulas de contrato personalizadas, juridicamente válidas e com linguagem clara e profissional.

REGRAS IMPORTANTES:
1. Gere cláusulas em português brasileiro formal
2. Use linguagem acessível mas profissional
3. Mantenha consistência jurídica
4. Inclua proteção para ambas as partes
5. Siga a estrutura LGPD quando aplicável
6. Use variáveis no formato {{variavel}} para dados dinâmicos

TIPOS DE CONTRATO:
- single_optimization: Otimização única com começo, meio e fim (prazo de 30-60 dias)
- recurring: Gestão contínua mensal com renovação automática ou não

VARIÁVEIS DISPONÍVEIS:
{{nome_empresa}}, {{cnpj}}, {{cpf}}, {{email}}, {{endereco}}, {{responsavel}}, {{telefone}}, {{data}}, {{valor}}, {{valor_desconto}}, {{parcelas}}, {{valor_parcela}}, {{prazo_execucao}}, {{cidade}}, {{agencia_nome}}, {{agencia_cnpj}}, {{agencia_endereco}}, {{agencia_responsavel}}, {{periodicidade}}, {{prazo_aviso_previo}}

Para OTIMIZAÇÃO ÚNICA:
- Foco em projeto fechado com entregas específicas
- Prazo definido de execução
- Sem recorrência ou mensalidade
- Cláusula de não reembolso após início

Para RECORRÊNCIA:
- Foco em gestão contínua
- Cobrança mensal/semestral/anual
- Cláusula de renovação
- Política de cancelamento com aviso prévio`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
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

    const { contractType, clientName, companyName, city, services, customPrompt } = validation.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[generate-contract] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Gere cláusulas de contrato para:
- Tipo: ${contractType === 'recurring' ? 'Gestão Contínua (Recorrência)' : 'Otimização Única'}
- Cliente: ${clientName || companyName || 'N/A'}
- Empresa: ${companyName || 'N/A'}
- Cidade: ${city || 'não informada'}
- Serviços: ${services || 'Otimização de Perfil no Google'}

${customPrompt ? `Instruções adicionais: ${customPrompt}` : ''}

Retorne um JSON com a seguinte estrutura:
{
  "clauses": [
    {
      "id": "identificador_unico",
      "type": "tipo_clausula",
      "title": "Título da Cláusula",
      "content": "Conteúdo da cláusula com {{variaveis}}",
      "order": 1,
      "isRequired": true,
      "isHidden": false,
      "isEditable": true
    }
  ],
  "suggestedTitle": "Título sugerido para o contrato",
  "suggestedTermDays": 30
}

Tipos de cláusula válidos: parties, lgpd, object, scope, execution_term, investment, obligations_contractor, obligations_contracted, liability_limits, rescission, confidentiality, forum, signatures, recurring_terms

IMPORTANTE: Retorne APENAS o JSON, sem markdown ou texto adicional.`;

    console.log("[generate-contract] Generating contract with Lovable AI...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[generate-contract] Lovable AI error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao gerar contrato. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[generate-contract] No content in AI response");
      return new Response(
        JSON.stringify({ error: "Erro ao gerar contrato. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-contract] AI response received, parsing...");

    // Parse the JSON from the response
    let parsedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error("[generate-contract] Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-contract] Contract generated successfully");

    return new Response(
      JSON.stringify({
        clauses: parsedContent.clauses || [],
        suggestedTitle: parsedContent.suggestedTitle || `Contrato - ${companyName || 'Cliente'}`,
        suggestedTermDays: parsedContent.suggestedTermDays || 30,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-contract] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro inesperado. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
