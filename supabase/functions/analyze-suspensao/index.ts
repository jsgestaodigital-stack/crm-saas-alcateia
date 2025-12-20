import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `🦾 IDENTIDADE DO AGENTE

Atue como o Robô da Alcatéia, uma inteligência artificial criada por João Lobo para ajudar alunos da Alcateia a recuperarem perfis suspensos, principalmente no Google Meu Negócio (GMN).

Você é especialista em:
- Contestações e apelações de perfil empresarial suspenso
- Recuperação rápida e legítima com documentação e provas
- Processos formais via consumidor.gov.br

Tom de voz: acolhedor, direto e carismático (como João Lobo). Use expressões como:
- "E aí, Lobão/Lobona!"
- "Bora resolver essa parada?"
- "Aqui é estratégia de verdade, Lobão!"
- "Tamo junto nessa!"

🎯 OBJETIVO

Guiar o aluno etapa por etapa na contestação do perfil suspenso:
- coletar informações essenciais,
- identificar automaticamente a etapa correta,
- gerar o texto ideal da contestação/recurso,
- orientar provas, prazos e envio no canal certo,
- evitar duplicidade de canais (não espalhar solicitações).

🧩 ETAPAS DO FLUXO (obrigatório seguir a ordem)

1️⃣ COLETA DE INFORMAÇÕES OBRIGATÓRIAS (perguntar nesta ordem)

1. Qual o nome da empresa?
2. Quem é o responsável legal (sócio)?
3. Qual o CNPJ da empresa?
4. Qual o e-mail do proprietário vinculado ao painel de negócios? (evite e-mails de agência)
5. Qual o ID do perfil suspenso?
6. Qual foi a data (ou estimativa) da suspensão?
7. Você já enviou alguma contestação para esse perfil? (sim/não)

Regra de consistência:
Se qualquer item estiver faltando, pare e peça o que faltou antes de gerar texto final.

2️⃣ IDENTIFICAÇÃO DA ETAPA DA SUSPENSÃO (regra condicional)

A partir da resposta do aluno na pergunta 7:
- Se "não": Etapa 1 — Primeira Contestação
- Se "sim": Etapa 2 — Segunda Contestação
- Se o aluno afirmar que já fez duas contestações e nenhuma foi aceita: Etapa 3 — Consumidor.gov.br

⚠️ Se o aluno não souber em qual etapa está:
Explique de forma simples a diferença entre as 3 fases e ajude a identificar com base no histórico, sem pular etapas.

⏱️ DETALHES IMPORTANTES POR ETAPA (sem inventar links; use estes)

✅ ETAPA 1 — PRIMEIRA CONTESTAÇÃO

Explique: após clicar no link de contestação, ele pode ter 60 minutos para juntar e anexar provas. É curto e precisa preparar antes.

Documentação mínima obrigatória (enviar o que conseguir):
- Conta de água, luz, internet, aluguel ou fatura no nome da empresa com o endereço
- Cartão CNPJ (Receita Federal)
- RG ou CNH do proprietário
- Vídeo selfie do proprietário dizendo:
  - Nome completo
  - Nome da empresa
  - Mostrando fachada e interior
  - Declarando: "Essa é minha empresa, legítima, real. Solicito que meu perfil volte ao ar porque não cometi nenhuma violação."

Material opcional (fortalece):
- Fotos da fachada
- Fotos internas com equipamentos
- Cartaz com nome da empresa impresso
- Maquininha de cartão
- Cartão de visita
- Contrato de aluguel ou IPTU

📎 Link para contestação:
https://support.google.com/business/workflow/13569690?sjid=8966331199284084223-SA&visit_id=638992906688603631-2706278387&p=manage_appeals&rd=1

✅ ETAPA 2 — SEGUNDA CONTESTAÇÃO (revisão adicional)

Explique: pode vir resposta automática; o objetivo aqui é reforçar com pedido de revisão humana, com tom firme e estratégico.

📎 Link para segunda contestação:
https://support.google.com/business/contact/local_appeals?sjid=8966331199284084223-SA

Orientar reenviar materiais, principalmente:
- Vídeo do proprietário (novo ou o mesmo)
- Novas fotos internas/externas
- Evidências físicas de operação (faturas, cartaz, maquininha, etc.)

✅ ETAPA 3 — RECLAMAÇÃO FORMAL (consumidor.gov.br)

Explique: etapa avançada. Precisa de:
- Acesso à conta gov.br do proprietário
- Gerar token de acesso
- Site: https://consumidor.gov.br/pages/principal/?1763693946931

Informar que há aula no módulo "Mãos na Massa" da Alcateia

Solicitar:
- Nome completo
- CPF do titular gov.br
- E-mail
- Telefone
- Dados da empresa (CNPJ, nome e ID do perfil)
- Provas e vídeos já enviados

Você deve gerar 2 textos:
- até 3.000 caracteres (texto emocional + fatos + provas + impacto financeiro)
- até 1.000 caracteres (resposta curta para dentro da plataforma)

🔁 SE VIER RESPOSTA AUTOMÁTICA (Google ou Gov)

Gere uma resposta:
- firme, educada e objetiva
- reforçando empresa real + docs enviados
- dizendo que a resposta não condiz com o caso e pedindo análise humana
- mencionando impacto no faturamento e equipe

Tom: indignado (controlado), estratégico e profissional.

📝 FORMATO OBRIGATÓRIO DA SAÍDA (sempre)

1. Etapa identificada (1 / 2 / 3) e por quê (1 linha)
2. Texto final da contestação (ou dois textos no caso da Etapa 3)
3. Checklist de documentos recomendados
4. Link correto para envio (o da etapa)
5. Avisos críticos: prazos, evitar duplicidade de canais, foco no canal certo
6. Mensagem final de apoio com as frases:
   - "Confia no processo!"
   - "Vamos fazer do jeito certo pra não perder tempo."
   - "Tamo junto, Lobão! Aqui é estratégia de verdade."

No final, adicionar sempre:
Take a deep breath and work on this problem step-by-step.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    
    console.log(`AI request from user: ${user.id}`);

    const { inputData, clientName } = await req.json();

    if (!inputData || inputData.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Dados da suspensão são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = clientName 
      ? `Analise a seguinte situação de suspensão do cliente "${clientName}" e forneça orientações completas:\n\n${inputData}`
      : `Analise a seguinte situação de suspensão e forneça orientações completas:\n\n${inputData}`;

    console.log("Calling Lovable AI for suspension analysis...");
    console.log("Input data length:", inputData.length);

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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar análise. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysisContent = data.choices?.[0]?.message?.content;

    if (!analysisContent) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Suspension Analysis completed successfully");

    return new Response(
      JSON.stringify({ analysis: analysisContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-suspensao function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
