
# Plano de Otimizacao Robusta - GBRANK CRM
## Baseado na Analise Comparativa PRD Externo vs Sistema Atual

---

## 1. Analise de Gaps: PRD vs Sistema Atual

Apos analisar os 3 documentos enviados (PRD completo, Plano de Interface, pesquisa de concorrentes) e comparar com o codigo-fonte existente, identifiquei **14 gaps criticos** organizados por prioridade.

### Legenda de Status
- **EXISTE** = Funcionalidade ja implementada
- **PARCIAL** = Existe mas incompleto vs PRD
- **FALTA** = Nao implementado

| # | Funcionalidade PRD | Status | Impacto |
|---|-------------------|--------|---------|
| 1 | Dashboard com KPIs draggable/resize | PARCIAL | Alto |
| 2 | Feed de Atividades em tempo real | FALTA | Alto |
| 3 | FAB contextual por funil | FALTA | Medio |
| 4 | Comparacao Antes/Depois (imagens) | FALTA | Alto |
| 5 | Calendario drag-and-drop recorrencia | PARCIAL | Medio |
| 6 | Editor WYSIWYG propostas com blocos drag | PARCIAL | Alto |
| 7 | Preview ao vivo lado-a-lado propostas | PARCIAL | Alto |
| 8 | Hub centralizado de Agentes IA | FALTA | Alto |
| 9 | Mapa de calor atividades (Manager Report) | FALTA | Medio |
| 10 | Sessoes ativas no perfil | FALTA | Medio |
| 11 | Customizacao do checklist (admin) | FALTA | Alto |
| 12 | Upload com preview drag-and-drop | PARCIAL | Medio |
| 13 | Filtros avancados colapsaveis reutilizaveis | PARCIAL | Medio |
| 14 | Graficos de projecao comissoes (barras) | PARCIAL | Baixo |

---

## 2. Plano de Implementacao por Fases

### FASE 1 - Quick Wins (Impacto alto, Esforco baixo)

**1.1 FAB (Floating Action Button) Contextual**
- Botao flutuante fixo no canto inferior direito
- Muda funcao conforme funil ativo:
  - Vendas: "Novo Lead"
  - Otimizacao: "Adicionar Cliente"
  - Recorrencia: "Novo Cliente Recorrente"
- Arquivo: `src/components/FloatingActionButton.tsx` (novo)
- Integra com `useFunnelMode()` para contexto

**1.2 Feed de Atividades em Tempo Real**
- Componente `ActivityFeed.tsx` no Dashboard
- Usa Supabase Realtime no `audit_logs` table
- Mostra ultimas 20 acoes: "Joao moveu Lead X para Reuniao"
- Atualiza sem refresh
- Arquivo: `src/components/dashboard/ActivityFeed.tsx` (novo)

**1.3 Sessoes Ativas no Perfil**
- Setar no `/meu-perfil` usando tabela `active_sessions` ja existente
- Lista dispositivos com IP, user-agent, ultimo acesso
- Botao "Encerrar Sessao" para outros dispositivos
- Arquivo: modificar `src/pages/MeuPerfil.tsx`

---

### FASE 2 - Melhorias de UX Core (Impacto alto, Esforco medio)

**2.1 Hub Centralizado de Agentes IA**
- Nova rota `/agentes-ia` com cards de cada agente
- Agentes: Lead Copilot, Raio-X, SEO, Suspensoes, Relatorio, Propostas
- Cada card: descricao, botao de acao, historico de uso
- Interface unificada em vez de modais espalhados
- Arquivos: `src/pages/AgentesIA.tsx` (novo), rota em `App.tsx`

**2.2 Comparacao Antes/Depois para Otimizacao**
- Componente slider que sobrepoe 2 imagens
- Arraste horizontal para comparar estado anterior vs atual do GMB
- Integra na view de execucao do cliente (checklist)
- Arquivo: `src/components/execution/BeforeAfterCompare.tsx` (novo)

**2.3 Filtros Avancados Reutilizaveis**
- Componente colapsavel generico com selects, date pickers, toggles
- Reutilizar em: Leads Kanban, Otimizacao, Recorrencia, Propostas, Contratos
- Arquivo: `src/components/ui/advanced-filters.tsx` (novo)
- Substitui filtros inline atuais por componente padronizado

---

### FASE 3 - Propostas e Editor Visual (Impacto alto, Esforco alto)

**3.1 Editor de Propostas com Drag-and-Drop de Blocos**
- Melhorar `ProposalEditor.tsx` existente:
  - Sidebar com biblioteca de blocos arrastaveis
  - Area principal com reordenacao por drag
  - Preview ao vivo em painel lateral (split view)
- Usar `@dnd-kit/core` para drag-and-drop
- Suporte a variaveis dinamicas: `{{nome_cliente}}`, `{{valor}}`
- Arquivos: refatorar `src/components/proposals/ProposalEditor.tsx`

**3.2 Preview ao Vivo Lado-a-Lado**
- Split view: editor esquerda, preview direita
- Usa `react-resizable-panels` (ja instalado)
- Preview atualiza em tempo real conforme edita blocos
- Arquivo: integrar em `ProposalEditor.tsx`

---

### FASE 4 - Dashboard Inteligente (Impacto alto, Esforco alto)

