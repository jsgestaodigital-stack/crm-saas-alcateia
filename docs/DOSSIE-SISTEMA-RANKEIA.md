# DOSSIÊ TÉCNICO COMPLETO - SISTEMA RANKEIA
## Plataforma de Gestão de Agências de Marketing Google Meu Negócio

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Autor:** Documentação Técnica Automatizada  
**Propósito:** Documentar arquitetura, funcionalidades e guia de migração para SaaS

---

# ÍNDICE

1. [VISÃO GERAL DO SISTEMA](#1-visão-geral-do-sistema)
2. [ARQUITETURA TÉCNICA](#2-arquitetura-técnica)
3. [BANCO DE DADOS - SCHEMA COMPLETO](#3-banco-de-dados---schema-completo)
4. [SISTEMA DE MULTI-TENANCY](#4-sistema-de-multi-tenancy)
5. [AUTENTICAÇÃO E PERMISSÕES](#5-autenticação-e-permissões)
6. [MÓDULOS FUNCIONAIS](#6-módulos-funcionais)
7. [EDGE FUNCTIONS (BACKEND)](#7-edge-functions-backend)
8. [DESIGN SYSTEM](#8-design-system)
9. [FLUXOS DE NEGÓCIO](#9-fluxos-de-negócio)
10. [SEGURANÇA E RLS POLICIES](#10-segurança-e-rls-policies)
11. [CHECKLIST DE MIGRAÇÃO PARA SAAS](#11-checklist-de-migração-para-saas)
12. [GUIA DE IMPLEMENTAÇÃO SUPER ADMIN](#12-guia-de-implementação-super-admin)
13. [GUIA DE IMPLEMENTAÇÃO ONBOARDING](#13-guia-de-implementação-onboarding)
14. [ARQUIVOS CRÍTICOS DO SISTEMA](#14-arquivos-críticos-do-sistema)
15. [PROMPT PARA NOVAS CONVERSAS](#15-prompt-para-novas-conversas)

---

# 1. VISÃO GERAL DO SISTEMA

## 1.1 O que é o RANKEIA?

O RANKEIA é uma plataforma completa de gestão operacional para agências de marketing especializadas em Google Meu Negócio (Google Business Profile). O sistema foi desenvolvido para otimizar todo o fluxo de trabalho desde a captação de leads até a entrega final do serviço, incluindo:

- **Gestão de Leads (CRM de Vendas)**: Pipeline completo com kanban, temperatura de leads, propostas e conversão
- **Gestão de Clientes (Delivery)**: Kanban de execução com checklist de 58 itens em 5 etapas
- **Recorrência**: Gestão de clientes com planos mensais e rotinas automatizadas
- **Comissões**: Sistema financeiro para pagamento de equipe
- **Agentes IA**: Análises automatizadas com inteligência artificial
- **Relatórios Gerenciais**: Dashboard executivo para gestores

## 1.2 Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | React + TypeScript | 18.3.1 |
| **Build Tool** | Vite | Latest |
| **Estilização** | Tailwind CSS + Shadcn/UI | 3.4+ |
| **State Management** | TanStack Query + Zustand | 5.x / 5.x |
| **Roteamento** | React Router DOM | 6.30+ |
| **Backend** | Supabase (Lovable Cloud) | Latest |
| **Banco de Dados** | PostgreSQL | 15+ |
| **Autenticação** | Supabase Auth | Native |
| **Edge Functions** | Deno (Supabase Functions) | Latest |
| **IA** | Lovable AI (Gemini/OpenAI) | Multi-model |

## 1.3 Métricas Atuais

- **28 tabelas** no banco de dados
- **18 tabelas** com isolamento por `agency_id` (multi-tenant)
- **12 edge functions** para lógica de backend
- **14 páginas** principais
- **~150 componentes** React
- **47 funções SQL** no banco de dados
- **~100 RLS policies** de segurança

---

# 2. ARQUITETURA TÉCNICA

## 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │ Pages   │  │Components│  │ Hooks   │  │ Contexts│  │ Stores │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └───┬────┘ │
│       │            │            │            │           │       │
│       └────────────┴────────────┴────────────┴───────────┘       │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │ Supabase Client   │                         │
│                    │ (client.ts)       │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Auth      │  │  Database   │  │    Edge Functions       │  │
│  │  (Users)    │  │ (PostgreSQL)│  │       (Deno)            │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌───────────▼─────────────┐  │
│  │  Profiles   │  │   Tables    │  │  - create-user          │  │
│  │  Roles      │  │   Views     │  │  - reset-password       │  │
│  │  Permissions│  │   RLS       │  │  - analyze-* (IA)       │  │
│  └─────────────┘  │   Triggers  │  │  - convert-lead         │  │
│                   │   Functions │  │  - generate-report      │  │
│                   └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Estrutura de Diretórios

```
rankeia-app/
├── src/
│   ├── assets/              # Imagens e recursos estáticos
│   ├── components/          # Componentes React
│   │   ├── agents/          # Modais de agentes IA
│   │   ├── checklist/       # Componentes de checklist
│   │   ├── commissions/     # Sistema de comissões
│   │   ├── dashboard/       # Componentes do dashboard
│   │   ├── execution/       # Execução de clientes
│   │   ├── leads/           # CRM de vendas
│   │   ├── manager-report/  # Relatório gerencial
│   │   ├── recurring/       # Gestão de recorrência
│   │   └── ui/              # Componentes base (Shadcn)
│   ├── contexts/            # React Contexts
│   │   ├── AuthContext.tsx  # Autenticação e permissões
│   │   ├── FunnelModeContext.tsx
│   │   ├── QADebugContext.tsx
│   │   └── UndoRedoContext.tsx
│   ├── hooks/               # Custom hooks
│   ├── integrations/        # Integrações externas
│   │   └── supabase/        # Cliente e tipos Supabase
│   ├── lib/                 # Utilitários
│   ├── pages/               # Páginas da aplicação
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript types
│   └── utils/               # Funções auxiliares
├── supabase/
│   ├── config.toml          # Configuração Supabase
│   ├── functions/           # Edge Functions
│   └── migrations/          # Migrações SQL (read-only)
├── docs/                    # Documentação
└── public/                  # Assets públicos
```

## 2.3 Fluxo de Dados

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuário    │────▶│   React      │────▶│   Supabase   │
│   (Browser)  │     │   Component  │     │   Client     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Update  │◀────│   React      │◀────│   RLS Check  │
│   (Realtime) │     │   Query      │     │   + Data     │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

# 3. BANCO DE DADOS - SCHEMA COMPLETO

## 3.1 Tabelas Principais (18 com multi-tenancy)

### 3.1.1 Tabela: `agencies`
**Propósito**: Armazena as agências (tenants) do sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único (PK) |
| `name` | TEXT | Nome da agência |
| `slug` | TEXT | Slug único para URL |
| `status` | TEXT | Status: active, pending, suspended |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Última atualização |

**Dados Atuais**: 1 agência (RANKEIA)

---

### 3.1.2 Tabela: `clients`
**Propósito**: Clientes da agência em processo de otimização

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único (PK) |
| `agency_id` | UUID | FK para agencies |
| `company_name` | TEXT | Nome da empresa |
| `column_id` | ENUM | Etapa no kanban |
| `status` | ENUM | on_track, delayed, pending_client |
| `plan_type` | ENUM | unique, recurring |
| `checklist` | JSONB | Array de seções com itens |
| `comparisons` | JSONB | Fotos antes/depois |
| `history` | JSONB | Histórico de ações |
| `responsible` | TEXT | Responsável principal |
| `start_date` | DATE | Data de início |
| `last_update` | TIMESTAMPTZ | Última atualização |
| `google_profile_url` | TEXT | URL do perfil Google |
| `drive_url` | TEXT | URL da pasta no Drive |
| `whatsapp_link` | TEXT | Link WhatsApp longo |
| `whatsapp_link_short` | TEXT | Link WhatsApp curto |
| `whatsapp_group_url` | TEXT | URL do grupo WhatsApp |
| `briefing` | TEXT | Briefing do cliente |
| `notes` | TEXT | Notas gerais |
| `keywords` | TEXT[] | Palavras-chave |
| `main_category` | TEXT | Categoria principal |
| `city` | TEXT | Cidade |
| `photo_mode` | ENUM | with_photos, without_photos, pending |
| `labels` | JSONB | Tags coloridas |
| `profile_image` | TEXT | URL da imagem de perfil |
| `cover_config` | JSONB | Configuração de capa |
| `attachments` | TEXT[] | URLs de anexos |
| `attachments_count` | INT | Contador de anexos |
| `is_owner` | BOOLEAN | Se cliente é proprietário |
| `yahoo_email` | TEXT | Email Yahoo criado |
| `suspended_at` | TIMESTAMPTZ | Data de suspensão |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Colunas do Kanban (column_id)**:
- `suspended` - Suspensos Resolver
- `pipeline` - Verificação / Para entrar
- `onboarding` - Iniciar
- `optimization` - Fazendo Otimização
- `ready_to_deliver` - Feitos - Com Pendência
- `finalized` - Feitos 100% - Entregar
- `delivered` - Entregues

---

### 3.1.3 Tabela: `leads`
**Propósito**: Oportunidades de venda (CRM)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único (PK) |
| `agency_id` | UUID | FK para agencies |
| `company_name` | TEXT | Nome da empresa |
| `contact_name` | TEXT | Nome do contato |
| `whatsapp` | TEXT | WhatsApp |
| `phone` | TEXT | Telefone |
| `email` | TEXT | Email |
| `city` | TEXT | Cidade |
| `main_category` | TEXT | Categoria principal |
| `source_id` | UUID | FK para lead_sources |
| `source_custom` | TEXT | Fonte customizada |
| `pipeline_stage` | ENUM | Etapa no funil |
| `temperature` | ENUM | cold, warm, hot |
| `probability` | INT | % de chance de fechar |
| `estimated_value` | DECIMAL | Valor estimado |
| `next_action` | TEXT | Próxima ação |
| `next_action_date` | DATE | Data da próxima ação |
| `proposal_url` | TEXT | URL da proposta |
| `proposal_status` | ENUM | Status da proposta |
| `proposal_notes` | TEXT | Notas da proposta |
| `status` | ENUM | open, gained, lost, future |
| `lost_reason_id` | UUID | FK para lost_reasons |
| `lost_notes` | TEXT | Motivo da perda |
| `converted_client_id` | UUID | FK para clients |
| `converted_at` | TIMESTAMPTZ | Data de conversão |
| `notes` | TEXT | Notas gerais |
| `responsible` | TEXT | Responsável |
| `created_by` | UUID | Criado por |
| `last_activity_at` | TIMESTAMPTZ | Última atividade |

**Etapas do Pipeline (pipeline_stage)**:
- `cold` - Leads Frios
- `contacted` - Contatados
- `qualified` - Qualificados
- `meeting_scheduled` - Reunião Marcada
- `meeting_done` - Reunião Feita
- `proposal_sent` - Proposta Enviada
- `negotiating` - Negociação
- `future` - Futuro
- `gained` - Ganho
- `lost` - Perdido

---

### 3.1.4 Tabela: `lead_activities`
**Propósito**: Histórico de interações com leads

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `lead_id` | UUID | FK leads |
| `type` | ENUM | whatsapp, call, meeting, note, follow_up, proposal, email |
| `content` | TEXT | Conteúdo da atividade |
| `link` | TEXT | Link relacionado |
| `created_by` | UUID | Quem criou |
| `created_by_name` | TEXT | Nome de quem criou |
| `created_at` | TIMESTAMPTZ | Quando |

---

### 3.1.5 Tabela: `commissions_v2`
**Propósito**: Comissões a pagar para a equipe

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `client_id` | UUID | FK clients (opcional) |
| `lead_id` | UUID | FK leads (opcional) |
| `client_name` | TEXT | Nome do cliente |
| `recipient_id` | UUID | ID do recebedor |
| `recipient_name` | TEXT | Nome do recebedor |
| `recipient_type` | ENUM | sdr, seller, photographer, operational, designer, freelancer |
| `recipient_role_id` | UUID | FK commission_roles |
| `description` | TEXT | Descrição |
| `amount` | DECIMAL | Valor da comissão |
| `sale_value` | DECIMAL | Valor da venda |
| `status` | ENUM | pending, approved, paid, cancelled |
| `delivered_at` | TIMESTAMPTZ | Data de entrega |
| `approved_at` | TIMESTAMPTZ | Data de aprovação |
| `paid_at` | TIMESTAMPTZ | Data de pagamento |
| `notes` | TEXT | Observações |
| `created_by` | UUID | Quem criou |

---

### 3.1.6 Tabela: `recurring_clients`
**Propósito**: Clientes com plano de recorrência mensal

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `client_id` | UUID | FK clients (opcional) |
| `company_name` | TEXT | Nome da empresa |
| `responsible_name` | TEXT | Responsável |
| `responsible_user_id` | UUID | FK profiles |
| `schedule_variant` | TEXT | Variante de agenda |
| `monthly_value` | DECIMAL | Valor mensal |
| `start_date` | DATE | Início |
| `status` | TEXT | active, paused, cancelled |
| `notes` | TEXT | Observações |
| `timezone` | TEXT | Fuso horário |

---

### 3.1.7 Tabela: `recurring_routines`
**Propósito**: Templates de rotinas recorrentes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `title` | TEXT | Título da rotina |
| `description` | TEXT | Descrição |
| `frequency` | TEXT | weekly, monthly |
| `occurrences_per_period` | INT | Quantas vezes por período |
| `rules_json` | JSONB | Regras adicionais |
| `sort_order` | INT | Ordem de exibição |
| `active` | BOOLEAN | Ativa/inativa |

---

### 3.1.8 Tabela: `recurring_tasks`
**Propósito**: Tarefas geradas das rotinas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `recurring_client_id` | UUID | FK recurring_clients |
| `routine_id` | UUID | FK recurring_routines |
| `due_date` | DATE | Data de vencimento |
| `status` | TEXT | pending, completed |
| `completed_at` | TIMESTAMPTZ | Quando completou |
| `completed_by` | UUID | Quem completou |
| `completed_by_name` | TEXT | Nome |
| `notes` | TEXT | Observações |

---

### 3.1.9 Tabela: `questions`
**Propósito**: Perguntas sobre clientes para esclarecer dúvidas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `client_id` | UUID | FK clients |
| `client_name` | TEXT | Nome do cliente |
| `question` | TEXT | Pergunta |
| `answer` | TEXT | Resposta |
| `status` | ENUM | pending, answered, resolved |
| `asked_by` | UUID | Quem perguntou |
| `asked_by_name` | TEXT | Nome |
| `answered_by` | UUID | Quem respondeu |
| `answered_by_name` | TEXT | Nome |
| `answered_at` | TIMESTAMPTZ | Quando |

---

### 3.1.10 Tabela: `suggestions`
**Propósito**: Sugestões da equipe para melhorias

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `title` | TEXT | Título |
| `description` | TEXT | Descrição |
| `target_level` | TEXT | Nível alvo |
| `status` | TEXT | pending, read, archived |
| `author_id` | UUID | Quem sugeriu |
| `author_name` | TEXT | Nome |
| `read_at` | TIMESTAMPTZ | Quando leu |
| `archived_at` | TIMESTAMPTZ | Quando arquivou |

---

### 3.1.11 Tabela: `raiox_analyses`
**Propósito**: Análises de IA de chamadas de vendas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `lead_id` | UUID | FK leads (opcional) |
| `client_id` | UUID | FK clients (opcional) |
| `call_link` | TEXT | Link da gravação |
| `transcription` | TEXT | Transcrição |
| `summary` | TEXT | Resumo IA |
| `objections` | TEXT | Objeções identificadas |
| `closing_angle` | TEXT | Ângulo de fechamento |
| `next_step` | TEXT | Próximo passo sugerido |
| `suggested_script` | TEXT | Script sugerido |
| `what_to_avoid` | TEXT | O que evitar |
| `created_by` | UUID | Quem criou |

---

### 3.1.12 Tabela: `audit_log`
**Propósito**: Log de auditoria de ações

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `user_id` | UUID | Quem fez |
| `user_name` | TEXT | Nome |
| `action_type` | TEXT | Tipo de ação |
| `entity_type` | TEXT | Tipo de entidade |
| `entity_id` | UUID | ID da entidade |
| `entity_name` | TEXT | Nome da entidade |
| `old_value` | JSONB | Valor antigo |
| `new_value` | JSONB | Valor novo |
| `metadata` | JSONB | Metadados extras |

---

## 3.2 Tabelas de Configuração

### 3.2.1 Tabela: `lead_sources`
Fontes de origem dos leads (Instagram, Indicação, Google, etc.)

### 3.2.2 Tabela: `lost_reasons`
Motivos de perda de leads (Preço, Concorrência, Timing, etc.)

### 3.2.3 Tabela: `commission_roles`
Papéis para recebimento de comissão (SDR, Vendedor, Fotógrafo, etc.)

### 3.2.4 Tabela: `commission_configs`
Configurações de comissão por colaborador

---

## 3.3 Tabelas de Usuários e Permissões

### 3.3.1 Tabela: `profiles`
**Propósito**: Perfis de usuários (estende auth.users)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK (= auth.users.id) |
| `full_name` | TEXT | Nome completo |
| `avatar_url` | TEXT | URL do avatar |
| `status` | ENUM | ativo, suspenso, excluido |
| `current_agency_id` | UUID | FK agencies (agência ativa) |
| `last_login` | TIMESTAMPTZ | Último login |

---

### 3.3.2 Tabela: `user_roles`
**Propósito**: Papéis dos usuários no sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK profiles |
| `role` | ENUM | admin, operador, visualizador |

---

### 3.3.3 Tabela: `user_permissions`
**Propósito**: Permissões granulares por usuário

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `user_id` | UUID | PK |
| `can_sales` | BOOLEAN | Acesso ao CRM de vendas |
| `can_ops` | BOOLEAN | Acesso à operação (delivery) |
| `can_admin` | BOOLEAN | Acesso à administração |
| `can_finance` | BOOLEAN | Acesso às finanças/comissões |
| `can_recurring` | BOOLEAN | Acesso à recorrência |
| `is_super_admin` | BOOLEAN | Super admin global (SaaS) |

---

### 3.3.4 Tabela: `agency_members`
**Propósito**: Relacionamento usuários <-> agências

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agency_id` | UUID | FK agencies |
| `user_id` | UUID | FK profiles |
| `role` | TEXT | owner, admin, member |

---

## 3.4 Tabelas de Auditoria Técnica

### 3.4.1 `tenant_healthcheck_runs` / `tenant_healthcheck_results`
Resultados de verificação de saúde do multi-tenancy

### 3.4.2 `tenant_audit_runs` / `tenant_audit_findings`
Achados de auditoria de segurança

### 3.4.3 `tenant_fn_audit_runs` / `tenant_fn_audit_findings`
Auditoria de funções SQL

### 3.4.4 `task_time_entries`
Registro de tempo gasto em tarefas

---

# 4. SISTEMA DE MULTI-TENANCY

## 4.1 Conceito

O sistema implementa **multi-tenancy por discriminador** usando a coluna `agency_id`. Cada agência é um "tenant" isolado que só vê seus próprios dados.

## 4.2 Fluxo de Funcionamento

```
1. Usuário faz login
   └─▶ Supabase Auth valida credenciais
       └─▶ Sistema busca current_agency_id do profile
           └─▶ Função current_agency_id() retorna o ID
               └─▶ RLS policies filtram dados por agency_id
```

## 4.3 Tabelas Isoladas por agency_id

As seguintes 18 tabelas têm isolamento completo:

1. `agency_members`
2. `audit_log`
3. `clients`
4. `commission_configs`
5. `commission_roles`
6. `commissions_old`
7. `commissions_v2`
8. `lead_activities`
9. `lead_sources`
10. `leads`
11. `lost_reasons`
12. `questions`
13. `raiox_analyses`
14. `recurring_clients`
15. `recurring_routines`
16. `recurring_tasks`
17. `suggestions`
18. `task_time_entries`

## 4.4 Função current_agency_id()

```sql
CREATE OR REPLACE FUNCTION public.current_agency_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_agency_id 
  FROM public.profiles 
  WHERE id = auth.uid()
$$;
```

Esta função é usada em todas as RLS policies para filtrar dados.

## 4.5 Triggers de Auto-Preenchimento

Cada tabela com `agency_id` tem um trigger que preenche automaticamente:

```sql
-- Exemplo para clients
CREATE OR REPLACE FUNCTION public.clients_set_agency_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_agency_id_before_insert
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.clients_set_agency_id();
```

---

# 5. AUTENTICAÇÃO E PERMISSÕES

## 5.1 Sistema de Roles

O sistema usa uma abordagem em camadas:

```
┌─────────────────────────────────────────────┐
│           Super Admin (SaaS)                │
│  ┌───────────────────────────────────────┐  │
│  │         Agency Admin                  │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │    Operador / Visualizador      │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 5.1.1 Roles (user_roles.role)

| Role | Descrição |
|------|-----------|
| `admin` | Administrador da agência |
| `operador` | Operador com acesso a funcionalidades |
| `visualizador` | Apenas visualização |

### 5.1.2 Permissões (user_permissions)

| Permissão | Descrição |
|-----------|-----------|
| `can_sales` | Acesso ao módulo de vendas/leads |
| `can_ops` | Acesso ao módulo de operação/delivery |
| `can_admin` | Acesso à administração de usuários |
| `can_finance` | Acesso a comissões e financeiro |
| `can_recurring` | Acesso ao módulo de recorrência |
| `is_super_admin` | Super admin global (gerencia todas agências) |

## 5.2 Funções de Verificação de Permissão

```sql
-- Verifica se usuário é admin
CREATE FUNCTION public.is_admin(_user_id UUID) RETURNS BOOLEAN

-- Verifica se é super admin
CREATE FUNCTION public.is_super_admin(_user_id UUID) RETURNS BOOLEAN

-- Verifica permissão específica
CREATE FUNCTION public.can_access_sales(_user_id UUID) RETURNS BOOLEAN
CREATE FUNCTION public.can_access_ops(_user_id UUID) RETURNS BOOLEAN
CREATE FUNCTION public.can_access_admin(_user_id UUID) RETURNS BOOLEAN
CREATE FUNCTION public.can_access_finance(_user_id UUID) RETURNS BOOLEAN
CREATE FUNCTION public.can_access_recurring(_user_id UUID) RETURNS BOOLEAN

-- Verifica acesso a agência específica
CREATE FUNCTION public.can_access_agency(_agency_id UUID, _user_id UUID) RETURNS BOOLEAN

-- Verifica role em agência
CREATE FUNCTION public.has_agency_role(_agency_id UUID, _user_id UUID, _role TEXT) RETURNS BOOLEAN
```

## 5.3 AuthContext (Frontend)

O arquivo `src/contexts/AuthContext.tsx` gerencia:

```typescript
interface AuthContextType {
  user: User | null;           // Usuário Supabase
  session: Session | null;     // Sessão ativa
  isLoading: boolean;          // Carregando
  userRole: AppRole | null;    // admin | operador | visualizador
  isAdmin: boolean;            // É admin da agência
  permissions: UserPermissions; // Permissões granulares
  derived: DerivedPermissions;  // Permissões derivadas (combinadas)
  signIn: (email, password) => Promise;
  signOut: () => Promise;
  refreshPermissions: () => Promise;
}

interface UserPermissions {
  canSales: boolean;
  canOps: boolean;
  canAdmin: boolean;
  canFinance: boolean;
  canRecurring: boolean;
}

interface DerivedPermissions {
  canSalesOrAdmin: boolean;    // canSales || canAdmin || isAdmin
  canOpsOrAdmin: boolean;      // canOps || canAdmin || isAdmin
  canFinanceOrAdmin: boolean;  // canFinance || canAdmin || isAdmin
  canAdminOrIsAdmin: boolean;  // canAdmin || isAdmin
  canRecurringOrAdmin: boolean;// canRecurring || canAdmin || isAdmin
}
```

---

# 6. MÓDULOS FUNCIONAIS

## 6.1 Dashboard (`/dashboard`)

Página inicial com visão geral:
- KPIs principais (clientes, leads, comissões)
- Kanban de clientes
- Filtros por responsável, status, coluna
- Barra de progresso global
- Acesso rápido a módulos

**Componentes principais**:
- `DashboardHeader.tsx`
- `StatsBar.tsx`
- `KanbanBoard.tsx`
- `GlobalProgressBar.tsx`

## 6.2 CRM de Vendas (`/dashboard` com toggle "Vendas")

Pipeline completo de leads:
- Kanban com 10 colunas configuráveis
- Importação de leads via CSV/Excel
- Temperatura (frio/morno/quente)
- Propostas e acompanhamento
- Atividades e histórico
- Conversão para cliente

**Componentes principais**:
- `LeadsKanban.tsx`
- `LeadDetailPanel.tsx`
- `NewLeadDialog.tsx`
- `ImportLeadsDialog.tsx`
- `LeadActivityTab.tsx`
- `LeadProposalTab.tsx`
- `LeadConversionTab.tsx`
- `LeadRaioXTab.tsx`

## 6.3 Execução de Cliente

Tela de execução detalhada de um cliente:
- Checklist completo (58 itens em 5 etapas)
- Comparações antes/depois
- Histórico de ações
- Anexos e fotos
- Configurações do cliente
- Timer de tarefas

**Componentes principais**:
- `ClientExecutionView.tsx`
- `ExecutionChecklist.tsx`
- `ExecutionHeader.tsx`
- `ChecklistBlock.tsx`
- `ChecklistItem.tsx`

## 6.4 Recorrência (`/recorrencia`)

Gestão de clientes com planos mensais:
- Lista de clientes recorrentes
- Rotinas configuráveis
- Tarefas geradas automaticamente
- Calendário de execução
- Relatório IA de recorrência

**Componentes principais**:
- `RecurrenceView.tsx`
- `RecurringOverview.tsx`
- `RecurringExecutionView.tsx`
- `RecurrenceReportAgent.tsx`

## 6.5 Comissões (`/comissoes`)

Sistema financeiro:
- Lista de comissões pendentes/pagas
- Configuração por colaborador
- Fluxo: pendente → aprovado → pago
- Relatório por período
- Projeção financeira

**Componentes principais**:
- `CommissionCard.tsx`
- `CommissionConfigPanel.tsx`
- `CommissionTimeline.tsx`
- `CommissionForecast.tsx`
- `CommissionsByRecipient.tsx`

## 6.6 Perguntas (`/perguntas`)

Central de dúvidas:
- Perguntas sobre clientes
- Status: pendente → respondida → resolvida
- Filtros e busca

**Componentes principais**:
- `AskQuestionButton.tsx`
- Página `Questions.tsx`

## 6.7 Sugestões (`/sugestoes`)

Caixa de sugestões da equipe:
- Criação de sugestões
- Categorização por nível
- Status: pendente → lida → arquivada

**Página**: `Suggestions.tsx`

## 6.8 Administração (`/admin`)

Gestão de usuários:
- Lista de usuários
- Criar novo usuário
- Alterar role e permissões
- Resetar senha
- Suspender/excluir

**Página**: `Admin.tsx`

## 6.9 Relatório Gerencial (`/relatorio-gestor`)

Dashboard executivo:
- Métricas consolidadas
- Funil de vendas
- Ranking de operadores
- Tendências e projeções
- Alertas e insights IA

**Componentes principais**:
- `ExecutiveKPICard.tsx`
- `FunnelVisualization.tsx`
- `RankingTable.tsx`
- `TrendComparisonTable.tsx`
- `WeeklyHeatmap.tsx`
- `HealthScoreGauge.tsx`
- `FinancialProjection.tsx`
- `AIInsightsPanel.tsx`

## 6.10 Agentes IA

### 6.10.1 Agente Raio-X (`/raiox`)
Análise de chamadas de vendas com IA:
- Transcrição de áudio
- Identificação de objeções
- Sugestão de scripts
- Próximos passos

### 6.10.2 Agente SEO (`/agente-seo`)
Análise de perfis Google Meu Negócio:
- Diagnóstico de otimização
- Sugestões de melhoria
- Palavras-chave recomendadas

### 6.10.3 Agente Suspensões (`/agente-suspensoes`)
Análise de perfis suspensos:
- Motivos prováveis
- Plano de recuperação
- Passos detalhados

---

# 7. EDGE FUNCTIONS (BACKEND)

## 7.1 Lista de Edge Functions

| Função | Propósito | Autenticação |
|--------|-----------|--------------|
| `create-user` | Criar novo usuário | Requer admin |
| `reset-user-password` | Resetar senha | Requer admin |
| `bootstrap-users` | Provisionar usuários iniciais | Token especial |
| `convert-lead-to-client` | Converter lead em cliente | Autenticado |
| `generate-recurring-tasks` | Gerar tarefas recorrentes | Autenticado |
| `analyze-raiox` | Análise IA de chamada | Autenticado |
| `analyze-seo` | Análise IA de SEO | Autenticado |
| `analyze-suspensao` | Análise IA de suspensão | Autenticado |
| `analyze-recurrence` | Relatório IA de recorrência | Autenticado |
| `generate-manager-report` | Relatório gerencial IA | Autenticado |
| `process-voice-command` | Processar comando de voz | Autenticado |
| `voice-to-text` | Transcrever áudio | Autenticado |

## 7.2 Estrutura de uma Edge Function

```typescript
// supabase/functions/nome-funcao/index.ts

import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    // ... validação

    // Lógica da função
    const { data, error } = await supabaseClient
      .from('tabela')
      .select('*');

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## 7.3 Chamando Edge Functions do Frontend

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("nome-funcao", {
  body: { parametro1: valor1 }
});
```

---

# 8. DESIGN SYSTEM

## 8.1 Cores Principais

```css
/* Dark Mode (padrão) */
--background: 220 15% 8%;        /* Fundo principal */
--foreground: 0 0% 100%;         /* Texto principal */
--primary: 142 100% 50%;         /* Verde neon (marca) */
--card: 220 14% 18%;             /* Cards */
--muted: 220 15% 18%;            /* Elementos secundários */
--border: 220 15% 28%;           /* Bordas */

/* Status */
--status-success: 142 76% 45%;   /* Verde sucesso */
--status-warning: 45 93% 47%;    /* Amarelo alerta */
--status-danger: 0 72% 51%;      /* Vermelho erro */
--status-info: 217 91% 60%;      /* Azul info */

/* Colunas Kanban (Delivery) */
--column-pipeline: 25 95% 53%;   /* Laranja */
--column-onboarding: 217 91% 60%;/* Azul */
--column-optimization: 32 95% 50%;/* Âmbar */
--column-delivered: 142 100% 50%; /* Verde */
--column-suspended: 0 72% 51%;   /* Vermelho */

/* Leads Pipeline (Vendas) */
--lead-cold: 210 50% 55%;        /* Azul frio */
--lead-hot: 0 72% 51%;           /* Vermelho quente */
--lead-gained: 142 76% 45%;      /* Verde ganho */
--lead-lost: 0 72% 51%;          /* Vermelho perdido */
```

## 8.2 Tipografia

- **Fonte Principal**: Inter (300-700)
- **Fonte Mono**: JetBrains Mono (para código/números)

## 8.3 Efeitos Visuais

```css
/* Glassmorphism */
.glass {
  backdrop-filter: blur(16px);
  background: hsl(var(--glass-bg));
  border: 1px solid hsl(var(--glass-border));
}

/* Neon Glow */
.neon-glow {
  box-shadow: 0 0 20px hsl(142 100% 50% / 0.5);
}

/* Hover Effects */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}
```

## 8.4 Componentes Base (Shadcn/UI)

O sistema usa Shadcn/UI com customizações:

- Button (variantes: default, outline, ghost, premium)
- Card (glass-card, depth-2)
- Dialog/Sheet
- Dropdown/Select
- Badge
- Toast (Sonner)
- Tooltip
- Tabs
- Accordion
- Table
- Form (react-hook-form + zod)

---

# 9. FLUXOS DE NEGÓCIO

## 9.1 Fluxo de Venda (Lead → Cliente)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Lead Frio   │────▶│ Contatado   │────▶│ Qualificado │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Reunião     │◀────│ Reunião     │◀────│ Reunião     │
│ Feita       │     │ Marcada     │     │ Qualificado │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Proposta    │────▶│ Negociação  │────▶│   GANHO     │
│ Enviada     │     │             │     │ (Converte)  │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │   PERDIDO   │
                    │ (Arquiva)   │
                    └─────────────┘
```

## 9.2 Fluxo de Execução (Cliente)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Pipeline    │────▶│ Onboarding  │────▶│ Otimização  │
│ (Verificar) │     │ (Iniciar)   │     │ (Fazendo)   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Entregues   │◀────│ Finalizados │◀────│ Com         │
│ (Arquivo)   │     │ (Entregar)  │     │ Pendência   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 9.3 Checklist de Execução (5 Etapas, 58 Itens)

### Etapa 1: Onboarding (4 itens)
- Fechar venda e criar grupo WhatsApp
- Alterar foto do grupo
- Dar boas vindas
- Agendar reunião de briefing

### Etapa 2: Preparação (14 itens)
- Comprar conta Gmail
- Criar pasta no Drive
- Criar conversa ChatGPT
- Prints ANTES (GBP Score, Localo, Google Ads)
- Briefing + propriedade do perfil
- Criar slogans
- Criar links WhatsApp
- Definir fotos

### Etapa 3: Produção (7 itens)
- Editar fotos no Lightroom
- Salvar no Drive
- Criar modelo GeoSetter
- Criar designs (produtos, postagens)
- Criar QR Codes
- Buscar/criar vídeos

### Etapa 4: Otimização (21 itens)
- Atualizar informações no perfil
- Responder avaliações
- Ajustar categorias
- Subir fotos com geolocalização
- Criar serviços e produtos
- Criar postagens
- Alterar nome SEO
- FAQs
- Cadastrar em diretórios
- Criar perfis sociais (YouTube, LinkedIn, TikTok, etc.)

### Etapa 5: Entrega (13 itens)
- Conferir organização
- Prints DEPOIS
- Criar relatório comparativo
- Verificar propriedade
- Entregar com apresentação
- Solicitar indicações
- Oferecer recorrência
- Pagar comissão

## 9.4 Fluxo de Comissões

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Cliente     │────▶│ Comissão    │────▶│ Comissão    │
│ Entregue    │     │ Gerada      │     │ Aprovada    │
└─────────────┘     │ (Pendente)  │     └─────────────┘
                    └─────────────┘            │
                                               ▼
                                        ┌─────────────┐
                                        │ Comissão    │
                                        │ Paga        │
                                        └─────────────┘
```

---

# 10. SEGURANÇA E RLS POLICIES

## 10.1 Padrão de RLS Policies

Cada tabela com `agency_id` tem 4 policies:

```sql
-- SELECT: Usuário só vê dados da sua agência
CREATE POLICY "tabela_select_tenant"
ON public.tabela FOR SELECT
TO authenticated
USING (agency_id = current_agency_id());

-- INSERT: Usuário só insere na sua agência
CREATE POLICY "tabela_insert_tenant"
ON public.tabela FOR INSERT
TO authenticated
WITH CHECK (agency_id = current_agency_id());

-- UPDATE: Usuário só atualiza na sua agência
CREATE POLICY "tabela_update_tenant"
ON public.tabela FOR UPDATE
TO authenticated
USING (agency_id = current_agency_id());

-- DELETE: Usuário só deleta na sua agência
CREATE POLICY "tabela_delete_tenant"
ON public.tabela FOR DELETE
TO authenticated
USING (agency_id = current_agency_id());
```

## 10.2 Policies Especiais

### Agencies
- `agencies_select_access`: Usuário vê agências onde é membro
- `agencies_insert_super_admin`: Só super admin cria agências
- `agencies_update_owner_admin`: Só owner/admin atualiza
- `agencies_delete_super_admin`: Só super admin deleta

### Profiles
- Usuário pode ver todos os perfis (para exibir nomes)
- Usuário só atualiza seu próprio perfil

### User Roles / Permissions
- Verificação via funções SECURITY DEFINER
- Evita recursão nas policies

## 10.3 Funções SECURITY DEFINER

Todas as funções de verificação usam `SECURITY DEFINER` para:
- Evitar recursão em RLS policies
- Executar com privilégios do dono da função
- Garantir acesso consistente

---

# 11. CHECKLIST DE MIGRAÇÃO PARA SAAS

## 11.1 Pré-Requisitos

- [ ] Criar remix do projeto no Lovable
- [ ] Ativar Lovable Cloud no projeto remixado (banco novo)
- [ ] Ter acesso de desenvolvedor aos dois projetos

## 11.2 Fase 1: Preparação do Banco de Dados

### 1.1 Rodar migrações base
```sql
-- As migrações do projeto original serão copiadas
-- Mas o banco estará vazio (sem dados)
```

### 1.2 Adicionar campo status à agencies
```sql
-- Se não existir, adicionar:
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- Valores: pending, active, suspended, cancelled
```

### 1.3 Verificar is_super_admin
```sql
-- Já existe em user_permissions
-- Será usado para o portal Super Admin
```

## 11.3 Fase 2: Implementar Super Admin

### 2.1 Criar página /super-admin
- [ ] Rota protegida (só is_super_admin = true)
- [ ] Lista todas as agências
- [ ] Métricas por agência
- [ ] Ações: aprovar, suspender, cancelar
- [ ] Impersonate (logar como agência)

### 2.2 Atualizar AuthContext
- [ ] Adicionar `isSuperAdmin` ao contexto
- [ ] Carregar `is_super_admin` de user_permissions
- [ ] Criar rota protegida

### 2.3 Criar funções de gestão
```sql
-- Aprovar agência
CREATE FUNCTION approve_agency(agency_id UUID) ...

-- Suspender agência
CREATE FUNCTION suspend_agency(agency_id UUID) ...

-- Impersonate (mudar current_agency_id)
CREATE FUNCTION impersonate_agency(agency_id UUID) ...
```

## 11.4 Fase 3: Implementar Onboarding

### 3.1 Criar página /register (pública)
- [ ] Formulário: nome da agência, nome do admin, email, senha
- [ ] Validação de email único
- [ ] Senha forte (8+ chars, número, símbolo)
- [ ] Aceite de termos

### 3.2 Criar edge function register-agency
```typescript
// supabase/functions/register-agency/index.ts
// 1. Criar usuário no Supabase Auth
// 2. Criar profile
// 3. Criar agency com status = 'pending'
// 4. Criar agency_member (role = 'owner')
// 5. Criar user_role (role = 'admin')
// 6. Criar user_permissions
// 7. Notificar Super Admin
```

### 3.3 Fluxo de aprovação
```
Registro → Status: pending → Super Admin aprova → Status: active → Acesso liberado
```

### 3.4 Página de aguardando aprovação
- [ ] Exibir quando status = 'pending'
- [ ] Mensagem explicativa
- [ ] Contato para dúvidas

## 11.5 Fase 4: Nova Identidade Visual

### 4.1 Substituir assets
- [ ] Remover logo RANKEIA (`src/assets/rankeia-logo.png`)
- [ ] Adicionar novo logo
- [ ] Atualizar favicon
- [ ] Atualizar título no index.html

### 4.2 Ajustar cores (index.css)
```css
/* Sugestão: Trocar verde neon por cor da nova marca */
--primary: [nova cor HSL];
--accent: [nova cor HSL];
```

### 4.3 Atualizar textos
- [ ] Buscar/substituir "RANKEIA" por novo nome
- [ ] Atualizar meta tags
- [ ] Atualizar rodapé

## 11.6 Fase 5: Landing Page

### 5.1 Criar página / (pública)
- [ ] Hero section com proposta de valor
- [ ] Features do produto
- [ ] Preços (futuro)
- [ ] Depoimentos
- [ ] CTA para registro

### 5.2 Criar layout público
- [ ] Header sem autenticação
- [ ] Footer com links
- [ ] Navegação básica

## 11.7 Fase 6: Testes

### 6.1 Testar fluxo completo
- [ ] Registrar nova agência
- [ ] Verificar status pending
- [ ] Aprovar no Super Admin
- [ ] Logar como nova agência
- [ ] Verificar isolamento de dados
- [ ] Criar dados de teste
- [ ] Verificar que agências não veem dados umas das outras

### 6.2 Testar permissões
- [ ] Super Admin vê todas agências
- [ ] Admin normal só vê sua agência
- [ ] Operador tem acesso correto
- [ ] Visualizador é read-only

## 11.8 Fase 7: Deploy Inicial

### 7.1 Configurar domínio
- [ ] Domínio customizado no Lovable
- [ ] SSL configurado
- [ ] DNS apontando

### 7.2 Criar primeiro Super Admin
```sql
-- Inserir você como super admin
INSERT INTO user_permissions (user_id, is_super_admin, can_admin, can_sales, can_ops, can_finance, can_recurring)
VALUES ('[seu-user-id]', true, true, true, true, true, true);
```

### 7.3 Gerar link para alunos
- [ ] Link: `https://seudominio.com/register`
- [ ] Compartilhar com os 10 alunos iniciais
- [ ] Monitorar registros
- [ ] Aprovar conforme chegam

---

# 12. GUIA DE IMPLEMENTAÇÃO SUPER ADMIN

## 12.1 Estrutura da Página

```typescript
// src/pages/SuperAdmin.tsx

export default function SuperAdmin() {
  const { user, isSuperAdmin } = useAuth();
  
  // Redirect se não for super admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <SuperAdminHeader />
      <SuperAdminStats />
      <AgenciesList />
    </div>
  );
}
```

## 12.2 Componentes Necessários

### 12.2.1 SuperAdminHeader
- Logo do produto SaaS
- Nome do super admin
- Botão de logout

### 12.2.2 SuperAdminStats
- Total de agências
- Agências ativas
- Agências pendentes
- MRR total (futuro)

### 12.2.3 AgenciesList
```typescript
interface Agency {
  id: string;
  name: string;
  slug: string;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  owner_email: string;
  members_count: number;
  clients_count: number;
}
```

### 12.2.4 AgencyActions
- Aprovar (pending → active)
- Suspender (active → suspended)
- Reativar (suspended → active)
- Impersonate (logar como)
- Ver detalhes

## 12.3 RLS Policies para Super Admin

```sql
-- Super Admin pode ver todas as agências
CREATE POLICY "super_admin_select_all_agencies"
ON public.agencies FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) 
  OR id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
);

-- Super Admin pode atualizar qualquer agência
CREATE POLICY "super_admin_update_agencies"
ON public.agencies FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));
```

## 12.4 Edge Function para Impersonate

```typescript
// supabase/functions/impersonate-agency/index.ts

// 1. Verificar se caller é super admin
// 2. Atualizar profiles.current_agency_id
// 3. Retornar sucesso
```

---

# 13. GUIA DE IMPLEMENTAÇÃO ONBOARDING

## 13.1 Página de Registro

```typescript
// src/pages/Register.tsx

const registerSchema = z.object({
  agencyName: z.string().min(3),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/\d/)
    .regex(/[!@#$%^&*]/),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v === true),
}).refine(data => data.password === data.confirmPassword);

export default function Register() {
  const handleSubmit = async (data) => {
    const { error } = await supabase.functions.invoke('register-agency', {
      body: data
    });
    
    if (!error) {
      navigate('/pending-approval');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário */}
    </form>
  );
}
```

## 13.2 Edge Function register-agency

```typescript
// supabase/functions/register-agency/index.ts

serve(async (req) => {
  const { agencyName, adminName, email, password } = await req.json();
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  // 1. Criar usuário
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: adminName }
  });

  if (authError) throw authError;
  const userId = authData.user.id;

  // 2. Criar agency
  const slug = agencyName.toLowerCase().replace(/\s+/g, '-');
  const { data: agency, error: agencyError } = await supabaseAdmin
    .from('agencies')
    .insert({ name: agencyName, slug, status: 'pending' })
    .select()
    .single();

  // 3. Criar profile
  await supabaseAdmin.from('profiles').insert({
    id: userId,
    full_name: adminName,
    current_agency_id: agency.id,
    status: 'ativo'
  });

  // 4. Criar agency_member
  await supabaseAdmin.from('agency_members').insert({
    agency_id: agency.id,
    user_id: userId,
    role: 'owner'
  });

  // 5. Criar user_role
  await supabaseAdmin.from('user_roles').insert({
    user_id: userId,
    role: 'admin'
  });

  // 6. Criar user_permissions
  await supabaseAdmin.from('user_permissions').insert({
    user_id: userId,
    can_sales: true,
    can_ops: true,
    can_admin: true,
    can_finance: true,
    can_recurring: true,
    is_super_admin: false
  });

  return new Response(JSON.stringify({ success: true }));
});
```

## 13.3 Página Pending Approval

```typescript
// src/pages/PendingApproval.tsx

export default function PendingApproval() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Aguardando Aprovação</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Sua agência foi registrada com sucesso!
            Estamos analisando seu cadastro e você receberá
            um email quando for aprovado.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Email cadastrado: {user?.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 13.4 Proteção de Rotas

```typescript
// src/components/ProtectedRoute.tsx

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const [agencyStatus, setAgencyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Buscar status da agência
      supabase
        .from('agencies')
        .select('status')
        .eq('id', user.current_agency_id)
        .single()
        .then(({ data }) => setAgencyStatus(data?.status));
    }
  }, [user]);

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/auth" />;
  if (agencyStatus === 'pending') return <Navigate to="/pending-approval" />;
  if (agencyStatus === 'suspended') return <Navigate to="/suspended" />;

  return children;
}
```

---

# 14. ARQUIVOS CRÍTICOS DO SISTEMA

## 14.1 Configuração

| Arquivo | Propósito |
|---------|-----------|
| `supabase/config.toml` | Config Supabase (auto-gerado) |
| `src/integrations/supabase/client.ts` | Cliente Supabase (auto-gerado) |
| `src/integrations/supabase/types.ts` | Tipos do banco (auto-gerado) |
| `tailwind.config.ts` | Configuração Tailwind |
| `src/index.css` | Design system e variáveis CSS |

## 14.2 Core da Aplicação

| Arquivo | Propósito |
|---------|-----------|
| `src/App.tsx` | Rotas e providers |
| `src/contexts/AuthContext.tsx` | Autenticação e permissões |
| `src/pages/Auth.tsx` | Página de login |
| `src/pages/Dashboard.tsx` | Dashboard principal |
| `src/pages/Admin.tsx` | Administração de usuários |

## 14.3 Módulos de Negócio

| Arquivo | Propósito |
|---------|-----------|
| `src/types/client.ts` | Tipos e checklist de clientes |
| `src/types/lead.ts` | Tipos de leads e pipeline |
| `src/hooks/useClients.ts` | CRUD de clientes |
| `src/hooks/useLeads.ts` | CRUD de leads |
| `src/hooks/useCommissions.ts` | CRUD de comissões |
| `src/hooks/useRecurring.ts` | Gestão de recorrência |

## 14.4 Componentes Principais

| Arquivo | Propósito |
|---------|-----------|
| `src/components/KanbanBoard.tsx` | Kanban de clientes |
| `src/components/leads/LeadsKanban.tsx` | Kanban de leads |
| `src/components/ClientExecutionView.tsx` | Execução de cliente |
| `src/components/checklist/ChecklistBlock.tsx` | Bloco de checklist |
| `src/components/AppSidebar.tsx` | Sidebar de navegação |

## 14.5 Edge Functions

| Arquivo | Propósito |
|---------|-----------|
| `supabase/functions/create-user/index.ts` | Criar usuário |
| `supabase/functions/reset-user-password/index.ts` | Resetar senha |
| `supabase/functions/convert-lead-to-client/index.ts` | Converter lead |
| `supabase/functions/analyze-raiox/index.ts` | Análise IA |
| `supabase/functions/generate-manager-report/index.ts` | Relatório IA |

---

# 15. PROMPT PARA NOVAS CONVERSAS

## 15.1 Prompt Resumido (ChatGPT / Claude)

```
Você é um desenvolvedor senior trabalhando no projeto RANKEIA, uma plataforma SaaS de gestão para agências de marketing Google Meu Negócio.

## Stack:
- Frontend: React 18 + TypeScript + Vite + Tailwind + Shadcn/UI
- Backend: Supabase (PostgreSQL + Edge Functions + Auth)
- State: TanStack Query + Zustand

## Arquitetura Multi-Tenant:
- Cada agência é um tenant isolado (agency_id)
- 18 tabelas com RLS policies por agency_id
- Função current_agency_id() retorna a agência do usuário logado
- Triggers auto-preenchem agency_id em INSERT

## Sistema de Permissões:
- user_roles: admin | operador | visualizador
- user_permissions: can_sales, can_ops, can_admin, can_finance, can_recurring, is_super_admin
- Funções SQL: is_admin(), is_super_admin(), can_access_*()

## Módulos:
1. CRM de Vendas (leads): Pipeline de 10 etapas, temperatura, propostas
2. Delivery (clients): Kanban 7 colunas, checklist 58 itens em 5 etapas
3. Recorrência: Clientes mensais, rotinas, tarefas automáticas
4. Comissões: Sistema financeiro, fluxo pending→approved→paid
5. Agentes IA: Análise de chamadas, SEO, suspensões
6. Relatório Gerencial: Dashboard executivo

## Estrutura de Arquivos Importantes:
- src/contexts/AuthContext.tsx (autenticação)
- src/types/client.ts (tipos e checklist padrão)
- src/types/lead.ts (tipos de leads e pipeline)
- src/hooks/use*.ts (hooks de dados)
- supabase/functions/*.ts (edge functions)

## Regras:
- Não modificar arquivos auto-gerados (types.ts, client.ts, config.toml)
- Usar design tokens do index.css (não cores hardcoded)
- RLS policies em todas tabelas com dados sensíveis
- Funções SECURITY DEFINER para evitar recursão
```

## 15.2 Prompt Completo (Lovable)

```
Este é o projeto RANKEIA, uma plataforma de gestão para agências de marketing especializadas em Google Meu Negócio.

O sistema está ~80% pronto para virar SaaS multi-tenant. A arquitetura atual inclui:

1. MULTI-TENANCY IMPLEMENTADO:
- Tabela agencies com id, name, slug, status
- 18 tabelas com coluna agency_id + RLS policies
- Função current_agency_id() para filtrar dados
- Triggers para auto-preencher agency_id

2. SISTEMA DE PERMISSÕES:
- user_roles: admin, operador, visualizador
- user_permissions: can_sales, can_ops, can_admin, can_finance, can_recurring, is_super_admin
- AuthContext com permissões derivadas

3. MÓDULOS:
- Dashboard com Kanban de clientes e leads
- CRM de Vendas (leads) com pipeline de 10 etapas
- Delivery (clients) com checklist de 58 itens
- Recorrência para clientes mensais
- Comissões (pending → approved → paid)
- Agentes IA (Raio-X, SEO, Suspensões)
- Relatório Gerencial

4. EDGE FUNCTIONS:
- create-user, reset-user-password
- convert-lead-to-client
- analyze-raiox, analyze-seo, analyze-suspensao
- generate-manager-report
- generate-recurring-tasks

5. O QUE FALTA PARA SAAS:
- Super Admin Portal (/super-admin)
- Onboarding self-service (/register)
- Fluxo de aprovação de agências
- Nova identidade visual
- Landing page pública

Estou migrando para um projeto remixado para separar meus dados dos dados dos clientes SaaS. Preciso implementar o Super Admin e o Onboarding com aprovação manual.
```

---

# CONCLUSÃO

Este dossiê documenta completamente o sistema RANKEIA, incluindo:

- Arquitetura técnica detalhada
- Schema completo do banco de dados (28 tabelas)
- Sistema de multi-tenancy com RLS
- Autenticação e permissões granulares
- Todos os módulos funcionais
- Edge functions de backend
- Design system
- Fluxos de negócio
- Checklist completa de migração para SaaS
- Guias de implementação do Super Admin e Onboarding
- Prompts para continuar em novas conversas

Com este documento, qualquer desenvolvedor ou IA pode entender o sistema completo e continuar o desenvolvimento, seja no Lovable ou em qualquer outra plataforma.

---

**Documento gerado em**: Dezembro 2024  
**Tamanho aproximado**: ~10.000 palavras  
**Formato**: Markdown  
**Licença**: Privado - RANKEIA
