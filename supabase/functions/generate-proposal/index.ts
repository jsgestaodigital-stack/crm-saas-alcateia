import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateProposalRequest {
  leadId?: string;
  clientName: string;
  companyName: string;
  city?: string;
  category?: string;
  serviceType?: string;
  customPrompt?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: GenerateProposalRequest = await req.json();
    console.log('Generating proposal for:', requestData.companyName);

    const { clientName, companyName, city, category, serviceType, customPrompt, leadId } = requestData;

    // Build context from lead data if available
    let leadContext = '';
    if (leadId) {
      const { data: lead } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (lead) {
        leadContext = `
Informações do Lead:
- Empresa: ${lead.company_name}
- Contato: ${lead.contact_name || 'Não informado'}
- Cidade: ${lead.city || 'Não informada'}
- Categoria: ${lead.main_category || 'Não informada'}
- Valor estimado: ${lead.estimated_value ? `R$ ${lead.estimated_value}` : 'Não informado'}
- Notas: ${lead.notes || 'Nenhuma'}
`;
      }
    }

    const systemPrompt = `Você é um especialista em marketing digital e otimização de perfis no Google Meu Negócio.
Sua tarefa é gerar uma proposta comercial profissional, persuasiva e personalizada.

A proposta deve seguir esta estrutura em JSON:
{
  "blocks": [
    {
      "id": "diagnosis",
      "type": "diagnosis", 
      "title": "📌 Diagnóstico",
      "content": "texto do diagnóstico",
      "order": 1
    },
    {
      "id": "objective",
      "type": "objective",
      "title": "🎯 Objetivo", 
      "content": "texto do objetivo",
      "order": 2
    },
    {
      "id": "scope",
      "type": "scope",
      "title": "🔧 Escopo Estratégico",
      "content": "",
      "checklist": ["item1", "item2", ...],
      "order": 3
    },
    {
      "id": "investment",
      "type": "investment",
      "title": "💰 Investimento",
      "content": "",
      "order": 4
    },
    {
      "id": "timeline",
      "type": "timeline",
      "title": "📅 Cronograma",
      "content": "texto do cronograma",
      "order": 5
    },
    {
      "id": "guarantee",
      "type": "guarantee",
      "title": "🛡️ Garantia",
      "content": "texto da garantia",
      "order": 6
    }
  ],
  "suggestedPrice": number,
  "suggestedInstallments": number
}

Use variáveis como {{nome_empresa}}, {{cidade}}, {{palavras_chave}} no texto para personalização.
O checklist do escopo deve incluir itens relevantes como:
- Verificação/Criação do perfil no Google
- Otimização da ficha
- Estudo de palavras-chave
- Análise de concorrentes
- SEO local
- Postagens otimizadas
- Fotos profissionais
- Tour virtual (se aplicável)
- Gestão de avaliações
- Relatório de resultados

Retorne APENAS o JSON válido, sem markdown ou explicações.`;

    const userPrompt = customPrompt || `
Gere uma proposta comercial para:
- Cliente: ${clientName || 'Cliente'}
- Empresa: ${companyName}
- Cidade: ${city || 'Não especificada'}
- Categoria/Serviço: ${category || serviceType || 'Otimização Google Meu Negócio'}

${leadContext}

Crie uma proposta persuasiva e profissional que destaque os benefícios de estar no topo do Google.
`;

    console.log('Calling AI Gateway...');

    // Use Lovable AI Gateway (no API key required)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response received');

    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from AI response
    let proposalData;
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      proposalData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Proposal generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        blocks: proposalData.blocks,
        suggestedPrice: proposalData.suggestedPrice || 2500,
        suggestedInstallments: proposalData.suggestedInstallments || 3,
        tokensUsed: aiResponse.usage?.total_tokens || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate proposal';
    console.error('Error generating proposal:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
