# PRD — GBRANK CRM
## Product Requirements Document — Versão 1.0

**Produto:** GBRANK CRM  
**Categoria:** SaaS B2B — CRM Vertical para Agências de Google Meu Negócio  
**Autor:** Documentação Técnica Oficial  
**Data:** Fevereiro 2026  
**URL de Produção:** https://gbrankcrm.lovable.app  
**URL de Preview:** https://id-preview--a3547989-d809-48e1-8acc-4a1f81c0ea2e.lovable.app  

---

# SUMÁRIO EXECUTIVO

## 1. ÍNDICE GERAL

1. [Sumário Executivo](#sumário-executivo)
2. [Visão do Produto](#2-visão-do-produto)
3. [Público-Alvo e Personas](#3-público-alvo-e-personas)
4. [Proposta de Valor e Oferta Comercial](#4-proposta-de-valor-e-oferta-comercial)
5. [Arquitetura Técnica](#5-arquitetura-técnica)
6. [Sistema de Multi-Tenancy](#6-sistema-de-multi-tenancy)
7. [Autenticação, Roles e Permissões](#7-autenticação-roles-e-permissões)
8. [Módulo 1 — Funil de Vendas (CRM de Leads)](#8-módulo-1--funil-de-vendas-crm-de-leads)
9. [Módulo 2 — Funil de Otimização (Delivery)](#9-módulo-2--funil-de-otimização-delivery)
10. [Módulo 3 — Gestão de Recorrência](#10-módulo-3--gestão-de-recorrência)
11. [Módulo 4 — Propostas Comerciais](#11-módulo-4--propostas-comerciais)
12. [Módulo 5 — Contratos Digitais](#12-módulo-5--contratos-digitais)
13. [Módulo 6 — Sistema de Comissões](#13-módulo-6--sistema-de-comissões)
14. [Módulo 7 — Agentes de Inteligência Artificial](#14-módulo-7--agentes-de-inteligência-artificial)
15. [Módulo 8 — Relatório Gerencial](#15-módulo-8--relatório-gerencial)
16. [Módulo 9 — Administração e Equipe](#16-módulo-9--administração-e-equipe)
17. [Módulo 10 — Ferramentas Auxiliares](#17-módulo-10--ferramentas-auxiliares)
18. [Landing Page e Páginas Públicas](#18-landing-page-e-páginas-públicas)
19. [Navegação, Sidebar e Interface](#19-navegação-sidebar-e-interface)
20. [Design System](#20-design-system)
21. [Regras de Negócio Consolidadas](#21-regras-de-negócio-consolidadas)
22. [Edge Functions (Backend)](#22-edge-functions-backend)
23. [Banco de Dados — Tabelas e Schemas](#23-banco-de-dados--tabelas-e-schemas)
24. [Planos, Limites e Monetização](#24-planos-limites-e-monetização)
25. [Segurança e Compliance (LGPD)](#25-segurança-e-compliance-lgpd)
26. [Roadmap e Backlog](#26-roadmap-e-backlog)

---

# 2. VISÃO DO PRODUTO

## 2.1 Definição

GBRANK CRM é uma plataforma SaaS (Software as a Service) completa de gestão operacional desenvolvida **exclusivamente** para agências de marketing digital especializadas em **Google Meu Negócio** (Google Business Profile / GBP). O sistema gerencia o ciclo de vida completo do relacionamento com clientes — desde a captação de leads via CRM de vendas, passando pela execução operacional de otimização de perfis, até a gestão contínua de clientes com planos recorrentes mensais.

## 2.2 Missão

Eliminar a improvisação operacional em agências de Google Meu Negócio, substituindo planilhas, anotações dispersas e processos manuais por um sistema integrado, automatizado e especializado no nicho.

## 2.3 Problema Central

Agências de Google Meu Negócio enfrentam diariamente:

| # | Problema | Impacto Operacional |
|---|---------|---------------------|
| 1 | Leads perdidos em planilhas e WhatsApp | Follow-ups atrasados, vendas perdidas |
| 2 | Propostas criadas manualmente do zero | Inconsistência, tempo excessivo |
| 3 | Contratos dispersos sem rastreabilidade | Vulnerabilidade jurídica |
| 4 | Falta de visibilidade para gestores | Decisões cegas, sem métricas |
| 5 | Processos de execução sem padrão | Retrabalho, qualidade irregular |
| 6 | Dificuldade em demonstrar valor ao cliente | Renovações difíceis |
| 7 | Comissões calculadas manualmente | Erros, conflitos internos |
| 8 | Tarefas recorrentes sem controle | Clientes abandonados |

## 2.4 Resultados Esperados

- **+40%** produtividade da equipe via automações e processos padronizados
- **-60%** tempo gasto em tarefas administrativas manuais
- **+25%** conversão de leads com follow-up automatizado e IA
- **Zero leads perdidos** com CRM centralizado e alertas
- **100% rastreabilidade** de propostas, contratos e comissões

## 2.5 Métricas do Sistema (Estado Atual)

| Métrica | Valor |
|---------|-------|
| Tabelas no banco PostgreSQL | 35+ |
| Tabelas com isolamento `agency_id` | 18+ |
| Edge Functions (backend) | 20+ |
| Rotas funcionais | 28 |
| Componentes React | ~180 |
| Políticas RLS de segurança | ~120 |
| Contextos React | 5 |
| Custom Hooks | 60+ |

---

# 3. PÚBLICO-ALVO E PERSONAS

## 3.1 Público-Alvo Primário

- **Agências de marketing digital** especializadas em Google Meu Negócio / SEO Local
- **Freelancers** que gerenciam múltiplos perfis de clientes
- **Consultores de SEO local** que precisam de ferramentas específicas para o nicho
- **Empresas de marketing** que desejam escalar operações de GBP com processos padronizados

## 3.2 Personas

### Persona 1: João — Dono de Agência (Owner/Admin)

| Atributo | Valor |
|----------|-------|
| **Cargo** | Fundador / CEO de agência de marketing local |
| **Tamanho da operação** | 10-50 clientes Google Meu Negócio |
| **Equipe** | 1-5 pessoas (operadores, vendedores) |
| **Dor principal** | "Eu faço tudo sozinho e não consigo escalar" |
| **Necessidade** | Delegar com confiança, ter visibilidade total |
| **Funcionalidades-chave** | Dashboard gerencial, controle de equipe, comissões, relatórios |

### Persona 2: Maria — Operadora

| Atributo | Valor |
|----------|-------|
| **Cargo** | Analista de SEO Local / Operadora de Perfis |
| **Responsabilidade** | Otimizar perfis seguindo checklist |
| **Dor principal** | "Cada dia otimizo de um jeito diferente, esquece coisas" |
| **Necessidade** | Checklist padronizado, rotinas claras, menos retrabalho |
| **Funcionalidades-chave** | Checklist de 47 pontos, painel de execução, timer de tarefas |

### Persona 3: Pedro — Vendedor (Sales Rep)

| Atributo | Valor |
|----------|-------|
| **Cargo** | Comercial / SDR |
| **Responsabilidade** | Prospectar, qualificar e fechar vendas |
| **Dor principal** | "Perco leads porque não tenho follow-up organizado" |
| **Necessidade** | Funil visual, próximas ações, propostas rápidas |
| **Funcionalidades-chave** | Kanban de leads, Lead Copilot IA, gerador de propostas |

---

# 4. PROPOSTA DE VALOR E OFERTA COMERCIAL

## 4.1 Posicionamento

> **"O único CRM 100% focado em Google Meu Negócio"**

Diferente de CRMs genéricos (Pipedrive, HubSpot, Bitrix), o GBRANK foi construído por quem vende e opera Google Meu Negócio há 4+ anos. Cada funcionalidade resolve um problema real e específico do nicho.

## 4.2 Diferenciais Competitivos

| GBRANK CRM | CRMs Genéricos |
|------------|----------------|
| 100% focado em Google Meu Negócio | Feitos para qualquer nicho |
| Pronto para usar em 15 minutos | Você precisa configurar tudo do zero |
| Construído por quem vende há 4 anos | Não entendem Google Meu Negócio |
| Checklist de 47 pontos de otimização | Sem checklist de otimização |
| Gestão de tarefas recorrentes automáticas | Não controlam tarefas recorrentes |
| Contratos com cláusulas específicas GMB | Contratos genéricos |

## 4.3 Planos e Preços

### Plano "Lobinho" 🐺

| Atributo | Valor |
|----------|-------|
| **Preço mensal** | R$ 67/mês |
| **Preço anual** | R$ 54/mês (economia de R$ 156/ano) |
| **Público** | Solo operators / Freelancers iniciantes |
| **Usuários** | 1 (admin) |
| **Leads** | Até 200 |
| **Clientes em otimização** | Até 30 |
| **Clientes recorrentes** | Até 30 |

**Funcionalidades incluídas:**
- Checklist completo de otimização (47 pontos)
- Funil visual de leads (Kanban com 10 estágios)
- Propostas + Contratos digitais com link rastreável
- Agentes IA (SEO, Suspensões, Raio-X)
- Dashboard e relatórios básicos
- Suporte por e-mail

### Plano "Lobão" 🐺🔥 (Mais Popular)

| Atributo | Valor |
|----------|-------|
| **Preço mensal** | R$ 97/mês |
| **Preço anual** | R$ 78/mês (economia de R$ 228/ano) |
| **Público** | Agências com equipe que querem crescer |
| **Usuários** | 3 (1 admin + 2 equipe) |
| **Leads** | Até 1.000 |
| **Clientes em otimização** | Até 300 |
| **Clientes recorrentes** | Até 300 |

**Funcionalidades incluídas:**
- Tudo do Lobinho +
- Controle de comissões completo
- Logs e auditoria completos
- Suporte prioritário
- Suporte por WhatsApp
- Acesso antecipado a novidades

## 4.4 Modelo de Monetização

- **Trial gratuito**: 14 dias sem cartão de crédito
- **Cobrança mensal ou anual** (desconto de ~20% no anual)
- **Upsell**: Lobinho → Lobão conforme equipe cresce
- **Argumento de venda**: "1 contrato fechado já paga o ano todo do sistema"

---

# 5. ARQUITETURA TÉCNICA

## 5.1 Stack Tecnológico Completo

| Camada | Tecnologia | Versão | Propósito |
|--------|-----------|--------|-----------|
| **Frontend Framework** | React + TypeScript | 19.x | SPA reativa com tipagem estática |
| **Build Tool** | Vite | Latest | Build rápido com HMR |
| **Estilização** | Tailwind CSS | 3.4+ | Utility-first CSS framework |
| **Componentes UI** | Shadcn/UI | Latest | Componentes acessíveis e customizáveis |
| **State Management (server)** | TanStack Query (React Query) | 5.x | Cache, fetch e sincronização de dados |
| **State Management (client)** | Zustand | 5.x | Store global leve |
| **Roteamento** | React Router DOM | 6.30+ | SPA routing com lazy loading |
| **Backend/BaaS** | Supabase (Lovable Cloud) | Latest | Auth, DB, Edge Functions, Storage |
| **Banco de Dados** | PostgreSQL | 15+ | RDBMS com RLS |
| **Edge Functions Runtime** | Deno | Latest | Serverless backend functions |
| **IA** | Lovable AI Gateway | Multi-model | Gemini 2.5, GPT-5 |
| **Animações** | Framer Motion | 12.x | Animações declarativas React |
| **Gráficos** | Recharts | 2.15+ | Gráficos SVG responsivos |
| **Formulários** | React Hook Form | 7.x | Formulários performáticos |
| **Validação** | Zod | 3.x | Schema validation TypeScript-first |
| **PDF** | jsPDF + jspdf-autotable | 4.x | Geração de PDFs no client |
| **Onboarding** | React Joyride | 2.9+ | Tours interativos |

## 5.2 Estrutura de Diretórios

```
gbrank-crm/
├── src/
│   ├── assets/                    # Imagens, logos, fotos
│   ├── components/                # ~180 componentes React
│   │   ├── agents/                # Modais de Agentes IA (4 agentes)
│   │   ├── alcateia/              # Componentes programa Alcateia
│   │   ├── admin/                 # PendingRegistrationsBanner, SystemHealthPanel
│   │   ├── agency/                # CreateAgencyModal
│   │   ├── bi/                    # KPICard, FunnelCharts, TrendCharts, AlertsPanel
│   │   ├── checklist/             # ChecklistBlock, ChecklistItem, ChecklistOverviewTable
│   │   ├── clients-v2/            # ClientV2Dialog, ClientsV2List
│   │   ├── commissions/           # CommissionCard, CommissionConfigPanel, CommissionForecast, etc.
│   │   ├── contracts/             # ContractEditor, ContractPreview, ContractWizard, SignatureCanvas, etc.
│   │   ├── dashboard/             # AIInsightsPanel, ExecutiveSummary
│   │   ├── execution/             # ExecutionChecklist, ExecutionExtras, ExecutionHeader
│   │   ├── landing/               # AnimatedCounter, ComparisonTable, FloatingParticles, GMBElements, etc.
│   │   ├── leads/                 # LeadsKanban, LeadDetailPanel, NewLeadDialog, ImportLeadsDialog, etc.
│   │   ├── manager-report/        # ExecutiveKPICard, HealthScoreGauge, RankingTable, WeeklyHeatmap, etc.
│   │   ├── notifications/         # NotificationBell
│   │   ├── nps/                   # NPSModal
│   │   ├── onboarding/            # OnboardingChecklist, VisualTour, VisualTourButton
│   │   ├── plan/                  # PlanLimitBadge, ProFeatureBadge, withPlanAccess HOC
│   │   ├── proposals/             # ProposalEditor, ProposalPreview, ProposalsList
│   │   ├── recurring/             # RecurringOverview, RecurringExecutionView, RoutineConfigCard, etc.
│   │   ├── subscription/          # SubscriptionBanner, SubscriptionGuard
│   │   ├── super-admin/           # EngagementRankingTab
│   │   ├── team/                  # InviteMemberDialog, TeamMemberCard
│   │   └── ui/                    # ~45 Shadcn/UI base components
│   ├── contexts/                  # 5 React Contexts
│   │   ├── AuthContext.tsx         # Sessão, roles, permissões, agency_id
│   │   ├── FunnelModeContext.tsx   # Vendas / Otimização / Recorrência
│   │   ├── QADebugContext.tsx      # Debug e QA tools
│   │   └── UndoRedoContext.tsx     # Undo/Redo global com Ctrl+Z/Y
│   ├── hooks/                     # 60+ custom hooks
│   ├── integrations/supabase/     # client.ts (auto-gerado), types.ts (auto-gerado)
│   ├── lib/                       # Utilitários (validation, mapping, formatting)
│   ├── pages/                     # 28 páginas
│   ├── stores/                    # Zustand stores (clientStore)
│   ├── types/                     # TypeScript interfaces (client, lead, contract, proposal)
│   └── utils/                     # visualPdfExport
├── supabase/
│   ├── config.toml                # Config Supabase (auto-gerado)
│   ├── functions/                 # 20+ Edge Functions (Deno)
│   │   ├── _shared/cors.ts        # CORS helper compartilhado
│   │   ├── admin-change-email/
│   │   ├── admin-reset-password/
│   │   ├── analyze-raiox/
│   │   ├── analyze-recurrence/
│   │   ├── analyze-seo/
│   │   ├── analyze-suspensao/
│   │   ├── auto-register-agency/
│   │   ├── bootstrap-users/
│   │   ├── check-notifications/
│   │   ├── convert-lead-to-client/
│   │   ├── create-agency-owner/
│   │   ├── create-user/
│   │   ├── daily-audit/
│   │   ├── dashboard-bi/
│   │   ├── generate-contract/
│   │   ├── generate-manager-report/
│   │   ├── generate-proposal/
│   │   ├── generate-recurring-tasks/
│   │   ├── lead-copilot/
│   │   ├── log-error/
│   │   ├── permissions/
│   │   ├── process-voice-command/
│   │   ├── reset-user-password/
│   │   ├── security-check/
│   │   ├── self-reset-password/
│   │   ├── send-to-autentique/
│   │   ├── unify-leads/
│   │   └── voice-to-text/
│   └── migrations/                # SQL migrations (auto-gerenciadas)
├── docs/                          # Documentação técnica
└── public/                        # Favicon, robots.txt, placeholder
```

## 5.3 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React 19)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Pages (28)  │  Components (~180)  │  Hooks (60+)  │  Stores (1)   │
│              │                     │                │               │
│  Contexts (5): AuthContext, FunnelModeContext, UndoRedoContext,     │
│                QADebugContext, ClientsProvider                      │
│              │                     │                │               │
│              └──────────┬──────────┘                │               │
│                         │                                           │
│              ┌──────────▼──────────┐                                │
│              │ @supabase/supabase-js│  ← TanStack Query (cache)     │
│              │   (client.ts)        │                                │
│              └──────────┬──────────┘                                │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ HTTPS (REST + Realtime WebSocket)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LOVABLE CLOUD (Supabase)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │  Auth        │  │  PostgreSQL  │  │   Edge Functions (Deno)   │  │
│  │  (Supabase   │  │  (35+ tables)│  │   (20+ functions)         │  │
│  │   Auth)      │  │              │  │                           │  │
│  │  • Login     │  │  • RLS       │  │  • create-user            │  │
│  │  • Register  │  │  • Triggers  │  │  • convert-lead-to-client │  │
│  │  • Password  │  │  • Views     │  │  • analyze-seo            │  │
│  │    Reset     │  │  • Functions │  │  • analyze-raiox          │  │
│  │  • Session   │  │  • Indexes   │  │  • generate-proposal      │  │
│  │    Mgmt      │  │              │  │  • generate-contract      │  │
│  └──────┬──────┘  └──────┬──────┘  │  • generate-manager-report │  │
│         │                │          │  • lead-copilot            │  │
│         │     ┌──────────▼──────┐  │  • permissions             │  │
│         │     │  current_agency │  │  • security-check          │  │
│         └────▶│  _id() → RLS   │  │  • check-notifications     │  │
│               │  policies       │  │  • daily-audit             │  │
│               └─────────────────┘  └───────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Lovable AI Gateway                              │    │
│  │  • google/gemini-2.5-pro (análises complexas)                │    │
│  │  • google/gemini-2.5-flash (respostas rápidas, chat)         │    │
│  │  • openai/gpt-5 (alternativa para casos específicos)         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 5.4 Contextos React — Descrição Detalhada

### 5.4.1 AuthContext (`src/contexts/AuthContext.tsx`)

**Responsabilidade:** Gerencia toda autenticação, autorização e contexto do usuário logado.

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `session` | `Session \| null` | Sessão Supabase Auth ativa |
| `user` | `User \| null` | Dados do usuário autenticado |
| `profile` | `Profile \| null` | Perfil público (nome, avatar, agency_id) |
| `role` | `AppRole` | Role atual (admin, operador, visualizador, etc.) |
| `isAdmin` | `boolean` | Se role é admin ou owner |
| `isSuperAdmin` | `boolean` | Se role é super_admin |
| `agencyId` | `string \| null` | UUID da agência atual |
| `permissions` | `UserPermissions` | Permissões granulares (canSales, canOps, etc.) |
| `derived` | `DerivedPermissions` | Permissões derivadas (canSalesOrAdmin, etc.) |

**Métodos:**
- `signIn(email, password)` → Login
- `signUp(email, password, metadata)` → Registro
- `signOut()` → Logout
- `resetPassword(email)` → Enviar email de reset

### 5.4.2 FunnelModeContext (`src/contexts/FunnelModeContext.tsx`)

**Responsabilidade:** Controla qual funil está ativo no dashboard.

| Estado | Tipo | Valores |
|--------|------|---------|
| `mode` | `FunnelMode` | `'sales' \| 'delivery' \| 'recurring'` |
| `isSalesMode` | `boolean` | Se modo vendas está ativo |
| `isDeliveryMode` | `boolean` | Se modo otimização está ativo |
| `isRecurringMode` | `boolean` | Se modo recorrência está ativo |
| `canAccessSales` | `boolean` | Se usuário tem permissão |
| `canAccessDelivery` | `boolean` | Se usuário tem permissão |
| `canAccessRecurring` | `boolean` | Se usuário tem permissão |

**Métodos:**
- `setMode(mode)` → Altera o funil ativo

### 5.4.3 UndoRedoContext (`src/contexts/UndoRedoContext.tsx`)

**Responsabilidade:** Sistema global de desfazer/refazer ações.

**Funcionalidades:**
- Pilha de ações com undo/redo
- Atalhos de teclado: `Ctrl+Z` (desfazer), `Ctrl+Y` (refazer)
- Integrado com movimentações no Kanban

### 5.4.4 QADebugContext (`src/contexts/QADebugContext.tsx`)

**Responsabilidade:** Ferramentas de QA e debug em desenvolvimento.

**Funcionalidades:**
- Painel deslizante com logs de ações
- Estado atual do sistema
- Diagnóstico de problemas
- Ativado via trigger no canto da tela

### 5.4.5 ClientsProvider (`src/components/ClientsProvider.tsx`)

**Responsabilidade:** Gerenciamento de clientes de otimização em memória.

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `clients` | `Client[]` | Lista de todos os clientes |
| `selectedClient` | `Client \| null` | Cliente selecionado |
| `viewMode` | `ViewMode` | Modo de visualização (kanban, table, etc.) |
| `isDetailOpen` | `boolean` | Se painel de detalhes está aberto |

---

# 6. SISTEMA DE MULTI-TENANCY

## 6.1 Modelo de Isolamento

Arquitetura **multi-tenant por discriminador** (`agency_id`) com Row Level Security (RLS) do PostgreSQL. Cada agência é um tenant completamente isolado.

## 6.2 Fluxo de Isolamento

```
1. Usuário faz login
   └─▶ Supabase Auth valida credenciais
       └─▶ Sistema busca profile.current_agency_id
           └─▶ Função SQL current_agency_id() retorna UUID
               └─▶ TODAS as políticas RLS filtram por agency_id
                   └─▶ Usuário só vê dados da sua agência
```

## 6.3 Função SQL Crítica

```sql
CREATE OR REPLACE FUNCTION public.current_agency_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_agency_id 
  FROM public.profiles 
  WHERE id = auth.uid()
$$;
```

Esta função é referenciada em **todas** as políticas RLS de **todas** as tabelas com `agency_id`.

## 6.4 Tabelas com Isolamento por `agency_id` (18+)

| # | Tabela | Descrição |
|---|--------|-----------|
| 1 | `agency_members` | Membros da agência |
| 2 | `audit_log` | Log de auditoria |
| 3 | `clients` | Clientes em execução (otimização) |
| 4 | `clients_v2` | Clientes (módulo CRM) |
| 5 | `commission_configs` | Configurações de comissão |
| 6 | `commission_roles` | Papéis de comissão |
| 7 | `commissions_v2` | Registros de comissões |
| 8 | `contracts` | Contratos digitais |
| 9 | `lead_activities` | Atividades de leads |
| 10 | `lead_sources` | Fontes de leads |
| 11 | `leads` | Oportunidades de venda |
| 12 | `lost_reasons` | Motivos de perda |
| 13 | `proposals` | Propostas comerciais |
| 14 | `questions` | Perguntas sobre clientes |
| 15 | `raiox_analyses` | Análises IA |
| 16 | `recurring_clients` | Clientes recorrentes |
| 17 | `recurring_routines` | Templates de rotinas |
| 18 | `recurring_tasks` | Instâncias de tarefas |
| 19 | `suggestions` | Sugestões da equipe |

## 6.5 Auto-preenchimento de `agency_id`

Cada tabela isolada possui trigger `BEFORE INSERT` que preenche `agency_id` automaticamente via `current_agency_id()`, eliminando necessidade de enviar agency_id pelo frontend.

---

# 7. AUTENTICAÇÃO, ROLES E PERMISSÕES

## 7.1 Hierarquia de Roles

```
┌─────────────────────────────────────────────────────────┐
│                  super_admin (SaaS Global)               │
│  ┌───────────────────────────────────────────────────┐  │
│  │              owner (Dono da Agência)               │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │           admin (Admin da Agência)           │  │  │
│  │  │  ┌─────────────────────────────────────┐    │  │  │
│  │  │  │ manager │ sales_rep │ operador      │    │  │  │
│  │  │  │         │           │ support       │    │  │  │
│  │  │  │         │           │ visualizador  │    │  │  │
│  │  │  └─────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 7.2 Tabela de Roles

| Role | Descrição | Escopo |
|------|-----------|--------|
| `super_admin` | Administrador global do SaaS | Todas as agências |
| `owner` | Proprietário da agência | Agência própria (full access) |
| `admin` | Administrador da agência | Agência (todas as permissões) |
| `manager` | Gestor | Visualização ampla + algumas ações |
| `sales_rep` | Vendedor | Leads, propostas, atividades |
| `operador` | Operador de execução | Clientes, checklist, tarefas |
| `support` | Suporte | Read-only + notas |
| `visualizador` | Visualização | Apenas leitura |

## 7.3 Permissões Granulares (`user_permissions`)

| Permissão | Descrição | Quem recebe por padrão |
|-----------|-----------|----------------------|
| `can_sales` | Acesso ao módulo de vendas | sales_rep, manager, admin, owner |
| `can_ops` | Acesso ao módulo de operação | operador, manager, admin, owner |
| `can_admin` | Acesso à administração | admin, owner |
| `can_finance` | Acesso às finanças | admin, owner |
| `can_recurring` | Acesso à recorrência | operador, manager, admin, owner |
| `is_super_admin` | Super admin global | super_admin |

## 7.4 Permissões Derivadas (Computed no Frontend)

| Derivada | Lógica |
|----------|--------|
| `canSalesOrAdmin` | `canSales \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin` |
| `canOpsOrAdmin` | `canOps \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin` |
| `canFinanceOrAdmin` | `canFinance \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin` |
| `canAdminOrIsAdmin` | `canAdmin \|\| isAdmin \|\| isSuperAdmin` |
| `canRecurringOrAdmin` | `canRecurring \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin` |

## 7.5 Fluxo de Autenticação Detalhado

```
1. Usuário acessa /auth
2. Insere email + senha (mínimo 8 chars, letras + números)
3. Supabase Auth valida credenciais
4. Sistema busca profile: SELECT * FROM profiles WHERE id = auth.uid()
5. Sistema busca role: SELECT role FROM user_roles WHERE user_id = auth.uid()
6. Sistema busca permissions: SELECT * FROM user_permissions WHERE user_id = auth.uid()
7. AuthContext é populado com session, user, profile, role, permissions, derived
8. SubscriptionGuard verifica status da assinatura da agência
9. Se OK → redirect para /dashboard
10. Se subscription bloqueada → redirect para /locked
```

## 7.6 Recuperação de Senha

1. Usuário clica "Esqueci minha senha" em `/auth`
2. Insere email → `supabase.auth.resetPasswordForEmail(email)`
3. Email de reset é enviado com link para `/auth?type=recovery&...`
4. Auth.tsx detecta parâmetros de recovery na URL
5. Formulário de nova senha é exibido (sem auto-login)
6. Usuário define nova senha → `supabase.auth.updateUser({ password })`
7. Redirect para login

## 7.7 Fluxo de Registro de Nova Agência

```
1. Usuário acessa /register
2. Preenche: Nome da agência, Slug, Nome do owner, Email, Senha
3. Validação: slug único, email válido, senha forte
4. Edge Function auto-register-agency:
   a. Cria registro em auth.users
   b. Cria profile com current_agency_id
   c. Cria agency com status 'pending'
   d. Cria agency_members com role 'owner'
   e. Cria agency_limits com defaults do plano
   f. Cria agency_usage zerado
5. Agência fica com status 'pending' até aprovação do super_admin
6. Super admin aprova em /super-admin → status = 'active'
```

---

# 8. MÓDULO 1 — FUNIL DE VENDAS (CRM DE LEADS)

## 8.1 Visão Geral

Pipeline visual em formato Kanban com 10 estágios configuráveis para gerenciar todo o ciclo comercial — desde "Lead Frio" até "Ganho" ou "Perdido". Inclui assistente de IA (Lead Copilot) que sugere próximos passos para cada oportunidade.

**Rota:** `/dashboard` (modo Vendas)  
**Permissão:** `canSalesOrAdmin`  
**Cor do funil:** Âmbar (#FFC107)

## 8.2 Modelo de Dados — Lead

```typescript
interface Lead {
  id: string;                        // UUID auto-gerado
  agency_id: string;                 // Isolamento multi-tenant
  company_name: string;              // Nome da empresa (obrigatório)
  contact_name: string | null;       // Nome do contato principal
  whatsapp: string | null;           // Número WhatsApp
  phone: string | null;              // Telefone fixo
  email: string | null;              // Email
  instagram: string | null;          // Handle Instagram
  city: string | null;               // Cidade
  main_category: string | null;      // Categoria do negócio no Google
  
  // Pipeline
  pipeline_stage: LeadPipelineStage; // Estágio atual (10 possíveis)
  temperature: 'cold' | 'warm' | 'hot'; // Temperatura do lead
  probability: number;               // Probabilidade de fechamento (0-100)
  estimated_value: number | null;    // Valor estimado da venda (R$)
  
  // Próxima ação
  next_action: string | null;        // Descrição da próxima ação
  next_action_date: string | null;   // Data limite para próxima ação
  
  // Proposta vinculada
  proposal_url: string | null;       // URL da proposta
  proposal_status: ProposalStatus;   // Status da proposta
  proposal_notes: string | null;     // Notas sobre a proposta
  
  // Status final
  status: 'open' | 'gained' | 'lost' | 'future';
  lost_reason_id: string | null;     // FK para lost_reasons
  lost_notes: string | null;         // Notas sobre perda
  converted_client_id: string | null; // FK para clients (quando ganho)
  converted_at: string | null;       // Data da conversão
  
  // Fonte
  source_id: string | null;          // FK para lead_sources
  
  // Responsável
  responsible: string;               // Nome do responsável
  created_by: string;                // UUID do criador
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_activity_at: string;          // Última interação registrada
}
```

## 8.3 Estágios do Pipeline (10)

| # | Estágio (slug) | Emoji | Cor | Descrição Funcional |
|---|---------------|-------|-----|-------------------|
| 1 | `cold` | 🧊 | Cinza | Lead frio — sem contato inicial, apenas identificado |
| 2 | `contacted` | 📞 | Azul | Primeiro contato realizado (WhatsApp, ligação, DM) |
| 3 | `qualified` | ✅ | Ciano | Lead qualificado — tem potencial real de compra |
| 4 | `meeting_scheduled` | 📅 | Roxo | Reunião/call de vendas agendada |
| 5 | `meeting_done` | 🤝 | Índigo | Reunião realizada — lead demonstrou interesse |
| 6 | `proposal_sent` | 📄 | Âmbar | Proposta comercial enviada via link rastreável |
| 7 | `negotiating` | 💬 | Laranja | Em negociação ativa (preço, escopo, prazos) |
| 8 | `future` | ⏳ | Cinza | Lead para contato futuro (timing não é agora) |
| 9 | `gained` | ✅ | Verde | Venda fechada → aciona conversão para cliente |
| 10 | `lost` | ❌ | Vermelho | Oportunidade perdida → requer motivo |

## 8.4 Temperatura do Lead

| Temperatura | Emoji | Descrição | Regras de Automação |
|-------------|-------|-----------|-------------------|
| `cold` 🧊 | Frio | Baixo interesse / sem contato | Default ao criar. Regredido se 7+ dias sem atividade |
| `warm` 🌤️ | Morno | Interesse moderado | Após 2 atividades registradas |
| `hot` 🔥 | Quente | Alto interesse, pronto para fechar | Após reunião realizada ou proposta enviada |

## 8.5 Telas e Componentes — Detalhamento

### 8.5.1 Dashboard de Vendas

**Componentes renderizados:**
- `SalesDashboard` → KPIs de vendas no topo
- `SalesOverview` → Resumo visual de métricas
- `LeadsKanban` → Kanban arrastável (drag & drop entre colunas)

**KPIs exibidos (SalesDashboard):**
- Total de leads ativos (status = 'open')
- Leads quentes 🔥
- Valor estimado total (soma de estimated_value)
- Taxa de conversão do período
- Leads sem atividade > 3 dias (alerta)

**Interações no Kanban (LeadsKanban):**
- **Drag & Drop:** Arrastar lead entre colunas altera `pipeline_stage`
- **Click no card:** Abre `LeadDetailPanel` lateral
- **Filtros:** Por responsável, temperatura, cidade, fonte
- **Busca:** Busca textual por nome da empresa
- **Configurar colunas:** `ColumnSettingsDialog` permite reordenar/ocultar colunas

### 8.5.2 Painel de Detalhes do Lead (`LeadDetailPanel`)

Painel lateral (Sheet) que abre ao clicar em um lead, com 5 abas:

#### Aba 1: Atividades (`LeadActivityTab`)
- **Exibição:** Timeline cronológica de todas as interações
- **Criar atividade:** Botão "+ Nova Atividade"
  - Tipos: `whatsapp`, `call`, `meeting`, `note`, `follow_up`, `email`
  - Campos: tipo, conteúdo (texto livre), link opcional
  - Registra automaticamente: `created_by`, `created_at`
- **Cada atividade mostra:** Tipo (com ícone), conteúdo, autor, data, link

#### Aba 2: Proposta (`LeadProposalTab`)
- **Se sem proposta:** Botão "Criar Proposta" → navega para `/propostas?leadId=xxx`
- **Se com proposta:** Link da proposta, status, notas
- **Status da proposta:** não enviada, enviada, em revisão, aprovada, rejeitada

#### Aba 3: Conversão (`LeadConversionTab`)
- **Botão "Ganhou!":** Converte lead para cliente
  - Solicita tipo de plano: "Único" (otimização) ou "Recorrência"
  - Aciona Edge Function `convert-lead-to-client`
- **Botão "Perdeu":** Marca lead como perdido
  - Solicita motivo de perda (dropdown `lost_reasons`)
  - Campo para notas adicionais
- **Botão "Futuro":** Move para contato futuro
  - Solicita data de recontato

#### Aba 4: Raio-X (`LeadRaioXTab`)
- Análise de IA da chamada/reunião de vendas
- Transcrição de áudio (via Edge Function `analyze-raiox`)
- Identificação de objeções do lead
- Sugestão de scripts de resposta
- Próximos passos recomendados

#### Aba 5: Copilot (`LeadCopilotTab` → `LeadCopilotPanel`)
- Chat contextual com IA sobre o lead
- **Ações automáticas:**
  - "Resumir lead" → gera resumo das informações e atividades
  - "Sugerir ação" → sugere próximo passo baseado no histórico
  - "Avaliar qualidade" → score de qualidade do lead
- Edge Function: `lead-copilot`

### 8.5.3 Criar Novo Lead (`NewLeadDialog`)

Modal de criação com os seguintes campos:

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Nome da empresa | Text | ✅ | Min 2 caracteres |
| Nome do contato | Text | ❌ | Max 200 caracteres |
| WhatsApp | Phone | ❌ | Formato brasileiro |
| Telefone | Phone | ❌ | Formato brasileiro |
| Email | Email | ❌ | Formato email válido |
| Instagram | Text | ❌ | — |
| Cidade | Text | ❌ | — |
| Categoria principal | Text | ❌ | — |
| Fonte do lead | Select | ❌ | Dropdown de `lead_sources` |
| Estágio inicial | Select | ❌ | Default: `cold` |
| Temperatura | Select | ❌ | Default: `cold` |
| Valor estimado | Currency | ❌ | — |
| Responsável | Select | ❌ | Lista de membros da agência |
| Notas | Textarea | ❌ | — |

**Detecção de duplicados:** Ao digitar o nome da empresa, sistema busca leads existentes com nome similar e exibe `DuplicateConflictModal` se encontrar.

### 8.5.4 Importar Leads (`ImportLeadsDialog`)

- Upload de arquivo CSV ou Excel
- Mapeamento de colunas do arquivo para campos do sistema
- Detecção automática de duplicados
- Preview dos dados antes de importar
- Relatório de importação (importados, duplicados, erros)

### 8.5.5 Unificar Leads Duplicados

Edge Function `unify-leads`:
- Recebe IDs dos leads duplicados
- Merge de dados (prioriza o mais completo)
- Consolida atividades de ambos
- Mantém histórico completo

## 8.6 Conversão Lead → Cliente

### Fluxo Técnico Completo

```
1. Usuário clica "Ganhou!" no LeadConversionTab
2. Modal solicita tipo de plano: "Único" ou "Recorrência"
3. Frontend chama Edge Function convert-lead-to-client:
   a. Valida autenticação e permissões
   b. Cria registro em tabela clients:
      - company_name ← lead.company_name
      - city ← lead.city
      - main_category ← lead.main_category
      - responsible ← lead.responsible
      - column_id ← 'onboarding'
      - plan_type ← selecionado pelo usuário
   c. Se tipo = 'recurring': Cria em recurring_clients também
   d. Atualiza lead:
      - status ← 'gained'
      - converted_client_id ← novo client.id
      - converted_at ← now()
   e. Registra atividade no lead: "Lead convertido para cliente"
4. Frontend exibe toast de sucesso
5. FunnelModeContext muda para modo 'delivery' automaticamente
6. Usuário é direcionado ao Kanban de Otimização
```

## 8.7 Fontes de Lead (`lead_sources`)

Tabela configurável por agência:
- Instagram, Indicação, Google Ads, Site, WhatsApp, Evento, Parceiro, Outros
- Cada agência pode adicionar/editar fontes customizadas

## 8.8 Motivos de Perda (`lost_reasons`)

Tabela configurável por agência:
- Preço alto, Concorrência, Timing inadequado, Sem necessidade, Não respondeu, Desistiu, Outro

---

# 9. MÓDULO 2 — FUNIL DE OTIMIZAÇÃO (DELIVERY)

## 9.1 Visão Geral

Kanban de clientes em execução com **checklist detalhado de 47 itens** divididos em 5 etapas de otimização do perfil Google Meu Negócio. Este é o módulo core do sistema — o que diferencia o GBRANK de qualquer outro CRM.

**Rota:** `/dashboard` (modo Otimização)  
**Permissão:** `canOpsOrAdmin`  
**Cor do funil:** Verde primário (#00FCA8)

## 9.2 Modelo de Dados — Client

```typescript
interface Client {
  id: string;
  agency_id: string;
  companyName: string;               // Nome da empresa
  googleProfileUrl?: string;         // URL do perfil Google Meu Negócio
  driveUrl?: string;                 // Pasta no Google Drive
  whatsappGroupUrl?: string;         // Link do grupo WhatsApp
  whatsappLink?: string;             // Link direto WhatsApp do contato
  whatsappLinkShort?: string;        // Link curto
  yahooEmail?: string;               // Email Yahoo (para ferramentas Google)
  
  // Classificação
  planType: 'unique' | 'recurring';  // Otimização única ou recorrência
  isOwner: boolean;                  // Se cliente é proprietário do perfil Google
  mainCategory?: string;             // Categoria principal do negócio
  keywords?: string[];               // Palavras-chave alvo
  city?: string;                     // Cidade
  
  // Status
  status: 'on_track' | 'delayed' | 'pending_client';
  columnId: ColumnId;                // Coluna atual no Kanban
  photoMode?: 'with_photos' | 'without_photos' | 'pending';
  
  // Conteúdo
  checklist: ChecklistSection[];     // Checklist com 47 itens em 5 seções
  comparisons: Comparison[];         // Fotos antes/depois
  history: HistoryEntry[];           // Log de todas as ações
  notes?: string;                    // Notas gerais
  briefing?: string;                 // Briefing do cliente
  
  // Datas
  responsible: string;               // Nome do responsável
  startDate: string;                 // Data de início
  lastUpdate: string;                // Última atualização
  suspendedAt?: string;              // Data de suspensão (se aplicável)
  deletedAt?: string;                // Soft delete
  
  // Extras
  attachments?: string[];            // URLs de anexos
  attachmentsCount?: number;
  profileImage?: string;             // Imagem do perfil do cliente
  coverConfig?: CoverConfig;         // Configuração de capa
  labels?: ClientLabel[];            // Etiquetas coloridas
  usefulLinks?: UsefulLink[];        // Links úteis customizados
}
```

## 9.3 Colunas do Kanban (7)

| # | Coluna (ID) | Emoji | Cor | Descrição Funcional |
|---|-------------|-------|-----|-------------------|
| 1 | `suspended` | ⏸️ | Vermelho | Clientes suspensos — problema a resolver antes de continuar |
| 2 | `pipeline` | 🔍 | Laranja | Fila de espera — verificação antes de iniciar |
| 3 | `onboarding` | ▶️ | Azul | Pronto para iniciar execução |
| 4 | `optimization` | 🚀 | Âmbar | Em processo de otimização ativa |
| 5 | `ready_to_deliver` | ⚠️ | Amarelo | Feito pelo operador, mas há pendência do cliente |
| 6 | `finalized` | ✅ | Verde | 100% concluído, pronto para entrega formal |
| 7 | `delivered` | 📦 | Verde escuro | Entregue — vai para arquivo |

## 9.4 Checklist de Execução — 47 Itens em 5 Etapas

### Etapa 1: Onboarding (4 itens)

| # | Item | Descrição Operacional |
|---|------|----------------------|
| 1 | Fechar venda e criar grupo de comunicação | Criar grupo WhatsApp com cliente |
| 2 | Alterar foto do grupo | Trocar para foto padrão da agência |
| 3 | Dar boas vindas no grupo | Mensagem inicial padronizada |
| 4 | Agendar reunião de briefing | Até 48h após fechamento |

### Etapa 2: Preparação (12 itens)

| # | Item | Descrição Operacional |
|---|------|----------------------|
| 1 | Criar ou obter conta de e-mail | Email dedicado ao projeto |
| 2 | Criar pasta no armazenamento em nuvem | Google Drive ou similar |
| 3 | Configurar ferramentas de IA | ChatGPT, Canva, etc. |
| 4 | Registrar métricas ANTES | Screenshot do painel antes da otimização |
| 5 | Realizar briefing + obter propriedade do Perfil | Chamada com cliente |
| 6 | Criar documento de briefing/notas | Registrar no card do cliente |
| 7 | Criar slogans e validar com cliente | Frases para postagens |
| 8 | Criar link de contato direto | Link wa.me ou similar |
| 9 | Inserir link de contato no perfil e ativar chat | Configurar no Google |
| 10 | Definir modo de fotos | "Agência tira" ou "Cliente envia" |
| 11 | Tirar fotos da empresa | Se agência vai tirar |
| 12 | Solicitar fotos ao cliente | Se cliente vai enviar |

### Etapa 3: Produção (7 itens)

| # | Item | Descrição Operacional |
|---|------|----------------------|
| 1 | Editar fotos da empresa | Tratamento profissional |
| 2 | Salvar fotos editadas na pasta | Organizar na cloud |
| 3 | Criar modelo de geolocalização | Template para geotagging |
| 4 | Criar designs de produtos | Artes para catálogo |
| 5 | Criar designs de postagens | Templates de posts |
| 6 | Criar arte de QR Codes | Para divulgação |
| 7 | Buscar ou criar vídeos | Mínimo 3 vídeos |

### Etapa 4: Otimização (13 itens)

| # | Item | Descrição Operacional |
|---|------|----------------------|
| 1 | Atualizar informações principais | Nome, endereço, telefone, horários |
| 2 | Responder todas as avaliações | Usar palavras-chave nas respostas |
| 3 | Pesquisar, definir e ajustar categorias | Primária + secundárias |
| 4 | Subir fotos com palavras-chave e geo | Metadata otimizada |
| 5 | Subir fotos editadas e vídeos | Upload no perfil |
| 6 | Criar e incluir serviços | Com palavras-chave |
| 7 | Subir produtos | Catálogo de produtos |
| 8 | Criar e subir postagens | Posts Google |
| 9 | Alterar nome com palavras-chave | Validar com admin |
| 10 | Responder perguntas e respostas | Q&A do perfil |
| 11 | Criar FAQs no perfil | Perguntas frequentes |
| 12 | Cadastrar empresa em diretórios | Citations e NAP consistency |
| 13 | Criar perfis em redes sociais | Com nome otimizado |

### Etapa 5: Entrega (9 itens)

| # | Item | Descrição Operacional |
|---|------|----------------------|
| 1 | Conferir materiais organizados | Revisão final da pasta |
| 2 | Registrar métricas DEPOIS | Screenshot pós-otimização |
| 3 | Criar relatório de entrega | Comparativo ANTES x DEPOIS |
| 4 | Verificar proprietário principal | Cliente como owner do perfil |
| 5 | Manter acesso como administrador | Agência fica como admin |
| 6 | Entregar com apresentação | Apresentação formal dos resultados |
| 7 | Solicitar indicação | Pedir indicações de novos clientes |
| 8 | Oferecer plano de recorrência | Se cliente for estratégico |
| 9 | 💰 Pagar comissão da equipe | Gerar comissão no sistema |

## 9.5 Telas e Componentes

### 9.5.1 Modos de Visualização (8)

| Modo | Componente | Descrição |
|------|-----------|-----------|
| `kanban` | `KanbanBoard` | Kanban arrastável (padrão) |
| `table` | `ProgressTable` | Tabela com colunas, progresso, status |
| `checklist` | `ChecklistOverviewTable` | Visão do checklist de todos os clientes |
| `timeline` | `TimelineView` | Timeline cronológica de atividades |
| `calendar` | `CalendarView` | Calendário com compromissos |
| `cards` | `CardsView` | Cards visuais lado a lado |
| `overview` | `ManagerOverview` | Visão gerencial com KPIs |
| `tasks` | `MyTasksView` | Minhas tarefas pendentes |

### 9.5.2 Painel de Detalhes do Cliente (`ClientDetailPanel`)

**Cabeçalho:**
- Nome da empresa, cidade, categoria
- Badge de status (Em dia ✅, Atrasado 🔴, Aguardando ⏳)
- Barra de progresso do checklist (XX%)
- Botões de ação rápida: Editar, Mover, Suspender, Excluir

**4 Abas:**

1. **Checklist** → 5 seções expansíveis com todos os 47 itens
   - Cada item: checkbox, título, nota opcional, anexo opcional
   - Progresso por seção e geral

2. **Comparações** → Upload de fotos Antes/Depois
   - Side-by-side ou slider comparativo

3. **Histórico** → Log cronológico de todas as ações
   - Movimentações no kanban, checklist, notas, edições

4. **Configurações** → Dados do cliente, links, anexos
   - Google Profile URL, Drive, WhatsApp
   - Labels, links úteis, responsável

### 9.5.3 Tela de Execução Full-Screen (`ClientExecutionView`)

Modal full-screen para foco total na execução:
- Header: nome do cliente, progresso, timer
- Checklist expansível por etapa
- Campo de notas por item
- Galeria de anexos
- Timer de tarefa (cronômetro)

### 9.5.4 Criar Novo Cliente (`NewClientWizard`)

Wizard em 3 steps:

**Step 1 — Dados básicos:**
- Nome da empresa*, Responsável*, Cidade, Categoria, Palavras-chave

**Step 2 — Links:**
- URL do perfil Google, WhatsApp, Pasta no Drive, Grupo WhatsApp

**Step 3 — Configurações:**
- Tipo de plano (Único/Recorrência), Modo de fotos, Data de início, Notas

## 9.6 Status do Cliente

| Status | Cor | Lógica |
|--------|-----|--------|
| `on_track` ✅ | Verde | Última atualização < 3 dias |
| `delayed` 🔴 | Vermelho | Última atualização ≥ 3 dias |
| `pending_client` ⏳ | Amarelo | Aguardando ação/resposta do cliente |

## 9.7 Labels (Etiquetas)

Sistema de etiquetas coloridas customizáveis:
- Urgente (vermelho), VIP (dourado), Novo (azul), Indicação (verde), Problema (laranja)
- Cada agência pode criar labels customizadas

## 9.8 Conversão Otimização → Recorrência

Quando o checklist atinge 100% e o cliente demonstra interesse em continuar:

```
1. Botão "Fechou Recorrência?" aparece (RecurrenceConversionDialog)
2. Modal de confirmação:
   - "O que acontece se virar recorrente:"
   - • Cliente será movido para o funil de Recorrência
   - • Tarefas periódicas serão criadas automaticamente
   - • Ele sairá do funil de Otimização
3. Opções: "Sim, fechou recorrência!" ou "Não fechou"
4. Ao confirmar:
   a. clients.plan_type = 'recurring'
   b. Cria registro em recurring_clients
   c. Gera primeiras tarefas via generate-recurring-tasks
   d. FunnelMode muda para 'recurring'
```

---

# 10. MÓDULO 3 — GESTÃO DE RECORRÊNCIA

## 10.1 Visão Geral

Gerencia clientes com planos mensais — tarefas repetitivas como responder avaliações, criar posts, atualizar fotos. Diferente do funil de otimização (projeto único com início/fim), a recorrência é contínua.

**Rota:** `/dashboard` (modo Recorrência) ou `/recorrencia`  
**Permissão:** `canRecurringOrAdmin`  
**Cor do funil:** Violeta (#8B5CF6)

## 10.2 Modelos de Dados

### Recurring Client
```typescript
interface RecurringClient {
  id: string;
  agency_id: string;
  client_id?: string;               // FK opcional para clients (legado)
  company_name: string;
  responsible_name: string;
  responsible_user_id?: string;      // FK para profiles
  schedule_variant: 'A' | 'B' | 'C' | 'D'; // Distribuição de carga
  monthly_value: number;             // Valor mensal (R$)
  start_date: string;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  timezone: string;                  // Default: 'America/Sao_Paulo'
}
```

### Recurring Routine (Template)
```typescript
interface RecurringRoutine {
  id: string;
  agency_id: string;
  title: string;                     // Ex: "Responder Avaliações"
  description?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  occurrences_per_period: number;    // Ex: 2x por semana
  rules_json?: object;               // Regras adicionais (offsetDays, etc.)
  sort_order: number;
  active: boolean;
}
```

### Recurring Task (Instância)
```typescript
interface RecurringTask {
  id: string;
  agency_id: string;
  recurring_client_id: string;       // FK para recurring_clients
  routine_id: string;                // FK para recurring_routines
  due_date: string;                  // Data de vencimento
  status: 'pending' | 'completed';
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  notes?: string;
}
```

## 10.3 Rotinas Padrão

| # | Rotina | Frequência | Vezes/Período |
|---|--------|-----------|---------------|
| 1 | Responder Avaliações | Semanal | 2x |
| 2 | Criar Postagem | Semanal | 1x |
| 3 | Atualizar Fotos | Mensal | 1x |
| 4 | Verificar Informações | Mensal | 1x |
| 5 | Relatório de Performance | Mensal | 1x |
| 6 | Monitorar Ranking | Semanal | 1x |
| 7 | Responder Perguntas | Semanal | 1x |

## 10.4 Variantes de Agenda (A/B/C/D)

Distribui a carga de trabalho para evitar "picos":

| Variante | Offset | Lógica |
|----------|--------|--------|
| A | 0 | Tarefas nas segundas e quintas |
| B | 1 | Tarefas nas terças e sextas |
| C | 2 | Tarefas nas quartas e sábados |
| D | 3 | Tarefas nas quintas e domingos |

## 10.5 Geração Automática de Tarefas

Edge Function `generate-recurring-tasks`:

```
1. Recebe daysAhead (default: 14, max: 30)
2. Busca routines ativas (recurring_routines WHERE active = true)
3. Busca clients ativos (recurring_clients WHERE status = 'active')
4. Para cada client × routine:
   a. Calcula datas baseado em frequency + variant offset
   b. Gera tarefas para os próximos N dias
5. Upsert em batch (500 por vez) com ON CONFLICT DO NOTHING
6. Retorna: { tasksCreated, totalClients, totalRoutines }
```

## 10.6 Telas e Componentes

### 10.6.1 Overview de Recorrência (`RecurringOverview`)

**KPIs:**
- Clientes recorrentes ativos
- MRR (Monthly Recurring Revenue)
- Tarefas para hoje
- Tarefas atrasadas
- Taxa de compliance (%)

**Lista de clientes:**
- Card por cliente: nome, responsável, status, compliance, valor

### 10.6.2 Execução (`RecurringExecutionView`)

**Funcionalidades:**
- Lista de tarefas ordenadas por data
- Filtros: por cliente, rotina, status
- Botão "Concluir" → marca como completed, registra who + when
- Notas por tarefa
- Histórico de conclusões

### 10.6.3 Card do Cliente Recorrente (`ClientRecurringCard`)

- Checklist de tarefas pendentes
- Histórico de tarefas concluídas
- Configurações (variante, valor, status)
- Botão "Relatório IA" → `RecurrenceReportAgent`

## 10.7 Relatório IA de Recorrência

Edge Function `analyze-recurrence`:
- Performance do cliente no período
- Taxa de conclusão de tarefas
- Sugestões de melhorias
- Alertas de atrasos ou problemas

---

# 11. MÓDULO 4 — PROPOSTAS COMERCIAIS

## 11.1 Visão Geral

Criação, envio e rastreamento de propostas comerciais com blocos editáveis, variáveis dinâmicas, geração por IA e link público rastreável.

**Rota:** `/propostas`  
**Permissão:** `canSalesOrAdmin`

## 11.2 Modelo de Dados — Proposal

```typescript
interface Proposal {
  id: string;
  agency_id: string;
  lead_id?: string;
  client_id?: string;
  
  title: string;
  client_name: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  city?: string;
  
  blocks: ProposalBlock[];           // Blocos de conteúdo editáveis
  variables: Record<string, string>; // Variáveis dinâmicas
  
  full_price?: number;
  discounted_price?: number;
  installments?: number;
  installment_value?: number;
  payment_method?: string;
  discount_reason?: string;
  valid_until?: string;
  
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  
  public_token?: string;             // Token UUID para link público
  public_url?: string;
  sent_at?: string;
  first_viewed_at?: string;
  last_viewed_at?: string;
  view_count: number;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  
  ai_generated: boolean;
  ai_prompt?: string;
}
```

## 11.3 Blocos de Proposta (7 tipos)

| Tipo | Emoji | Descrição | Obrigatório |
|------|-------|-----------|-------------|
| `diagnosis` | 📌 | Diagnóstico do problema | Não |
| `objective` | 🎯 | Objetivo do projeto | Não |
| `scope` | 🔧 | Escopo estratégico (com checklist) | Sim |
| `investment` | 💰 | Valores e condições de pagamento | Sim |
| `timeline` | 📅 | Cronograma de execução | Não |
| `guarantee` | 🛡️ | Garantias oferecidas | Não |
| `custom` | ✏️ | Bloco personalizado livre | Não |

## 11.4 Variáveis Dinâmicas

`{{nome_empresa}}`, `{{cidade}}`, `{{palavras_chave}}`, `{{valor}}`, `{{parcelas}}`, `{{data}}`

## 11.5 Fluxo de Status

```
draft → sent → viewed → accepted → (gera contrato)
                    ↘ rejected
                    ↘ expired (após valid_until)
```

## 11.6 Telas

- **Lista** (`/propostas`): Todas as propostas, filtros, busca, badges de status
- **Editor** (`ProposalEditor`): Adicionar/editar blocos, preview lado a lado, gerar com IA
- **Preview** (`ProposalPreview`): Visualização formatada, copiar link, enviar, baixar PDF
- **Pública** (`/proposta/:token`): Sem login, rastreia views, botões aceitar/rejeitar

## 11.7 Geração com IA

Edge Function `generate-proposal`:
- Input: dados do lead, prompt do usuário
- Output: blocos de proposta gerados
- Modelo: Gemini 2.5 Flash

---

# 12. MÓDULO 5 — CONTRATOS DIGITAIS

## 12.1 Visão Geral

Geração e gestão de contratos com cláusulas customizáveis, variáveis dinâmicas, assinatura digital com canvas e registro de IP/timestamp.

**Rota:** `/contratos`  
**Permissão:** `canSalesOrAdmin`

## 12.2 Tipos de Contrato

| Tipo | Emoji | Descrição |
|------|-------|-----------|
| `single_optimization` | 📍 | Projeto fechado de otimização (30-60 dias) |
| `recurring` | 🔁 | Contrato mensal de recorrência |
| `custom` | ✍️ | Contrato personalizado |

## 12.3 Cláusulas Padrão (12-13)

1. Identificação das Partes (`parties`)
2. Proteção de Dados — LGPD (`lgpd`)
3. Objeto do Contrato (`object`)
4. Escopo do Projeto (`scope`)
5. Prazo de Execução (`execution_term`)
6. Investimento e Forma de Pagamento (`investment`)
7. Responsabilidades da Contratada (`obligations_contractor`)
8. Responsabilidades do Contratante (`obligations_contracted`)
9. Limites de Responsabilidade (`liability_limits`)
10. Rescisão (`rescission`)
11. Confidencialidade (`confidentiality`)
12. Foro e Validade (`forum`)
13. Assinaturas (`signatures`)
14. *Termos de Recorrência* (`recurring_terms`) — apenas para contratos recorrentes

## 12.4 Variáveis de Contrato (16)

`{{nome_empresa}}`, `{{cnpj}}`, `{{cpf}}`, `{{email}}`, `{{endereco}}`, `{{responsavel}}`, `{{telefone}}`, `{{data}}`, `{{valor}}`, `{{valor_desconto}}`, `{{parcelas}}`, `{{valor_parcela}}`, `{{prazo_execucao}}`, `{{cidade}}`, `{{agencia_nome}}`, `{{agencia_cnpj}}`

## 12.5 Assinatura Digital

Página pública `/contrato/:token`:
1. Visualização completa do contrato
2. Formulário: Nome completo*, CPF* (validado), Checkbox de aceite
3. Canvas para assinatura manuscrita (`SignatureCanvas`)
4. Ao assinar: registra IP, user-agent, timestamp
5. Contrato muda para status `signed`

## 12.6 Fluxo Proposta → Contrato

```
1. Proposta aceita pelo cliente
2. Botão "Gerar Contrato" na proposta
3. Navega para /contratos?proposalId=XXX
4. Dados pré-preenchidos da proposta
5. Usuário revisa cláusulas e envia para assinatura
```

## 12.7 Geração de Cláusulas com IA

Edge Function `generate-contract`:
- Input: contractType, clientName, companyName, city, services, customPrompt
- Output: JSON com clauses[], suggestedTitle, suggestedTermDays
- Modelo: Gemini 2.5 Flash
- Cláusulas em português formal com linguagem acessível

---

# 13. MÓDULO 6 — SISTEMA DE COMISSÕES

## 13.1 Visão Geral

Gestão financeira de comissões da equipe com configuração flexível por colaborador, múltiplos tipos de gatilho e fluxo de aprovação.

**Rota:** `/commissions`  
**Permissão:** `canFinanceOrAdmin`

## 13.2 Tipos de Destinatário

| Tipo | Descrição |
|------|-----------|
| `sdr` | Sales Development Representative |
| `seller` | Vendedor |
| `photographer` | Fotógrafo |
| `operational` | Operador |
| `designer` | Designer |
| `freelancer` | Freelancer externo |

## 13.3 Status da Comissão

```
pending → approved → paid
                  ↘ cancelled
```

## 13.4 Configuração por Colaborador

| Campo | Opções |
|-------|--------|
| Tipo | `fixed` (R$ fixo) ou `percentage` (% sobre valor) |
| Modelo | `per_sale`, `per_delivery`, `per_task` |
| Gatilho | `sale_closed`, `client_delivered`, `monitoring_complete` |
| Status inicial | `pending` (requer aprovação) ou `approved` (automático) |

## 13.5 Telas

- **Dashboard** (`/commissions`): 4 abas (Pendentes, Aprovadas, Pagas, Configurações)
- **KPIs**: Total pendente, aprovado, pago no mês, projeção
- **CommissionCard**: Nome do cliente, destinatário, valor, status, ações
- **CommissionConfigPanel**: CRUD de regras de comissão
- **CommissionTimeline**: Visualização cronológica
- **CommissionForecast**: Projeção financeira
- **CommissionsByRecipient**: Agrupamento por pessoa

---

# 14. MÓDULO 7 — AGENTES DE INTELIGÊNCIA ARTIFICIAL

## 14.1 Inventário de Agentes

| # | Agente | Edge Function | Modelo | Acesso |
|---|--------|--------------|--------|--------|
| 1 | Lead Copilot | `lead-copilot` | Gemini 2.5 Flash | Aba "Copilot" no lead |
| 2 | Raio-X | `analyze-raiox` | Gemini 2.5 Pro | `/raio-x` ou aba no lead |
| 3 | Agente SEO | `analyze-seo` | Gemini 2.5 Pro | `/agente-seo` |
| 4 | Agente Suspensões | `analyze-suspensao` | Gemini 2.5 Pro | `/agente-suspensoes` |
| 5 | Relatório de Recorrência | `analyze-recurrence` | Gemini 2.5 Flash | Card do cliente recorrente |
| 6 | Gerador de Propostas | `generate-proposal` | Gemini 2.5 Flash | Editor de proposta |
| 7 | Gerador de Contratos | `generate-contract` | Gemini 2.5 Flash | Editor de contrato |
| 8 | Relatório Gerencial IA | `generate-manager-report` | Gemini 2.5 Pro | `/relatorio-gestor` |

## 14.2 Detalhamento por Agente

### Lead Copilot
- **Input:** Dados do lead + histórico de atividades
- **Output:** Resumo, sugestões de ação, score de qualidade, chat contextual
- **UX:** Chat interativo na aba do lead

### Raio-X
- **Input:** Link de gravação de chamada, contexto do lead
- **Output:** Transcrição, objeções identificadas, script de resposta, próximos passos
- **UX:** Modal com formulário de input e resultado estruturado

### Agente SEO
- **Input:** URL do perfil Google, categoria, cidade, palavras-chave
- **Output:** Diagnóstico de otimização, pontos de melhoria, sugestões, checklist
- **UX:** Página `/agente-seo` com formulário e resultado

### Agente Suspensões
- **Input:** URL do perfil suspenso, histórico, ações recentes
- **Output:** Motivos prováveis, plano de recuperação, passos para recurso, prevenção
- **UX:** Página `/agente-suspensoes` com formulário e resultado

---

# 15. MÓDULO 8 — RELATÓRIO GERENCIAL

## 15.1 Visão Geral

Dashboard executivo com métricas consolidadas, ranking de equipe, projeções financeiras e insights de IA.

**Rota:** `/relatorio-gestor`  
**Permissão:** `canAdminOrIsAdmin`

## 15.2 Componentes

| Componente | Descrição |
|-----------|-----------|
| `ExecutiveKPICard` | Cards com métricas principais (leads, conversão, receita) |
| `FunnelVisualization` | Gráfico de funil de vendas |
| `RankingTable` | Ranking de equipe por performance |
| `TrendComparisonTable` | Comparação período a período |
| `WeeklyHeatmap` | Mapa de calor de atividade semanal |
| `HealthScoreGauge` | Score de saúde da agência (0-100) |
| `FinancialProjection` | Gráfico de receita real vs. projetada |
| `AIInsightsPanel` | Insights gerados por IA |
| `AlertsList` | Alertas críticos (leads frios, atrasos, etc.) |
| `CrossAnalysisChart` | Análise cruzada de métricas |

## 15.3 Filtros

- Período: 7 dias, 30 dias, 90 dias, ano, custom
- Responsável
- Tipo de serviço
- Cidade/região

---

# 16. MÓDULO 9 — ADMINISTRAÇÃO E EQUIPE

## 16.1 Gestão de Usuários (`/admin`)

**Funcionalidades completas:**
- Listar todos os usuários da agência
- Criar novo usuário (nome, email, senha, role)
- Editar role e permissões granulares
- Resetar senha de outro usuário
- Suspender/reativar usuário
- Excluir usuário

## 16.2 Gestão de Equipe (`/equipe`)

- Cards visuais dos membros
- Convidar membro via email com link único
- Gerenciar convites pendentes
- Remover membro

## 16.3 Convites (`/convite/:token`)

**Fluxo:**
1. Admin vai em `/equipe` → "Convidar Membro"
2. Preenche email, nome, role
3. Sistema gera token único + link
4. Convidado acessa `/convite/:token`
5. Cria senha e aceita
6. Auto-adicionado à agência com role correto

## 16.4 Log de Auditoria (`/admin/audit`)

Registro completo de todas as ações:
- Login/logout, CRUD de leads/clientes/propostas/contratos
- Alterações de permissão, movimentações no Kanban
- Filtros por usuário, ação, período, entidade

## 16.5 Super Admin (`/super-admin`)

**Acesso:** Apenas `super_admin`

**Funcionalidades:**
- Listar todas as agências do SaaS
- Criar nova agência
- Aprovar agência pendente
- Suspender/reativar agência
- Alterar plano de agência
- Dashboard de uso global
- Ranking de engajamento
- Impersonar agência (ver como se fosse o admin)

---

# 17. MÓDULO 10 — FERRAMENTAS AUXILIARES

## 17.1 Central de Dúvidas (`/duvidas`)
- Criar pergunta vinculada a cliente
- Status: `pending` → `answered` → `resolved`
- Fluxo: Operador pergunta → Admin responde → Operador resolve
- Badge no sidebar com pendentes

## 17.2 Caixa de Sugestões (`/sugestoes`)
- Criar sugestão (título, descrição, nível alvo: sistema/processo/equipe/gestão)
- Listar, marcar como lida, arquivar

## 17.3 Notificações (`/notifications`)
- Lead esfriando, cliente atrasado, comissão aprovada, contrato assinado, proposta visualizada, tarefa atrasada
- Badge no header com contagem de não lidas

## 17.4 Histórico (`/historico`)
- Timeline de ações do usuário
- Filtro por tipo, busca textual

## 17.5 Meu Perfil (`/meu-perfil`)
- Editar nome, avatar, senha
- Ver permissões atuais

## 17.6 Configurações de Segurança (`/settings/security`)
- Alterar senha, ver sessões ativas, encerrar sessões

---

# 18. LANDING PAGE E PÁGINAS PÚBLICAS

## 18.1 Landing Page (`/`)

**URL:** https://gbrankcrm.lovable.app  
**Modo:** Força light mode  
**Mobile-first:** 90% do tráfego é mobile

### Estrutura de Seções (top → bottom)

| # | Seção | Componentes | Descrição |
|---|-------|-------------|-----------|
| 1 | **Header Fixo** | Logo GBRANK + Nav (Como Funciona, Funcionalidades, Preços) + CTAs (Entrar, Testar Grátis) | Header fixo com blur backdrop |
| 2 | **Hero** | Badge "CRM #1 para GMB" + H1 "Escale sua Agência de Google Meu Negócio" + Sub "Da prospecção à execução recorrente" + CTA "TESTAR GRÁTIS POR 14 DIAS" + Trust badges (14 dias grátis, Sem cartão) | Fundo com gradientes green/blue |
| 3 | **Benefícios** | 4x `GMBStatsCard` (Feito pra GMB, 47 Pontos, Tudo em 1, Controle) | Grid 2x2 no mobile |
| 4 | **Problema** | H2 "Você Está Preso na Operação?" + 4 cards de dor (Faz Tudo Sozinho, Otimização Sem Padrão, Recorrentes Sem Controle, Trabalho Invisível) | Border-left colorido por card |
| 5 | **Solução** | H2 "O GBRank CRM Gerencia Todo o Ciclo Operacional" + `InteractiveDemo` | Demo interativo |
| 6 | **Funcionalidades** | 3 sub-seções: Prospecção (2 cards), Execução Operacional (4 cards, DESTAQUE), Gestão (2 cards) | Seção de execução com highlight border |
| 7 | **Diferencial** | Comparação lado a lado: GBRank (6 check items) vs. Outros CRMs (6 X items) | Conclusão em box verde |
| 8 | **Experiência** | 4 stats cards (500+ perfis, 4 anos, 350+ alunos, 47 pontos) + Card do fundador João Lobo com foto real | Foto real do fundador |
| 9 | **Preços** | Toggle Mensal/Anual + 2 cards (Lobinho R$67, Lobão R$97) | Lobão com tag "Mais Popular" |
| 10 | **CTA Final** | H2 "Vai Continuar Preso ou Escalar?" + Botão "TESTAR GRÁTIS AGORA" | Background verde (#34A853) |
| 11 | **FAQ** | 6 perguntas frequentes em Accordion | Tecnologia, preço, suporte |
| 12 | **Footer** | Logo + Descrição + Links Rápidos + Contato | Dark background |

### CTAs Principais (Botões de Conversão)

| CTA | Localização | Link | Estilo |
|-----|-------------|------|--------|
| "TESTAR GRÁTIS POR 14 DIAS" | Hero | `/register` | Green bg, white text, shadow, pulse |
| "Começar Agora" / "Escolher Lobão" | Preços | `/register` | Green bg ou outline green |
| "TESTAR GRÁTIS AGORA" | CTA Final | `/register` | White bg, green text |
| "Entrar" | Header | `/auth` | Ghost variant |
| "Testar Grátis" | Header | `/register` | Green bg, compact |

### Componentes Landing Especializados

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `AnimatedCounter` | `landing/AnimatedCounter.tsx` | Contador numérico animado com efeito de incremento |
| `ScrollProgress` | `landing/ScrollProgress.tsx` | Barra de progresso do scroll no topo |
| `InteractiveDemo` | `landing/InteractiveDemo.tsx` | Demo interativo do produto |
| `HeroVideo` | `landing/HeroVideo.tsx` | Vídeo hero (se disponível) |
| `ComparisonTable` | `landing/ComparisonTable.tsx` | Tabela comparativa |
| `FloatingParticles` | `landing/FloatingParticles.tsx` | Partículas flutuantes de fundo |
| `GMBStatsCard` | `landing/GMBElements.tsx` | Card de estatística com ícone |
| `GMBBadge` | `landing/GMBElements.tsx` | Badge estilizado |
| `GMBChecklistPreview` | `landing/GMBElements.tsx` | Preview do checklist |
| `GMBFeatureCard` | `landing/GMBElements.tsx` | Card de funcionalidade |
| `GMBTestimonialCard` | `landing/GMBElements.tsx` | Card de depoimento |
| `GlassmorphicCard` | `landing/GlassmorphicCard.tsx` | Card com efeito glassmorphism |
| `SectionDivider` | `landing/SectionDivider.tsx` | Divisor entre seções |
| `TestimonialCard` | `landing/TestimonialCard.tsx` | Card de depoimento |
| `FloatingMapPins` | `landing/GMBElements.tsx` | Pins flutuantes de mapa |
| `GoogleStars` | `landing/GMBElements.tsx` | Estrelas estilo Google |
| `GMBProfileMockup` | `landing/GMBElements.tsx` | Mockup de perfil GMB |

## 18.2 Outras Páginas Públicas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/auth` | Login | Email + senha, link "Esqueci minha senha" |
| `/register` | Registro | Criar nova agência |
| `/alcateia` | Landing Alcateia | Programa de parceiros |
| `/register-alcateia` | Registro Alcateia | Registro para alunos Alcateia |
| `/convite/:token` | Aceitar Convite | Aceitar convite de equipe |
| `/proposta/:token` | Proposta Pública | Visualização + aceite/rejeição |
| `/contrato/:token` | Contrato Público | Visualização + assinatura digital |
| `/locked` | Subscription Locked | Agência com assinatura bloqueada |
| `/*` | 404 | Página não encontrada |

---

# 19. NAVEGAÇÃO, SIDEBAR E INTERFACE

## 19.1 Sidebar (`AppSidebar`) — Estrutura Completa

### Header
- Logo GBRANK (theme-aware)
- Botão collapse/expand (desktop)
- Botão fechar (mobile)

### Botão de Ação Dinâmico
- **Modo Vendas:** "Novo Lead" (gradient âmbar → laranja)
- **Modo Otimização:** "Novo Cliente" (gradient verde → teal)
- **Modo Recorrência:** "Novo Recorrente" (gradient violeta → roxo)

### Seção: Principais (sempre visível)
| Item | Ícone | Cor | Badge |
|------|-------|-----|-------|
| Vendas | TrendingUp | Âmbar | Leads abertos |
| Otimização | LayoutGrid | Verde | Clientes ativos |
| Recorrência | RefreshCw | Violeta | Tarefas hoje |

### Seção: Comercial (colapsável)
| Item | Ícone | Rota |
|------|-------|------|
| Propostas | FileText | `/propostas` |
| Contratos | FileSignature | `/contratos` |
| Comissões | DollarSign | `/commissions` |
| Raio-X | Zap | `/raio-x` |

### Seção: Ferramentas (colapsável)
| Item | Ícone | Rota | Badge |
|------|-------|------|-------|
| Dúvidas | MessageCircleQuestion | `/duvidas` | Pendentes |
| Sugestões | Lightbulb | `/sugestoes` | — |
| Agente SEO | Search | `/agente-seo` | — |
| Agente Suspensões | AlertTriangle | `/agente-suspensoes` | — |

### Seção: Gestão (colapsável, condicional)
| Item | Ícone | Rota | Condição |
|------|-------|------|----------|
| Equipe | Users | `/equipe` | canAdmin |
| Relatório Gestor | BarChart3 | `/relatorio-gestor` | canAdmin |
| Administração | Settings | `/admin` | canAdmin |
| Super Admin | Shield | `/super-admin` | isSuperAdmin |

### Footer
- Avatar do usuário
- Nome e role
- Botão logout
- Link "Meu Perfil"

## 19.2 Responsividade Mobile

- Sidebar transforma em drawer (slide da esquerda)
- Botão hamburger no header mobile
- Cards empilhados verticalmente
- Kanban com scroll horizontal
- Formulários em coluna única
- Touch targets mínimo 44px

---

# 20. DESIGN SYSTEM

## 20.1 Paleta de Cores

### Modo Escuro (Padrão do App)

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | 220 15% 8% | Fundo principal |
| `--foreground` | 0 0% 100% | Texto principal |
| `--card` | 220 14% 18% | Cards e containers |
| `--primary` | 142 100% 50% | Ações principais (verde neon) |
| `--primary-foreground` | 0 0% 0% | Texto sobre primária |
| `--muted` | 220 15% 18% | Elementos secundários |
| `--muted-foreground` | 220 10% 50% | Texto secundário |

### Cores por Funil

| Funil | Cor | HSL Aproximado |
|-------|-----|---------------|
| Vendas | Âmbar/Laranja | #FFC107 |
| Otimização | Verde Neon | #00FCA8 |
| Recorrência | Violeta | #8B5CF6 |

### Landing Page (Light Mode Forçado)

| Token | Cor | Uso |
|-------|-----|-----|
| `google-green` | #34A853 | CTA principal, badges |
| `google-blue` | #4285F4 | Elementos secundários |
| `google-yellow` | #FBBC04 | Destaques, descontos |
| `google-red` | #EA4335 | Alertas, problemas |
| `gmb-dark` | #0A1628 | Footer |
| `gmb-light-green` | #E8F5E9 | Backgrounds claros |

## 20.2 Tipografia

- **Display/Body:** Inter (300-700)
- **Mono:** JetBrains Mono (para código e números)

## 20.3 Efeitos Visuais

- **Glassmorphism:** `backdrop-filter: blur(16px)` + semi-transparência
- **Neon Glow:** `box-shadow: 0 0 20px hsl(142 100% 50% / 0.5)`
- **Hover Lift:** `translateY(-2px)` + shadow intensificada
- **Animações:** Framer Motion — `fade-in`, `fade-in-up`, `scale-in`, `slide-in-right`

## 20.4 Componentes Shadcn/UI (45+)

Button, Card, Dialog, Sheet, Drawer, Dropdown Menu, Select, Badge, Toast (Sonner), Tooltip, Tabs, Accordion, Collapsible, Table, Form (react-hook-form + zod), Input, Textarea, Checkbox, Switch, Progress, Avatar, Calendar, Carousel, Command, Context Menu, Hover Card, Label, Menubar, Navigation Menu, Pagination, Popover, Radio Group, Resizable, Scroll Area, Separator, Skeleton, Slider, Toggle, Toggle Group, Alert, Alert Dialog, Aspect Ratio, Breadcrumb, Input OTP

---

# 21. REGRAS DE NEGÓCIO CONSOLIDADAS

## 21.1 Leads

| Regra | Descrição |
|-------|-----------|
| Lead frio → morno | Após 2 atividades registradas |
| Lead morno → quente | Após reunião realizada ou proposta enviada |
| Lead esfria | Após 7 dias sem atividade, temperatura diminui |
| Lead convertido | Não pode ser editado, apenas visualizado |
| Lead perdido | Requer motivo de perda obrigatório |
| Duplicados | Detecção por nome da empresa, modal de conflito |

## 21.2 Clientes

| Regra | Descrição |
|-------|-----------|
| Cliente suspenso | Vai para coluna "Suspensos Resolver" |
| Cliente atrasado | ≥ 3 dias sem atualização no checklist |
| Cliente finalizado | Só pode ir para "Entregues" com 100% do checklist |
| Cliente recorrente | Não é deletado, muda plan_type para 'recurring' |
| Soft delete | deleted_at é preenchido, não remove fisicamente |

## 21.3 Propostas

| Regra | Descrição |
|-------|-----------|
| Envio | Gera public_token UUID e link público |
| Visualização | Registra first_viewed_at e last_viewed_at |
| Expiração | Após valid_until (se definida) |
| Aceite | Habilita botão "Gerar Contrato" |

## 21.4 Contratos

| Regra | Descrição |
|-------|-----------|
| Assinatura válida | Requer nome + CPF validado + desenho da assinatura |
| Registro | Registra IP e timestamp da assinatura |
| Dados | Cliente → campos `contracted_*`, Agência → campos `contractor_*` |

## 21.5 Comissões

| Regra | Descrição |
|-------|-----------|
| Geração | Status inicial conforme configuração (pending ou approved) |
| Aprovação | Ação manual ou automática conforme config |
| Pagamento | Registra data de pagamento |
| Cancelamento | Mantém histórico, não contabiliza em totais |

## 21.6 Recorrência

| Regra | Descrição |
|-------|-----------|
| Geração de tarefas | Para 14 dias à frente (max 30) |
| Tarefa atrasada | Após due_date sem conclusão |
| Compliance | (tarefas concluídas / tarefas totais) × 100 |
| Cliente pausado | Não gera novas tarefas |
| Cliente cancelado | Não gera tarefas, mantém histórico |

## 21.7 Multi-Tenancy

| Regra | Descrição |
|-------|-----------|
| Isolamento | RLS garante visibilidade apenas da agência atual |
| Auto-fill | Triggers preenchem agency_id automaticamente |
| Multi-agência | Usuário pode pertencer a múltiplas agências |
| current_agency_id | Define qual agência está ativa na sessão |

---

# 22. EDGE FUNCTIONS (BACKEND)

## 22.1 Inventário Completo

| # | Função | Método | Auth | Descrição |
|---|--------|--------|------|-----------|
| 1 | `admin-change-email` | POST | Admin | Altera email de outro usuário |
| 2 | `admin-reset-password` | POST | Admin | Reseta senha de outro usuário |
| 3 | `analyze-raiox` | POST | User | Análise IA de chamada de vendas |
| 4 | `analyze-recurrence` | POST | User | Relatório IA de recorrência |
| 5 | `analyze-seo` | POST | User | Análise IA de perfil Google |
| 6 | `analyze-suspensao` | POST | User | Análise IA de perfil suspenso |
| 7 | `autentique-webhook` | POST | Public | Webhook da Autentique (assinatura) |
| 8 | `auto-register-agency` | POST | Public | Registro de nova agência |
| 9 | `bootstrap-users` | POST | Admin | Bootstrap de usuários iniciais |
| 10 | `check-notifications` | POST | User | Verifica e gera notificações |
| 11 | `convert-lead-to-client` | POST | User | Converte lead ganho para cliente |
| 12 | `create-agency-owner` | POST | SuperAdmin | Cria owner de agência |
| 13 | `create-user` | POST | Admin | Cria novo usuário na agência |
| 14 | `daily-audit` | POST | Cron | Auditoria diária automatizada |
| 15 | `dashboard-bi` | POST | User | Dados de Business Intelligence |
| 16 | `generate-contract` | POST | User | Gera cláusulas de contrato com IA |
| 17 | `generate-manager-report` | POST | Admin | Gera relatório gerencial com IA |
| 18 | `generate-proposal` | POST | User | Gera proposta com IA |
| 19 | `generate-recurring-tasks` | POST | User | Gera tarefas recorrentes |
| 20 | `lead-copilot` | POST | User | Chat IA contextual sobre lead |
| 21 | `log-error` | POST | Public | Registro de erros do frontend |
| 22 | `permissions` | POST | Admin | Gerencia permissões de usuários |
| 23 | `process-voice-command` | POST | User | Processa comandos de voz |
| 24 | `reset-user-password` | POST | Admin | Reset de senha com validação |
| 25 | `security-check` | POST | Admin | Verificação de segurança |
| 26 | `self-reset-password` | POST | User | Auto-reset de senha |
| 27 | `send-to-autentique` | POST | User | Envia contrato para Autentique |
| 28 | `unify-leads` | POST | User | Unifica leads duplicados |
| 29 | `voice-to-text` | POST | User | Transcrição de áudio |

## 22.2 CORS

Todas as edge functions críticas utilizam CORS restrito (`supabase/functions/_shared/cors.ts`) limitado aos domínios `*.lovable.app`.

---

# 23. BANCO DE DADOS — TABELAS E SCHEMAS

## 23.1 Tabelas Principais (35+)

| Categoria | Tabelas |
|-----------|---------|
| **Core** | `profiles`, `agencies`, `agency_members` |
| **Limites/Uso** | `agency_limits`, `agency_usage`, `plans`, `subscriptions` |
| **Leads/Vendas** | `leads`, `lead_activities`, `lead_sources`, `lost_reasons` |
| **Clientes** | `clients`, `clients_v2`, `client_invoices`, `client_recurring_history` |
| **Propostas** | `proposals`, `proposal_views` |
| **Contratos** | `contracts`, `contract_templates`, `contract_views`, `contract_events` |
| **Comissões** | `commissions_v2`, `commission_configs`, `commission_roles`, `commissions_old` |
| **Recorrência** | `recurring_clients`, `recurring_routines`, `recurring_tasks` |
| **Admin** | `user_roles`, `user_permissions`, `audit_log`, `agency_invites` |
| **Segurança** | `active_sessions`, `anomaly_detections`, `agency_sensitive_data`, `agency_health_checks` |
| **Ferramentas** | `questions`, `suggestions`, `notifications`, `raiox_analyses`, `appointments` |
| **Onboarding** | `agency_onboarding_status`, `activation_events` |
| **Histórico** | `agency_plan_history` |

## 23.2 Enums

| Enum | Valores |
|------|---------|
| `app_role` | admin, manager, operador, owner, sales_rep, super_admin, support, visualizador |
| `lead_status` | open, gained, lost, future |
| `lead_temperature` | cold, warm, hot |
| `lead_pipeline_stage` | cold, contacted, qualified, meeting_scheduled, meeting_done, proposal_sent, negotiating, future, gained, lost |
| `client_status_v2` | active, paused, cancelled |
| `invoice_status` | pending, paid, overdue, cancelled |
| `recurring_status` | active, paused, cancelled |
| `commission_status` | pending, monitoring, approved, paid, cancelled |
| `commission_payment_status` | pending, approved, paid, cancelled |
| `commission_recipient_type` | sdr, seller, photographer, operational, designer, freelancer |
| `contract_type` | single_optimization, recurring, custom |

---

# 24. PLANOS, LIMITES E MONETIZAÇÃO

## 24.1 Tabela `plans`

Define os planos disponíveis com features e limites por tier.

## 24.2 Tabela `subscriptions`

Rastreia assinatura de cada agência: plano atual, status (active, past_due, cancelled, expired), datas de início/fim.

## 24.3 Tabela `agency_limits`

Limites por agência: `max_clients`, `max_leads`, `max_recurring_clients`, `max_users`, `storage_mb`, `features` (JSON com feature flags).

## 24.4 Tabela `agency_usage`

Uso atual: `current_clients`, `current_leads`, `current_recurring_clients`, `current_users`, `storage_used_mb`.

## 24.5 Enforcement

- `SubscriptionGuard` HOC: bloqueia rotas se assinatura está bloqueada
- `withPlanAccess` HOC: verifica se feature está disponível no plano
- `useCheckPlanLimits` hook: verifica uso vs. limites em runtime
- `PlanLimitBadge`: badge visual de uso/limite
- Página `/locked`: tela de bloqueio com CTA de regularização

---

# 25. SEGURANÇA E COMPLIANCE (LGPD)

## 25.1 Segurança

| Camada | Implementação |
|--------|--------------|
| **Autenticação** | Supabase Auth (email+senha, mín. 8 chars) |
| **Autorização** | RLS policies + role-based permissions |
| **Isolamento** | Multi-tenant por agency_id |
| **CORS** | Restrito a domínios *.lovable.app |
| **Auditoria** | Tabela audit_log com todas as ações |
| **Sessões** | Tabela active_sessions com monitoramento |
| **Anomalias** | Detecção automática via anomaly_detections |
| **Dados sensíveis** | agency_sensitive_data com campos criptografados |
| **Senhas** | Reset via email, admin reset com service_role_key |

## 25.2 LGPD

| Requisito | Implementação |
|-----------|--------------|
| **Consentimento** | ConsentGuard + ConsentModal (aceite obrigatório) |
| **Base legal** | Contrato com cláusula LGPD obrigatória |
| **Direito de acesso** | Dados acessíveis via perfil |
| **Direito de exclusão** | Soft delete + possibilidade de remoção completa |
| **Portabilidade** | Export de dados (JSON/CSV) |
| **Registro de tratamento** | Audit log completo |
| **Segurança** | Criptografia de dados sensíveis |
| **Controlador** | Agência = controlador, GBRANK = operador |

---

# 26. ROADMAP E BACKLOG

## 26.1 Features Futuras Planejadas

| # | Feature | Prioridade | Status |
|---|---------|-----------|--------|
| 1 | Integração Stripe para cobranças | Alta | Planejado |
| 2 | 2FA (autenticação em dois fatores) | Alta | Planejado |
| 3 | App mobile nativo (PWA) | Média | Backlog |
| 4 | Integração Google Business Profile API | Alta | Backlog |
| 5 | Webhooks para integrações externas | Média | Backlog |
| 6 | White-label (agência com marca própria) | Baixa | Backlog |
| 7 | Relatórios PDF automatizados por email | Média | Backlog |
| 8 | Dashboard customizável por usuário | Baixa | Backlog |
| 9 | Chat interno entre membros | Baixa | Backlog |
| 10 | Integração WhatsApp Business API | Alta | Backlog |

---

# APÊNDICE A: MAPA DE ROTAS

| Rota | Página | Auth | Subscription | Permissão |
|------|--------|------|-------------|-----------|
| `/` | Landing | ❌ | ❌ | Pública |
| `/auth` | Login | ❌ | ❌ | Pública |
| `/register` | Registro | ❌ | ❌ | Pública |
| `/alcateia` | Landing Alcateia | ❌ | ❌ | Pública |
| `/register-alcateia` | Registro Alcateia | ❌ | ❌ | Pública |
| `/convite/:token` | Aceitar Convite | ❌ | ❌ | Pública |
| `/proposta/:token` | Proposta Pública | ❌ | ❌ | Pública |
| `/contrato/:token` | Contrato Público | ❌ | ❌ | Pública |
| `/locked` | Subscription Locked | ✅ | ❌ | Qualquer |
| `/meu-perfil` | Meu Perfil | ✅ | ❌ | Qualquer |
| `/super-admin` | Super Admin | ✅ | ❌ | super_admin |
| `/dashboard` | Dashboard | ✅ | ✅ | Baseado em FunnelMode |
| `/propostas` | Propostas | ✅ | ✅ | canSalesOrAdmin |
| `/contratos` | Contratos | ✅ | ✅ | canSalesOrAdmin |
| `/commissions` | Comissões | ✅ | ✅ | canFinanceOrAdmin |
| `/raio-x` | Raio-X | ✅ | ✅ | canSalesOrAdmin |
| `/agente-seo` | Agente SEO | ✅ | ✅ | canOpsOrAdmin |
| `/agente-suspensoes` | Agente Suspensões | ✅ | ✅ | canOpsOrAdmin |
| `/historico` | Histórico | ✅ | ✅ | Qualquer |
| `/duvidas` | Dúvidas | ✅ | ✅ | Qualquer |
| `/recorrencia` | Recorrência | ✅ | ✅ | canRecurringOrAdmin |
| `/clientes-crm` | Clientes CRM | ✅ | ✅ | canOpsOrAdmin |
| `/admin` | Administração | ✅ | ✅ | canAdminOrIsAdmin |
| `/admin/users` | Gestão Usuários | ✅ | ✅ | canAdminOrIsAdmin |
| `/admin/plan` | Plano | ✅ | ✅ | canAdminOrIsAdmin |
| `/admin/audit` | Auditoria | ✅ | ✅ | canAdminOrIsAdmin |
| `/admin/permissions` | Permissões | ✅ | ✅ | canAdminOrIsAdmin |
| `/admin/activation` | Activation | ✅ | ✅ | canAdminOrIsAdmin |
| `/admin/agencia/:id` | Detalhe Agência | ✅ | ✅ | super_admin |
| `/equipe` | Equipe | ✅ | ✅ | canAdminOrIsAdmin |
| `/relatorio-gestor` | Relatório | ✅ | ✅ | canAdminOrIsAdmin |
| `/notifications` | Notificações | ✅ | ✅ | Qualquer |
| `/sugestoes` | Sugestões | ✅ | ✅ | Qualquer |
| `/agency/settings/permissions` | Permissões Agência | ✅ | ✅ | canAdminOrIsAdmin |
| `/settings/security` | Segurança | ✅ | ✅ | Qualquer |
| `/upgrade` | Upgrade | ✅ | ✅ | Qualquer |

---

# APÊNDICE B: CUSTOM HOOKS (60+)

| Hook | Descrição |
|------|-----------|
| `useActivation` | Eventos de ativação da agência |
| `useAgencyLimits` | Limites do plano da agência |
| `useAppointments` | Agendamentos / compromissos |
| `useAuditLog` | Log de auditoria |
| `useAutoRefresh` | Refresh automático de dados |
| `useCheckPlanLimits` | Verificação de limites do plano |
| `useClients` | CRUD de clientes (otimização) |
| `useClientsV2` | CRUD de clientes v2 (CRM) |
| `useCommissionConfigs` | Configurações de comissão |
| `useCommissionRoles` | Papéis de comissão |
| `useCommissions` | CRUD de comissões |
| `useContracts` | CRUD de contratos |
| `useDashboardBI` | Dados de BI para dashboard |
| `useEngagement` | Métricas de engajamento |
| `useErrorLogger` | Log de erros do frontend |
| `useInvites` | Convites de equipe |
| `useLeadConversion` | Conversão de leads |
| `useLeadCopilot` | Chat IA do lead |
| `useLeadDuplicates` | Detecção de duplicados |
| `useLeadUnification` | Unificação de leads |
| `useLeads` | CRUD de leads |
| `useLeadsKanban` | Kanban de leads (drag & drop) |
| `useNPSFeedback` | Pesquisa NPS |
| `useNotifications` | Sistema de notificações |
| `useOnboardingChecklist` | Onboarding da agência |
| `usePageMeta` | Meta tags da página |
| `usePendingRegistrations` | Registros pendentes (super admin) |
| `usePermissions` | Permissões do usuário |
| `usePipelineColumns` | Colunas do pipeline |
| `usePlanFeatures` | Features do plano |
| `useProposals` | CRUD de propostas |
| `useQuestions` | Central de dúvidas |
| `useRecurring` | Gestão de recorrência |
| `useSafeBack` | Navegação segura de volta |
| `useScheduledTasks` | Tarefas agendadas |
| `useSecurityAlerts` | Alertas de segurança |
| `useSecurityCheck` | Verificação de segurança |
| `useSecurityMonitoring` | Monitoramento de segurança |
| `useSubscription` | Status da assinatura |
| `useSubscriptionStatus` | Estado detalhado da subscription |
| `useSuggestions` | Caixa de sugestões |
| `useSuperAdmin` | Funcionalidades super admin |
| `useSuperAdminAlerts` | Alertas para super admin |
| `useSystemHealth` | Saúde do sistema |
| `useSystemHealthCheck` | Checagem de saúde |
| `useTaskTimer` | Timer de tarefas |
| `useTeamPermissions` | Permissões de equipe |
| `useToastFeedback` | Feedback com toasts |
| `useTrialFeatures` | Features do trial |
| `useUndoRedoKeyboard` | Atalhos undo/redo |
| `useUserConsent` | Consentimento LGPD |
| `useVisualTour` | Tour visual guiado |

---

# APÊNDICE C: ASSETS VISUAIS

| Asset | Arquivo | Uso |
|-------|---------|-----|
| Logo Dark | `grank-logo-dark.png` | Header landing, sidebar dark |
| Logo Light | `grank-logo-light.png` | Sidebar light mode |
| Logo Padrão | `grank-logo.png` | Favicon, meta tags |
| Dashboard Hero | `grank-dashboard-hero.png` | Landing page |
| Dashboard Clean | `grank-dashboard-clean.png` | Marketing |
| Dashboard Complete | `grank-dashboard-complete.png` | Marketing |
| João Lobo (Foto) | `joao-lobo.jpg` | Landing page, seção fundador |
| Alcateia Logo | `alcateia-logo.png` | Landing Alcateia |
| Alcateia Wolf | `alcateia-wolf-hero.png` | Landing Alcateia |
| Alcateia Wolf Pack | `alcateia-wolf-pack.png` | Landing Alcateia |
| Alcateia Abstract | `alcateia-wolf-abstract.png` | Landing Alcateia |
| Rankeia Logo | `rankeia-logo.png` | Referência |
| Favicon | `public/favicon.png` | Aba do navegador |

---

*PRD gerado em Fevereiro 2026 — GBRANK CRM v1.0*  
*Documento técnico completo para uso em sistemas de otimização e geração de PRD.*
