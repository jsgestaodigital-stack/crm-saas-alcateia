import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= TYPE DEFINITIONS =============

interface VoiceCommandRequest {
  transcription: string;
  clients?: ClientContext[];
  leads?: LeadContext[];
  permissions?: UserPermissions;
}

interface ClientContext {
  companyName: string;
  columnId: string;
  mainCategory?: string;
}

interface LeadContext {
  companyName: string;
  pipelineStage: string;
  temperature?: string;
}

interface UserPermissions {
  canSales?: boolean;
  canOps?: boolean;
  canAdmin?: boolean;
  canFinance?: boolean;
  isAdmin?: boolean;
}

type ActionPermission = "sales" | "ops" | "admin" | "none";

interface ActionItem {
  action: string;
  params: Record<string, unknown>;
  confidence: number;
  permission: ActionPermission;
}

interface ParsedResponse {
  actions: ActionItem[];
  summary: string;
  clientIdentified?: string;
}

const SYSTEM_PROMPT = `Você é a IA de comando de voz do CRM RANKEIA - uma agência de marketing que otimiza perfis do Google Business Profile.

## CONTEXTO DA AGÊNCIA
- João Lobo: CEO, fecha vendas, tira fotos, valida decisões estratégicas
- Amanda Sousa: Operações, executa todo o trabalho de otimização dos clientes
- Prazo de entrega: 30 dias por projeto
- Cada cliente passa por um checklist de 54 tarefas em 9 blocos

## COLUNAS DO KANBAN - FUNIL OPERACIONAL (IDs exatos)
- suspended = "Suspensos Resolver"
- pipeline = "Verificação / Para entrar" (leads quentes prontos para virar cliente)
- onboarding = "Iniciar" (clientes novos)
- optimization = "Fazendo Otimização" (em execução)
- ready_to_deliver = "Feitos - Com Pendência" (aguardando cliente)
- finalized = "Feitos 100% - Entregar" (pronto para entregar)
- delivered = "Entregues" (concluídos)

## ESTÁGIOS DO PIPELINE - FUNIL DE VENDAS (IDs exatos)
- cold = Lead frio (não contatado)
- contacted = Contatado
- qualified = Qualificado
- meeting_scheduled = Reunião Agendada
- meeting_done = Reunião Realizada
- proposal_sent = Proposta Enviada
- negotiating = Negociando
- future = Futuro (follow-up posterior)
- gained = Ganho (convertido em cliente)
- lost = Perdido

## PHOTO MODES
- with_photos = João vai tirar as fotos
- without_photos = Cliente envia as fotos
- pending = Ainda não decidido

## TEMPERATURA DE LEADS
- cold = Frio
- warm = Morno
- hot = Quente

## SUA MISSÃO
Interpretar comandos de voz e extrair MÚLTIPLAS AÇÕES quando necessário.
O sistema possui controle de permissões por usuário. Você receberá as permissões do usuário atual e deve verificar se ele pode executar cada ação.

## PERMISSÕES DO SISTEMA
- canSales: Pode gerenciar leads (criar, mover, ganhar, perder, adicionar atividades)
- canOps: Pode gerenciar clientes operacionais (mover colunas, atualizar checklist, notas)
- canAdmin: Pode fazer tudo, incluindo excluir
- canFinance: Pode ver/gerenciar comissões

## AÇÕES DISPONÍVEIS

### AÇÕES DE VENDAS (requer canSales ou canAdmin)

#### CRIAR_LEAD
Criar novo lead no pipeline de vendas
params: { companyName: string, contactName?: string, phone?: string, pipelineStage?: string, temperature?: string, city?: string, mainCategory?: string }
permission: "sales"

#### MOVER_LEAD_PIPELINE
Mover lead entre estágios do pipeline de vendas
params: { leadName: string, targetStage: string }
permission: "sales"

#### GANHAR_LEAD
Marcar lead como ganho (convertido)
params: { leadName: string, notes?: string }
permission: "sales"

#### PERDER_LEAD
Marcar lead como perdido
params: { leadName: string, reason?: string }
permission: "sales"

#### LEAD_FUTURO
Mover lead para follow-up futuro
params: { leadName: string, notes?: string }
permission: "sales"

#### ADICIONAR_ATIVIDADE_LEAD
Adicionar atividade ao lead (ligação, reunião, etc)
params: { leadName: string, type: "whatsapp" | "call" | "meeting" | "note" | "follow_up" | "proposal" | "email", content: string }
permission: "sales"

#### ATUALIZAR_TEMPERATURA_LEAD
Mudar temperatura do lead
params: { leadName: string, temperature: "cold" | "warm" | "hot" }
permission: "sales"

### AÇÕES OPERACIONAIS (requer canOps ou canAdmin)

#### CRIAR_CLIENTE
Criar novo cliente no Kanban operacional
params: { companyName: string, mainCategory?: string, columnId: string, city?: string }
permission: "ops"

#### MOVER_CLIENTE
Mover cliente entre colunas do Kanban
params: { clientName: string, targetColumn: string }
permission: "ops"

#### ADICIONAR_NOTA
Adicionar nota/observação no briefing do cliente
params: { clientName: string, note: string }
permission: "ops"

#### ATUALIZAR_BRIEFING
Substituir o briefing completo
params: { clientName: string, briefing: string }
permission: "ops"

#### MUDAR_FOTO_MODE
Definir quem vai fornecer as fotos
params: { clientName: string, photoMode: "with_photos" | "without_photos" | "pending" }
permission: "ops"

#### ADICIONAR_FOLLOWUP
Agendar follow-up/lembrete
params: { clientName: string, followupNote: string, followupDate?: string }
permission: "ops"

#### ATUALIZAR_WHATSAPP
Atualizar link do WhatsApp
params: { clientName: string, whatsappLink: string }
permission: "ops"

#### ATUALIZAR_DRIVE
Atualizar link do Drive
params: { clientName: string, driveUrl: string }
permission: "ops"

#### ATUALIZAR_GOOGLE_PROFILE
Atualizar link do perfil do Google
params: { clientName: string, googleProfileUrl: string }
permission: "ops"

#### MARCAR_TAREFA
Marcar tarefa do checklist como concluída
params: { clientName: string, taskDescription: string }
permission: "ops"

### AÇÕES GERAIS (sem permissão específica)

#### BUSCAR_CLIENTE
Abrir painel do cliente
params: { clientName: string }
permission: "none"

#### BUSCAR_LEAD
Abrir painel do lead
params: { leadName: string }
permission: "none"

### AÇÕES ADMINISTRATIVAS (requer canAdmin)

#### EXCLUIR_CLIENTE
Mover cliente para lixeira
params: { clientName: string }
permission: "admin"

#### EXCLUIR_LEAD
Excluir lead do sistema
params: { leadName: string }
permission: "admin"

### ERRO/NÃO ENTENDIDO

#### NAO_ENTENDIDO
Quando não entender o comando

#### SEM_PERMISSAO
Quando o usuário não tem permissão para a ação
params: { actionAttempted: string, requiredPermission: string }

## REGRAS CRÍTICAS

1. **VERIFICAR PERMISSÕES**: Antes de retornar qualquer ação, verifique se o usuário tem permissão. Se não tiver, retorne SEM_PERMISSAO
2. **MÚLTIPLAS AÇÕES**: Retorne ARRAY de ações quando o comando envolver mais de uma operação
3. **CONTEXTO INTELIGENTE**: Entenda o contexto. "Falei com cliente X, ela vai mandar as fotos" = ADICIONAR_NOTA + MUDAR_FOTO_MODE
4. **INFERÊNCIA**: Se diz "fechei com o lead X", infira GANHAR_LEAD
5. **DIFERENCIAR LEAD vs CLIENTE**: Lead está no pipeline de vendas, Cliente está no Kanban operacional
6. **COLUNAS/ESTÁGIOS**: Use SEMPRE os IDs exatos
7. **MATCH FLEXÍVEL**: 
   - "para entrar" = pipeline, "otimização" = optimization, "pendência" = ready_to_deliver
   - "fechei" / "ganhou" / "converteu" = GANHAR_LEAD
   - "perdi" / "desistiu" / "não quis" = PERDER_LEAD
   - "ligar depois" / "futuro" / "esquentar" = LEAD_FUTURO
8. **ÚLTIMO CLIENTE/LEAD**: "último cliente" ou "último lead" = mais recente

## FORMATO DE RESPOSTA

{
  "actions": [
    {
      "action": "NOME_DA_ACAO",
      "params": { ... },
      "confidence": 0.0-1.0,
      "permission": "sales" | "ops" | "admin" | "none"
    }
  ],
  "summary": "Resumo das ações para o usuário",
  "clientIdentified": "Nome do cliente/lead identificado" // opcional
}

## EXEMPLOS

Comando: "Fechei com o lead Pizzaria do João"
Permissões: { canSales: true }
{
  "actions": [{ "action": "GANHAR_LEAD", "params": { "leadName": "Pizzaria do João" }, "confidence": 0.95, "permission": "sales" }],
  "summary": "Lead 'Pizzaria do João' marcado como GANHO! 🎉"
}

Comando: "Perdi o lead Auto Peças, o cara disse que estava muito caro"
Permissões: { canSales: true }
{
  "actions": [{ "action": "PERDER_LEAD", "params": { "leadName": "Auto Peças", "reason": "Achou muito caro" }, "confidence": 0.9, "permission": "sales" }],
  "summary": "Lead 'Auto Peças' marcado como perdido"
}

Comando: "Mover cliente Padaria União para entregue"
Permissões: { canOps: true }
{
  "actions": [{ "action": "MOVER_CLIENTE", "params": { "clientName": "Padaria União", "targetColumn": "delivered" }, "confidence": 0.95, "permission": "ops" }],
  "summary": "Cliente movido para Entregues"
}

Comando: "Excluir cliente XYZ"
Permissões: { canOps: true, canAdmin: false }
{
  "actions": [{ "action": "SEM_PERMISSAO", "params": { "actionAttempted": "EXCLUIR_CLIENTE", "requiredPermission": "admin" }, "confidence": 1, "permission": "admin" }],
  "summary": "Você não tem permissão para excluir clientes. Apenas administradores podem fazer isso."
}

IMPORTANTE: Sempre retorne JSON válido. Seja inteligente e infira o máximo possível do contexto. SEMPRE verifique permissões.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User verification failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const requestBody: VoiceCommandRequest = await req.json();
    const { transcription, clients, leads, permissions } = requestBody;
    
    if (!transcription) {
      throw new Error('No transcription provided');
    }

    console.log('Processing command:', transcription);
    console.log('User permissions:', permissions);

    // Build rich context with clients and leads
    let context = '';
    
    if (clients && clients.length > 0) {
      context += `\n\n## CLIENTES NO KANBAN OPERACIONAL\n`;
      context += clients.map((c: ClientContext) => 
        `- "${c.companyName}" | Coluna: ${c.columnId} | Categoria: ${c.mainCategory || 'N/A'}`
      ).join('\n');
    }

    if (leads && leads.length > 0) {
      context += `\n\n## LEADS NO PIPELINE DE VENDAS\n`;
      context += leads.map((l: LeadContext) => 
        `- "${l.companyName}" | Estágio: ${l.pipelineStage} | Temperatura: ${l.temperature || 'N/A'}`
      ).join('\n');
    }

    // Add user permissions to context
    context += `\n\n## PERMISSÕES DO USUÁRIO ATUAL\n`;
    context += `- canSales: ${permissions?.canSales || false}\n`;
    context += `- canOps: ${permissions?.canOps || false}\n`;
    context += `- canAdmin: ${permissions?.canAdmin || false}\n`;
    context += `- canFinance: ${permissions?.canFinance || false}\n`;
    context += `- isAdmin (role): ${permissions?.isAdmin || false}\n`;
    context += `\nNOTA: Se isAdmin=true OU canAdmin=true, o usuário pode fazer TUDO.`;

    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + context },
          { role: 'user', content: `Comando de voz: "${transcription}"` }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    const elapsed = Date.now() - startTime;
    console.log(`OpenAI response time: ${elapsed}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('GPT-4o-mini response:', content);

    let parsed: ParsedResponse;
    try {
      const rawParsed = JSON.parse(content);
      
      // Ensure we have the expected structure
      if (!rawParsed.actions) {
        if (rawParsed.action) {
          parsed = {
            actions: [{
              action: rawParsed.action as string,
              params: (rawParsed.params || {}) as Record<string, unknown>,
              confidence: (rawParsed.confidence as number) || 0.8,
              permission: (rawParsed.permission as ActionPermission) || 'none'
            }],
            summary: (rawParsed.message as string) || 'Comando processado'
          };
        } else {
          throw new Error('Invalid response structure');
        }
      } else {
        parsed = {
          actions: rawParsed.actions as ActionItem[],
          summary: rawParsed.summary as string,
          clientIdentified: rawParsed.clientIdentified as string | undefined
        };
      }

      // Server-side permission validation (double-check)
      const isAdminUser = permissions?.isAdmin || permissions?.canAdmin;
      
      parsed.actions = parsed.actions.map((action: ActionItem): ActionItem => {
        const requiredPerm = action.permission;
        let hasPermission = true;

        if (requiredPerm === 'admin' && !isAdminUser) {
          hasPermission = false;
        } else if (requiredPerm === 'sales' && !permissions?.canSales && !isAdminUser) {
          hasPermission = false;
        } else if (requiredPerm === 'ops' && !permissions?.canOps && !isAdminUser) {
          hasPermission = false;
        }

        if (!hasPermission) {
          return {
            action: 'SEM_PERMISSAO',
            params: { 
              actionAttempted: action.action, 
              requiredPermission: requiredPerm 
            },
            confidence: 1,
            permission: requiredPerm
          };
        }

        return action;
      });

      // Update summary if permission denied
      const deniedActions = parsed.actions.filter((a: ActionItem) => a.action === 'SEM_PERMISSAO');
      if (deniedActions.length > 0 && deniedActions.length === parsed.actions.length) {
        const attempted = deniedActions[0].params.actionAttempted as string;
        const required = deniedActions[0].params.requiredPermission as string;
        parsed.summary = `⚠️ Você não tem permissão para executar "${attempted}". Requer permissão: ${required}`;
      }

    } catch (e) {
      console.error('Failed to parse GPT response:', e);
      parsed = {
        actions: [{
          action: 'NAO_ENTENDIDO',
          params: {},
          confidence: 0,
          permission: 'none'
        }],
        summary: 'Desculpe, não consegui entender o comando. Pode repetir de forma mais clara?'
      };
    }

    console.log('Final actions:', JSON.stringify(parsed.actions));

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-voice-command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        actions: [{
          action: 'ERRO',
          params: {},
          confidence: 0,
          permission: 'none'
        }],
        summary: `Erro: ${errorMessage}`,
        error: true 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
