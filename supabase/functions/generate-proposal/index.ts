import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// Input validation schema
interface ProposalInput {
  leadId?: string;
  clientName?: string;
  companyName?: string;
  city?: string;
  category?: string;
  keywords?: string;
  customPrompt?: string;
}

function validateInput(data: unknown): { valid: true; data: ProposalInput } | { valid: false; error: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid request body' };
  }

  const input = data as Record<string, unknown>;

  // Validate optional strings with length limits
  if (input.leadId !== undefined && (typeof input.leadId !== 'string' || input.leadId.length > 50)) {
    return { valid: false, error: 'leadId must be a valid string' };
  }
  if (input.clientName !== undefined && (typeof input.clientName !== 'string' || input.clientName.length > 200)) {
    return { valid: false, error: 'clientName must be under 200 characters' };
  }
  if (input.companyName !== undefined && (typeof input.companyName !== 'string' || input.companyName.length > 200)) {
    return { valid: false, error: 'companyName must be under 200 characters' };
  }
  if (input.city !== undefined && (typeof input.city !== 'string' || input.city.length > 100)) {
    return { valid: false, error: 'city must be under 100 characters' };
  }
  if (input.category !== undefined && (typeof input.category !== 'string' || input.category.length > 100)) {
    return { valid: false, error: 'category must be under 100 characters' };
  }
  if (input.keywords !== undefined && (typeof input.keywords !== 'string' || input.keywords.length > 500)) {
    return { valid: false, error: 'keywords must be under 500 characters' };
  }
  if (input.customPrompt !== undefined && (typeof input.customPrompt !== 'string' || input.customPrompt.length > 2000)) {
    return { valid: false, error: 'customPrompt must be under 2000 characters' };
  }

  return {
    valid: true,
    data: {
      leadId: input.leadId as string | undefined,
      clientName: input.clientName as string | undefined,
      companyName: input.companyName as string | undefined,
      city: input.city as string | undefined,
      category: input.category as string | undefined,
      keywords: input.keywords as string | undefined,
      customPrompt: input.customPrompt as string | undefined,
    }
  };
}

const SYSTEM_PROMPT = `Você é um especialista em criar propostas comerciais persuasivas para agências de marketing digital focadas em SEO local e Google Meu Negócio.

Seu objetivo é gerar propostas profissionais, personalizadas e convincentes baseadas nas informações do cliente.

ESTRUTURA DA PROPOSTA:
1. Diagnóstico: Identifique o problema atual do cliente (posição no Google, concorrência, visibilidade)
2. Objetivo: O que vamos alcançar para o cliente
3. Escopo: Lista de entregas e serviços inclusos
4. Investimento: Valor e condições (deixar para o usuário preencher se não fornecido)
5. Cronograma: Prazos de execução
6. Garantia: Diferenciais e segurança para o cliente

REGRAS:
- Use variáveis entre {{chaves_duplas}} para dados dinâmicos: {{nome_empresa}}, {{cidade}}, {{palavras_chave}}, {{nome_cliente}}
- Seja persuasivo mas honesto
- Use emojis estratégicos para destacar seções
- Mantenha tom profissional mas acessível
- Foque em resultados e benefícios para o cliente

Retorne a proposta em formato JSON com a seguinte estrutura:
{
  "blocks": [
    {
      "type": "diagnosis" | "objective" | "scope" | "investment" | "timeline" | "guarantee" | "custom",
      "title": "Título da seção com emoji",
      "content": "Conteúdo em markdown",
      "checklist": ["item1", "item2"] // apenas para scope
    }
  ],
  "variables": {
    "nome_empresa": "valor",
    "cidade": "valor",
    "palavras_chave": "valor"
  }
}`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validation = validateInput(rawInput);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { leadId, clientName, companyName, city, category, keywords, customPrompt } = validation.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT
    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = authData.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_agency_id')
      .eq('id', userId)
      .single();
    const userAgencyId = profile?.current_agency_id;
    if (!userAgencyId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context for AI — scope lead lookup to caller's agency
    let leadContext = '';
    if (leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('agency_id', userAgencyId)
        .single();
      
      if (lead) {
        leadContext = `
DADOS DO LEAD:
- Empresa: ${lead.company_name}
- Contato: ${lead.contact_name || 'Não informado'}
- Cidade: ${lead.city || 'Não informada'}
- Categoria: ${lead.main_category || 'Não informada'}
- Valor estimado: R$ ${lead.estimated_value || 'Não informado'}
- Observações: ${lead.notes || 'Nenhuma'}
`;
      }
    }

    const userPrompt = `
${leadContext}

INFORMAÇÕES ADICIONAIS:
- Nome do cliente: ${clientName || '{{nome_cliente}}'}
- Empresa: ${companyName || '{{nome_empresa}}'}
- Cidade: ${city || '{{cidade}}'}
- Categoria/Nicho: ${category || '{{categoria}}'}
- Palavras-chave para SEO: ${keywords || category || '{{palavras_chave}}'}

${customPrompt ? `INSTRUÇÕES ESPECÍFICAS DO USUÁRIO:\n${customPrompt}` : ''}

Gere uma proposta comercial completa e persuasiva para este cliente, focando em SEO local e Google Meu Negócio.
Use as palavras-chave fornecidas nos textos de diagnóstico e objetivo para personalizar a proposta.
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[generate-proposal] LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[generate-proposal] Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('[generate-proposal] AI Gateway error:', response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to generate proposal. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error('[generate-proposal] No content returned from AI');
      return new Response(JSON.stringify({ error: 'Failed to generate proposal. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[generate-proposal] AI response received, parsing...');

    // Parse JSON from AI response
    let proposalData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        proposalData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[generate-proposal] Failed to parse AI response:', parseError);
      // Return a fallback structure
      proposalData = {
        blocks: [
          {
            type: 'diagnosis',
            title: '📌 Diagnóstico',
            content: aiContent,
          }
        ],
        variables: {
          nome_empresa: companyName || '',
          cidade: city || '',
          palavras_chave: category || '',
        }
      };
    }

    // Add IDs and order to blocks
    const blocks = proposalData.blocks.map((block: Record<string, unknown>, index: number) => ({
      id: crypto.randomUUID(),
      type: block.type || 'custom',
      title: block.title,
      content: block.content || '',
      checklist: block.checklist,
      order: index + 1,
    }));

    return new Response(JSON.stringify({
      success: true,
      blocks,
      variables: proposalData.variables || {},
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-proposal] Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred. Please try again.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
