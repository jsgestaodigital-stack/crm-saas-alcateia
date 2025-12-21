import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { leadId, clientName, companyName, city, category, keywords, customPrompt } = await req.json();

    // Build context for AI
    let leadContext = '';
    if (leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
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
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI to generate proposal...');

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
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content returned from AI');
    }

    console.log('AI response received, parsing...');

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
      console.error('Failed to parse AI response:', parseError);
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
    const blocks = proposalData.blocks.map((block: any, index: number) => ({
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
    console.error('Error in generate-proposal:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