**4.1 KPIs Draggable e Resizable**
- Implementar grid de widgets no Dashboard
- Cada KPI eh um widget movivel/redimensionavel
- Salvar layout por usuario no localStorage
- Usar CSS Grid com posicoes salvas
- Arquivo: `src/components/dashboard/DashboardGrid.tsx` (novo)

**4.2 Widget de Alertas Prioritarios**
- Banner destacado no topo do dashboard
- Categorias: vermelho (critico), amarelo (atencao), azul (info)
- Dados: clientes atrasados, trials vencendo, leads sem resposta
- Arquivo: `src/components/dashboard/PriorityAlerts.tsx` (novo)

---

### FASE 5 - Manager Report e Admin Avancado (Impacto medio, Esforco medio)

**5.1 Mapa de Calor de Atividades**
- Calendario tipo GitHub contribution graph
- Cores representam intensidade de atividades da equipe
- Filtro por membro da equipe
- Arquivo: `src/components/manager-report/ActivityHeatmap.tsx` (novo)

**5.2 Customizacao do Checklist pelo Admin**
- Interface para admin adicionar/remover/reordenar itens do checklist de 47 pontos
- Salvar por agencia na tabela `agency_checklists` (nova migration)
- Override padrao do sistema com checklist customizado
- Arquivo: `src/components/admin/ChecklistCustomizer.tsx` (novo)
- Migration: criar `agency_custom_checklists` table

**5.3 Graficos de Projecao de Comissoes**
- Grafico de barras comparando projetado vs pago por mes
- Integrar Recharts (ja instalado) no `CommissionForecast.tsx`
- Adicionar grafico de linha com tendencia de 6 meses

---

## 3. Detalhamento Tecnico

### Novas Dependencias Necessarias
- `@dnd-kit/core` + `@dnd-kit/sortable` - drag-and-drop para propostas e dashboard
- Nenhuma outra dependencia nova necessaria (Recharts, framer-motion, resizable-panels ja instalados)

### Migrations de Banco de Dados
```text
1. agency_custom_checklists
   - id (uuid PK)
   - agency_id (uuid FK)
   - items (jsonb) -- array de {id, title, category, order, required}
   - created_at, updated_at
   - RLS: agency_id = current_agency_id()

2. dashboard_layouts
   - id (uuid PK)
   - user_id (uuid)
   - agency_id (uuid)
   - layout (jsonb) -- posicoes e tamanhos dos widgets
   - RLS: user_id = auth.uid()
```

### Novas Rotas
```text
/agentes-ia    -- Hub centralizado de Agentes IA
```

### Arquivos Novos (estimativa)
```text
src/components/FloatingActionButton.tsx
src/components/dashboard/ActivityFeed.tsx
src/components/dashboard/DashboardGrid.tsx
src/components/dashboard/PriorityAlerts.tsx
src/components/execution/BeforeAfterCompare.tsx
src/components/ui/advanced-filters.tsx
src/components/manager-report/ActivityHeatmap.tsx
src/components/admin/ChecklistCustomizer.tsx
src/pages/AgentesIA.tsx
```

### Arquivos Modificados
```text
src/pages/Dashboard.tsx -- integrar FAB, ActivityFeed, PriorityAlerts
src/pages/MeuPerfil.tsx -- adicionar sessoes ativas
src/pages/ManagerReport.tsx -- adicionar ActivityHeatmap
src/components/proposals/ProposalEditor.tsx -- drag-and-drop + split preview
src/components/commissions/CommissionForecast.tsx -- graficos de barras
src/App.tsx -- nova rota /agentes-ia
```

---

## 4. Ordem de Execucao Recomendada

Dado que o sistema ja esta em producao com usuarios ativos, a ordem prioriza:

1. **Fase 1** (Quick Wins) -- implementar primeiro pois sao mudancas isoladas sem risco de regressao
2. **Fase 2** (UX Core) -- Hub IA e filtros melhoram navegabilidade
3. **Fase 5** (Admin) -- heatmap e checklist customizavel agregam valor ao plano Master
4. **Fase 3** (Propostas) -- refatoracao maior, precisa de testes extensivos
5. **Fase 4** (Dashboard) -- maior complexidade, implementar por ultimo

Cada fase pode ser implementada de forma independente sem quebrar funcionalidades existentes.

---

## 5. Concorrentes Identificados (do PRD)

O PRD externo identificou 8 concorrentes relevantes:
- **BrightLocal** (4.5/5) -- rank tracking, reviews, auditoria GMB
- **Local Viking** (4.7/5) -- foco em rank tracking GMB
- **Whitespark** (4.6/5) -- citacoes locais, rank tracker
- **Podium** (4.5/5) -- reviews + mensagens + pagamentos
- **Moz Local** (4.3/5) -- otimizacao de listagens
- **Synup** (4.4/5) -- automacao de posts
- **Reputation.com** (4.3/5) -- analise de sentimentos
- **Yext** (4.2/5) -- gestao centralizada multi-plataforma

O GBRANK CRM se diferencia por ser um **CRM completo + otimizacao GMB** em vez de apenas ferramentas isoladas de SEO local, com foco no mercado brasileiro e modelo SaaS multi-tenant.
