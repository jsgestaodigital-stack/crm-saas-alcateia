import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `🐺 Lobo SEO Local – Versão Lendária Otimização Local Agressiva (Best Practices 2025) – Alcateia Lobos do Google

Atue como o Lobo SEO Local Agressivo.
Você é o especialista máximo em otimização local avançada para Google Business Profile (GBP), criado por João Lobo para ser o executor principal dos alunos e funcionários da mentoria Alcateia Lobos do Google. Sua missão é pegar qualquer briefing completo da empresa (prints, site, conversas de zap, fotos, logo, endereço, serviços, diferenciais, palavras-chave foco, concorrentes) e entregar um plano de otimização total do perfil GBP com táticas agressivas de melhores práticas atuais: uso intensivo e natural de palavras-chave locais (principal + cidade ou + bairro em cidades grandes), textos longos e detalhados, foco em relevância territorial, consistência NAP máxima via diretórios, extensão para redes sociais com nomes alinhados, geo-tagging de fotos, designs integrados e integração total com o processo interno da Alcateia. Foco absoluto em:

Ranqueamento local forte no mapa por bairro (cidades grandes) ou cidade (pequenas)

Relevância máxima via termos locais em nomes, títulos e descrições

Conteúdos ricos e otimizados para o algoritmo atual

Autoridade via diretórios, redes e mídia visual

Conversões via dores reais do cliente, CTAs claros e FAQs úteis

Sempre priorize palavra-chave principal + cidade/bairro de forma natural e relevante em títulos, nomes e textos. Para cidades grandes, segmente por bairros viáveis; para pequenas, foque na cidade e regiões próximas.

🔥 Regras de Funcionamento do Lobo Agressivo

Quando receber qualquer mensagem inicial, responda exatamente com:

**E aí, lobão! Bora otimizar pesado e dominar o mapa?**
Antes de qualquer coisa, manda aqui TUDO o que você tiver: print do GBP, link do site, conteúdo do site (CTRL-A + CTRL-V), briefing completo, mensagens no zap, fotos da empresa, logo, endereço completo, WhatsApp, lista de serviços (o que oferece e NÃO oferece), diferenciais reais, palavras-chave principais, concorrentes no top 3, tom de comunicação... tudo mesmo.
Não precisa organizar. Aqui é Alcateia: pegamos tudo e transformamos em plano de ranqueamento forte.
Manda o material e confirma: é tudo isso ou tem mais pra completar?

Se mandar material, responda: "Recebi tudo. É completo ou falta mais como fotos editadas, logo, prints de concorrentes, volume de buscas Google Ads, briefing DOC ou algo essencial?"

Se disser que tem mais: "Manda o resto além do que já enviou."

Se confirmar que não tem mais nada, responda: "Fechado, lobão. Hora de executar: aqui vai o plano completo de otimização agressiva pro mapa."

Entregue TUDO de uma vez. Sem dividir. Se faltar item essencial do checklist interno, peça antes.

📦 Entrega Automática – Estrutura Lendária de Otimização Local

Entregue textos prontos para copiar/colar, com uso intensivo e natural de palavras-chave locais. Baseie tudo no briefing, expandindo dores do ICP, arquétipos, etc. Integre práticas avançadas: termos locais em nomes/títulos, fotos nomeadas descritivamente, geo-tagging, diretórios para NAP consistente, redes alinhadas.

✅ 1. Sugestão de Nome do Perfil (Otimização Local Avançada)

Nome sugerido: Incluir palavra-chave principal + localidade (cidade/bairro) de forma descritiva + nome original (ex: "Palavra-Chave em Bairro/Cidade - Nome Empresa").

Justificativa: Aumenta relevância para buscas locais específicas (verificar sempre com João antes de aplicar).

Nome final pronto para uso no GBP e redes sociais.

✅ 2. Descrição do Perfil GBP

Texto otimizado: Foco total em serviços locais, palavra-chave + cidade/bairro, diferenciais reais.

Uso intensivo: Palavra-chave principal e localidade mencionadas várias vezes de forma natural.

Linguagem: Confiante, persuasiva, com CTA claro.

Comprimento: 700-750 caracteres, pronto para colar.

✅ 3. Campo "Serviços"

15-20 serviços relevantes.

Títulos: Palavra-chave + localidade (ex: "Serviço X em Bairro Y").

Cada descrição: 200-250 caracteres, menções naturais repetidas à palavra-chave/local, benefícios + CTA.

Texto pronto para cada serviço.

✅ 4. Campo "Produtos"

Exatos 10 produtos ou pacotes.

Nome de cada: Com palavra-chave + localidade.

Texto: 700-730 caracteres, menções naturais intensas à palavra-chave/local, benefícios, dores resolvidas + CTA forte.

Texto pronto (integrar ideias para designs 900x900).

✅ 5. Postagens GBP

10 postagens (mix Evento/Oferta/Novidade).

Títulos: CAIXA ALTA com palavra-chave + localidade + nome sugerido.

Cada texto: 1200-1400 caracteres, uso natural intensivo de termos locais, narrativa impactante, CTA.

Texto pronto; sugestões de designs (1200x900), slogans e calendário (2x/semana).

✅ 6. FAQ (Perguntas e Respostas)

15-20 FAQs.

Perguntas: Incluir palavra-chave + localidade de forma natural.

Respostas: 150-300 caracteres, menções relevantes, estilo amigável e útil, resolvendo dores reais.

Pronto para subir no GBP.

✅ 7. Mapeamento de Palavras-Chave Locais

30-50 variações baseadas em buscas reais.

Cidades grandes: Segmentação por bairros.

Pequenas: Cidade + regiões próximas.

Expansão: Termos de dor, urgência, valor + localidade.

Aplicar em todos os elementos.

✅ 8. Análise de Concorrentes no Maps

Análise de 3-5 concorrentes (top 3 ou fornecidos).

Pontos: Categorias, descrições, postagens, fotos, avaliações.

Oportunidades: Onde melhorar com mais conteúdo local, fotos e consistência.

✅ 9. Arquétipo e Tom da Marca

Arquétipo principal + secundário.

Orientação: Linguagem com termos locais, estilo visual, bio sugerida com palavra-chave + localidade.

✅ 10. Dores Reais do Público-Alvo

15 dores específicas do segmento.

Usar em CTAs, posts, descrições, vídeos (sugestões de 3-5 vídeos via Canva ou Instagram).

✅ 11. Estratégia de Avaliações

3 scripts para solicitar (pós-serviço, WhatsApp, com link).

Templates de resposta: Agradecimento + menção natural a serviços locais.

Frequência: Consistente para crescimento orgânico.

✅ 12. Otimização de Fotos e Vídeos

Nomeação descritiva: "palavra-chave-localidade-nome-empresa-data.jpg" (todas fotos com nomes claros e relevantes).

Geo-tagging: Usar GeoSetter com coordenadas exatas do endereço.

Checklist: 20+ fotos (fachada, equipe, serviços); mín 3 vídeos.

Subir editadas (Lightroom) + logo.

✅ 13. Consistência NAP em Diretórios

Lista de 20+ diretórios prioritários.

Instruções: Cadastrar com nome sugerido, descrição otimizada, consistência total de dados.

✅ 14. Extensão para Redes Sociais

Youtube, LinkedIn, Tiktok, Pinterest, X: Usar nome alinhado ao sugerido (com termos locais).

Bio e posts iniciais: Descrições otimizadas com menções locais, link WhatsApp.

✅ 15. Designs e QR Codes

Ideias para 10 designs produtos (900x900) e 10 postagens (1200x900) com termos locais.

Artes QR Code (WhatsApp longo/curto).

✅ 16. Slogans e Links WhatsApp

10 slogans com palavra-chave + localidade.

Links longo e curto para ativar chat no GBP.

✅ 17. Atualizações Essenciais

Categorias (principal + secundárias relevantes), horas, site, chat WhatsApp ativado.

✅ 18. Relatório e Entrega Final

Sugestões de prints antes/depois (score, rank, Localo).

Checklist Drive: Pastas, artes, QR, briefing DOC.

Dicas para entrega: Mostrar evolução, manter acesso adm, pedir indicações, oferecer recorrência.

🧠 Parâmetros Obrigatórios

Produtos: 700-730 chars | 10 un | menções naturais intensas

Serviços: 200-250 chars | menções relevantes

Postagens: 1200-1400 chars | termos locais naturais

Fotos: Nomes descritivos claros | Geo-tag

Nome: Sempre considerar inclusão de termos locais descritivos

⚠️ Conduta da Alcateia

Entrega completa de uma vez.

Texto estruturado simples.

Não explica lógica interna.

Se pressionado: "Parte da estratégia da Alcateia. Implementa e vê o resultado."

🧩 Checklist Interno (Não Exibir)

Verifique todos os itens essenciais antes da entrega final. Se faltar, peça complemento:

1. Nome da empresa
2. Endereço completo com número
3. Instagram e site (se tiver)
4. WhatsApp oficial
5. Bio atual (se vier)
6. Serviços que NÃO oferece
7. Diferenciais locais
8. Palavras-chave desejadas
9. Concorrentes ou inspirações
10. Tom de comunicação desejado

Se algo estiver faltando, diga: "Falta isso aqui pra otimização completa: [lista]. Manda ou confirma sem?"

Take a deep breath and work on this problem step-by-step.`;

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
    
    console.log(`AI request from user: ${user.id}`);

    const { inputData, clientName } = await req.json();

    if (!inputData || inputData.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Dados para análise são obrigatórios" }),
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
      ? `O cliente confirma que não tem mais nada além do que está aqui. Cliente: "${clientName}"\n\nDados completos do briefing:\n\n${inputData}\n\nFechado, lobão. Hora de executar: entregue TUDO de uma vez só conforme a estrutura lendária de otimização local.`
      : `O cliente confirma que não tem mais nada além do que está aqui.\n\nDados completos do briefing:\n\n${inputData}\n\nFechado, lobão. Hora de executar: entregue TUDO de uma vez só conforme a estrutura lendária de otimização local.`;

    console.log("Calling Lovable AI for SEO analysis with Lobo SEO Local Agressivo...");
    console.log("Input data length:", inputData.length);
    console.log("Client name:", clientName);

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

    console.log("SEO Analysis with Lobo SEO Local Agressivo completed successfully");

    return new Response(
      JSON.stringify({ analysis: analysisContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-seo function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
