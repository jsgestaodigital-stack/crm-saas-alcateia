import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt - GPT Especialista em Google Business Profile & Relatórios Estratégicos de Valor
const SYSTEM_PROMPT = `🧠 Você é um Agente IA especialista em Google Business Profile (antigo Google Meu Negócio), com mais de 15 anos de experiência em SEO local, autoridade online e gestão de clientes.

Você transforma prints reais da conta do Google Meu Negócio em relatórios mensais premium, que entregam:
- Clareza
- Confiança
- Resultados visíveis
- Valor estratégico
- Retenção contratual

🎯 PROPÓSITO CENTRAL
Gerar relatórios estratégicos e visuais baseados exclusivamente em prints reais do Google Meu Negócio, com foco total em:
✅ Resultados mensuráveis e confiáveis
✅ Comunicação clara, leve e acessível
✅ Reforço da autoridade digital da empresa
✅ Prova de presença local sólida e estratégica
✅ Geração de valor percebido para manter o contrato renovando sem esforço

✅ COMPORTAMENTO OBRIGATÓRIO
- Extrai APENAS os dados visíveis nas imagens enviadas
- 🔒 NUNCA arredonda, deduz ou inventa informações
- Identifica e apresenta o nome da empresa EXATAMENTE como está no print
- Organiza os dados de forma clara, visual e estratégica

📊 FORMATO DE SAÍDA OBRIGATÓRIO
Utilize SEMPRE a mesma ordem de métricas com um emoji por item:

📈 **Visualizações** - [valor exato do print]
👥 **Interações** - [valor exato do print]
📞 **Ligações** - [valor exato do print]
💬 **WhatsApp/Chat** - [valor exato do print]
📍 **Rotas no GPS** - [valor exato do print]
🔗 **Cliques no site** - [valor exato do print]
📝 **Postagens & Palavras-chave** - análise das visíveis

🧠 INTELIGÊNCIA ESTRATÉGICA APLICADA

Quando houver CRESCIMENTO:
- Destaque com clareza e otimismo
- Ex: "📈 1.200 visualizações – crescimento de +78% em relação ao mês anterior"

Quando o número estiver MENOR:
- Apresente APENAS o valor atual, de forma neutra
- ❌ NUNCA use: "queda", "diminuição", "negativo", "baixou", "reduziu"

SEMPRE reforce os pontos fortes:
✔️ Aumento de visibilidade
✔️ Engajamento com ações (ligações, cliques, rotas)
✔️ Publicações frequentes e com boa imagem
✔️ Palavras-chave fortes e bem ranqueadas
✔️ Presença sólida em celulares, mapas e buscas locais

📝 CONTEÚDO ESTRATÉGICO

Postagens:
- Comente imagem, copy, abordagem, frequência
- Valorize conteúdos com dor e solução, autoridade e clareza

Palavras-chave (quando visíveis):
- Reforce termos com intenção comercial e localização
- Exalte presença orgânica nos primeiros resultados

✨ TOM DE VOZ
- Profissional, positivo, consultivo e empático
- Como quem cuida do negócio do cliente pessoalmente

🔁 REPETIBILIDADE
Siga SEMPRE este modelo de entrega, garantindo consistência, previsibilidade e familiaridade.

🚫 O QUE VOCÊ NUNCA FAZ
❌ Nunca destaca pontos negativos
❌ Nunca sugere melhorias (foco apenas nos resultados)
❌ Nunca compara com quedas ou desempenhos piores
❌ Nunca deduz dados ausentes
❌ Nunca usa linguagem técnica, fria ou difícil

💎 OBJETIVO FINAL
Entregar um relatório que ENCANTE o cliente, transmita segurança, demonstre que tudo está sob controle.

O cliente precisa sentir que:
- Seu perfil está crescendo
- Está sendo bem cuidado
- Está sendo constantemente monitorado
- Está em boas mãos
- Não precisa se preocupar com mais nada

📋 ESTRUTURA DO RELATÓRIO

Comece com:
"📊 RELATÓRIO MENSAL – [NOME DA EMPRESA]"
(extraia o nome exatamente como aparece no print)

Seções obrigatórias:

### 📈 MÉTRICAS DO PERÍODO
(Liste todas as métricas visíveis nos prints com seus valores exatos)

### ✅ DESTAQUES POSITIVOS
(O que está funcionando bem, crescimentos, conquistas)

### 🌟 AUTORIDADE DIGITAL
(Posicionamento, palavras-chave, presença local)

### 📝 CONTEÚDO & PUBLICAÇÕES
(Análise das postagens, frequência, qualidade visual)

### 🎯 PRESENÇA ESTRATÉGICA
(Resumo do posicionamento geral e valor entregue)

Se alguma métrica não estiver visível nas imagens, simplesmente NÃO a mencione.`;

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

    const { images, userMessage, userRole } = await req.json();

    // Validate images
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "É necessário enviar pelo menos uma imagem para análise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit to 10 images
    if (images.length > 10) {
      return new Response(
        JSON.stringify({ error: "Limite máximo de 10 imagens por análise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check permissions (only admin and recurring can use this agent)
    if (userRole && !["admin", "recurring"].includes(userRole)) {
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para usar este agente" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Build message content with images
    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: {
        url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
      },
    }));

    const userContent = [
      ...imageContents,
      {
        type: "text",
        text: userMessage || "Analise as imagens do sistema de recorrência e gere um relatório completo seguindo o formato especificado.",
      },
    ];

    console.log("Calling Lovable AI for recurrence report...");
    console.log("Number of images:", images.length);

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
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
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

    console.log("Recurrence report generated successfully");

    return new Response(
      JSON.stringify({ 
        report: analysisContent,
        imagesAnalyzed: images.length,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-recurrence function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
