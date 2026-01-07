# DESCRITIVO COMPLETO DO GBRANK CRM
## Sistema de Gestão Operacional para Agências de Google Meu Negócio

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Autor:** Documentação Técnica Oficial  

---

# ÍNDICE

1. [VISÃO GERAL DO SISTEMA](#1-visão-geral-do-sistema)
2. [PROPÓSITO E PÚBLICO-ALVO](#2-propósito-e-público-alvo)
3. [ARQUITETURA TÉCNICA](#3-arquitetura-técnica)
4. [SISTEMA DE MULTI-TENANCY (MULTI-AGÊNCIA)](#4-sistema-de-multi-tenancy-multi-agência)
5. [AUTENTICAÇÃO E PERMISSÕES](#5-autenticação-e-permissões)
6. [MÓDULO 1: FUNIL DE VENDAS (CRM)](#6-módulo-1-funil-de-vendas-crm)
7. [MÓDULO 2: FUNIL DE OTIMIZAÇÃO (DELIVERY)](#7-módulo-2-funil-de-otimização-delivery)
8. [MÓDULO 3: GESTÃO DE RECORRÊNCIA](#8-módulo-3-gestão-de-recorrência)
9. [MÓDULO 4: PROPOSTAS COMERCIAIS](#9-módulo-4-propostas-comerciais)
10. [MÓDULO 5: CONTRATOS DIGITAIS](#10-módulo-5-contratos-digitais)
11. [MÓDULO 6: SISTEMA DE COMISSÕES](#11-módulo-6-sistema-de-comissões)
12. [MÓDULO 7: AGENTES DE INTELIGÊNCIA ARTIFICIAL](#12-módulo-7-agentes-de-inteligência-artificial)
13. [MÓDULO 8: RELATÓRIO GERENCIAL](#13-módulo-8-relatório-gerencial)
14. [MÓDULO 9: ADMINISTRAÇÃO E EQUIPE](#14-módulo-9-administração-e-equipe)
15. [MÓDULO 10: FERRAMENTAS AUXILIARES](#15-módulo-10-ferramentas-auxiliares)
16. [NAVEGAÇÃO E INTERFACE](#16-navegação-e-interface)
17. [PÁGINAS PÚBLICAS](#17-páginas-públicas)
18. [REGRAS DE NEGÓCIO](#18-regras-de-negócio)
19. [DESIGN SYSTEM](#19-design-system)

---

# 1. VISÃO GERAL DO SISTEMA

## 1.1 O que é o GBRank CRM?

O GBRank CRM é uma plataforma SaaS (Software as a Service) completa de gestão operacional desenvolvida especificamente para agências de marketing digital especializadas em Google Meu Negócio (Google Business Profile). O sistema gerencia todo o ciclo de vida do relacionamento com clientes, desde a captação de leads até a entrega final dos serviços e gestão de planos recorrentes.

## 1.2 Principais Funcionalidades

O sistema oferece um ecossistema completo e integrado composto por:

1. **Funil de Vendas Inteligente**: Pipeline visual em formato Kanban com 10 estágios configuráveis, desde "Lead Frio" até "Ganho" ou "Perdido", incluindo assistente de IA (Lead Copilot) que sugere próximos passos para cada oportunidade.

2. **Gestão de Execução (Delivery)**: Kanban de clientes em execução com checklist detalhado de 58 itens divididos em 5 etapas de otimização do perfil Google Meu Negócio.

3. **Gestão de Recorrência**: Controle completo de clientes com planos mensais, incluindo rotinas automatizadas, tarefas periódicas e monitoramento de compliance.

4. **Propostas Automatizadas**: Geração de propostas comerciais profissionais com blocos personalizáveis, rastreamento de visualizações e conversão direta para contrato.

5. **Contratos Digitais**: Sistema completo de geração e gestão de contratos com cláusulas customizáveis, variáveis dinâmicas e assinatura digital integrada.

6. **Sistema de Comissões**: Gestão financeira automatizada para pagamento de equipe, com configuração flexível por colaborador e fluxo de aprovação.

7. **Agentes de IA**: Ferramentas de inteligência artificial para análise de perfis Google (Raio-X, SEO, Suspensões) e geração de relatórios automáticos.

8. **Relatório Gerencial**: Dashboard executivo com métricas consolidadas, ranking de equipe, projeções financeiras e insights de IA.

9. **Gestão Multi-Agência**: Arquitetura SaaS que permite múltiplas agências isoladas, cada uma com seus próprios dados, usuários e configurações.

## 1.3 Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | React + TypeScript | 19.x |
| **Build Tool** | Vite | Latest |
| **Estilização** | Tailwind CSS + Shadcn/UI | 3.4+ |
| **State Management** | TanStack Query + Zustand | 5.x |
| **Roteamento** | React Router DOM | 6.30+ |
| **Backend** | Supabase (Lovable Cloud) | Latest |
| **Banco de Dados** | PostgreSQL | 15+ |
| **Autenticação** | Supabase Auth | Native |
| **Edge Functions** | Deno (Supabase Functions) | Latest |
| **IA** | Lovable AI (Gemini/OpenAI) | Multi-model |
| **Animações** | Framer Motion | 12.x |
| **Gráficos** | Recharts | 2.15+ |
| **Formulários** | React Hook Form + Zod | 7.x / 3.x |

## 1.4 Métricas do Sistema

- **35+ tabelas** no banco de dados PostgreSQL
- **18+ tabelas** com isolamento por `agency_id` (multi-tenant)
- **20+ edge functions** para lógica de backend
- **28 rotas** funcionais no sistema
- **~180 componentes** React
- **~120 políticas RLS** de segurança
- **5 contextos React** para gerenciamento de estado global

---

# 2. PROPÓSITO E PÚBLICO-ALVO

## 2.1 Problema que o Sistema Resolve

Agências de Google Meu Negócio enfrentam diariamente desafios operacionais críticos:

- **Leads perdidos**: Oportunidades de venda dispersas em planilhas desorganizadas, anotações manuais e conversas de WhatsApp esquecidas, resultando em follow-ups tardios e vendas perdidas.

- **Propostas inconsistentes**: Cada proposta comercial é elaborada manualmente do zero, sem padronização, consumindo tempo excessivo e gerando apresentações desiguais.

- **Contratos desorganizados**: Documentos dispersos em múltiplas ferramentas, sem rastreabilidade, deixando a agência vulnerável a problemas jurídicos.

- **Falta de visibilidade**: Gestores sem informações consolidadas sobre performance da equipe, status dos clientes e previsão de faturamento.

- **Processos improvisados**: Cada membro da equipe executa tarefas de forma diferente, sem checklists padrão, gerando retrabalho e entregas inconsistentes.

- **Dificuldade em demonstrar valor**: Sem relatórios visuais e métricas claras, renovações de contrato se tornam uma batalha de convencimento.

- **Comissões calculadas manualmente**: Planilhas de comissões sujeitas a erros, gerando conflitos internos e atrasos nos pagamentos.

## 2.2 Público-Alvo

O GBRank CRM é direcionado para:

- **Agências de marketing digital** especializadas em negócios locais e otimização de perfis Google Meu Negócio
- **Freelancers** que gerenciam múltiplos perfis de clientes
- **Consultores de SEO local** que precisam de ferramentas específicas para o nicho
- **Empresas de marketing** que desejam escalar operações de GMB com processos padronizados

## 2.3 Resultados Esperados

Com a implementação do GBRank CRM, agências podem alcançar:

- **+40% produtividade** da equipe através de automações e processos padronizados
- **-60% tempo** gasto em tarefas administrativas manuais
- **+25% conversão** de leads com follow-up automatizado e assistente de IA
- **Zero leads perdidos** com CRM centralizado e alertas de próxima ação
- **100% rastreabilidade** de propostas, contratos e comissões

---

# 3. ARQUITETURA TÉCNICA

## 3.1 Diagrama de Arquitetura

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

## 3.2 Estrutura de Diretórios

```
gbrank-crm/
├── src/
│   ├── assets/              # Imagens e recursos estáticos
│   ├── components/          # Componentes React
│   │   ├── agents/          # Modais de agentes IA
│   │   ├── bi/              # Componentes de Business Intelligence
│   │   ├── checklist/       # Componentes de checklist
│   │   ├── commissions/     # Sistema de comissões
│   │   ├── contracts/       # Sistema de contratos
│   │   ├── dashboard/       # Componentes do dashboard
│   │   ├── execution/       # Execução de clientes
│   │   ├── landing/         # Componentes da landing page
│   │   ├── leads/           # CRM de vendas
│   │   ├── manager-report/  # Relatório gerencial
│   │   ├── notifications/   # Sistema de notificações
│   │   ├── nps/             # Pesquisa NPS
│   │   ├── onboarding/      # Onboarding de usuários
│   │   ├── proposals/       # Sistema de propostas
│   │   ├── recurring/       # Gestão de recorrência
│   │   ├── subscription/    # Gestão de assinaturas
│   │   ├── team/            # Gestão de equipe
│   │   └── ui/              # Componentes base (Shadcn)
│   ├── contexts/            # React Contexts
│   │   ├── AuthContext.tsx  # Autenticação e permissões
│   │   ├── FunnelModeContext.tsx # Modo do funil (Vendas/Otimização/Recorrência)
│   │   ├── QADebugContext.tsx    # Debug QA
│   │   └── UndoRedoContext.tsx   # Undo/Redo global
│   ├── hooks/               # Custom hooks (60+)
│   ├── integrations/        # Integrações externas
│   │   └── supabase/        # Cliente e tipos Supabase
│   ├── lib/                 # Utilitários e helpers
│   ├── pages/               # Páginas da aplicação (28)
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript types
│   └── utils/               # Funções auxiliares
├── supabase/
│   ├── config.toml          # Configuração Supabase
│   ├── functions/           # Edge Functions (20+)
│   └── migrations/          # Migrações SQL
├── docs/                    # Documentação
└── public/                  # Assets públicos
```

## 3.3 Contextos React (State Management)

O sistema utiliza 5 contextos principais para gerenciamento de estado global:

### AuthContext
Gerencia toda a autenticação e autorização:
- Sessão e usuário logado
- Role do usuário (admin, operador, visualizador)
- Permissões granulares (canSales, canOps, canAdmin, canFinance, canRecurring)
- Permissões derivadas (canSalesOrAdmin, canOpsOrAdmin, etc.)
- ID da agência atual
- Funções de login/logout

### FunnelModeContext
Controla o modo de visualização do dashboard:
- Modo "Vendas" (funil de leads)
- Modo "Otimização" (funil de clientes)
- Modo "Recorrência" (tarefas periódicas)
- Verificação de permissões por modo

### UndoRedoContext
Sistema de desfazer/refazer global:
- Histórico de ações
- Navegação no histórico
- Atalhos de teclado (Ctrl+Z / Ctrl+Y)

### QADebugContext
Ferramentas de debug para QA:
- Logs de ações
- Estado do sistema
- Diagnóstico de problemas

### ClientsProvider
Gerenciamento de clientes em memória:
- Lista de clientes
- Cliente selecionado
- Estado do painel de detalhes
- Modo de visualização (kanban, tabela, cards, etc.)

---

# 4. SISTEMA DE MULTI-TENANCY (MULTI-AGÊNCIA)

## 4.1 Conceito

O GBRank CRM implementa arquitetura multi-tenant por discriminador, onde cada agência é um "tenant" completamente isolado. A separação de dados é garantida pela coluna `agency_id` presente em todas as tabelas principais, combinada com políticas RLS (Row Level Security) do PostgreSQL.

## 4.2 Fluxo de Funcionamento

```
1. Usuário faz login
   └─▶ Supabase Auth valida credenciais
       └─▶ Sistema busca current_agency_id do profile
           └─▶ Função current_agency_id() retorna o ID
               └─▶ RLS policies filtram dados por agency_id
```

## 4.3 Tabelas com Isolamento por agency_id

As seguintes 18 tabelas principais possuem isolamento completo:

1. `agency_members` - Membros da agência
2. `audit_log` - Log de auditoria
3. `clients` - Clientes em execução
4. `clients_v2` - Clientes (nova versão)
5. `commission_configs` - Configurações de comissão
6. `commission_roles` - Papéis de comissão
7. `commissions_v2` - Registros de comissões
8. `contracts` - Contratos
9. `lead_activities` - Atividades de leads
10. `lead_sources` - Fontes de leads
11. `leads` - Oportunidades de venda
12. `lost_reasons` - Motivos de perda
13. `proposals` - Propostas comerciais
14. `questions` - Perguntas sobre clientes
15. `raiox_analyses` - Análises de IA
16. `recurring_clients` - Clientes recorrentes
17. `recurring_routines` - Rotinas recorrentes
18. `recurring_tasks` - Tarefas recorrentes
19. `suggestions` - Sugestões da equipe

## 4.4 Função current_agency_id()

Função SQL crítica que retorna a agência atual do usuário logado:

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

Esta função é utilizada em todas as políticas RLS para garantir o isolamento de dados.

## 4.5 Auto-Preenchimento de agency_id

Cada tabela isolada possui um trigger que preenche automaticamente o `agency_id` durante inserções:

```sql
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

O sistema implementa uma hierarquia de permissões em três camadas:

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

### Roles Disponíveis (user_roles.role)

| Role | Descrição |
|------|-----------|
| `super_admin` | Administrador global do SaaS (gerencia todas as agências) |
| `owner` | Proprietário da agência |
| `admin` | Administrador da agência (todas as permissões) |
| `manager` | Gestor (visualização ampla, algumas ações) |
| `sales_rep` | Vendedor (acesso ao funil de vendas) |
| `operador` | Operador (acesso à execução/delivery) |
| `support` | Suporte (visualização e dúvidas) |
| `visualizador` | Apenas visualização |

## 5.2 Permissões Granulares (user_permissions)

Cada usuário possui permissões específicas que podem ser combinadas:

| Permissão | Descrição |
|-----------|-----------|
| `can_sales` | Acesso ao módulo de vendas (leads, propostas) |
| `can_ops` | Acesso ao módulo de operação (clientes, checklist) |
| `can_admin` | Acesso à administração (usuários, configurações) |
| `can_finance` | Acesso às finanças (comissões, faturamento) |
| `can_recurring` | Acesso ao módulo de recorrência |
| `is_super_admin` | Super admin global (gerencia todas agências) |

## 5.3 Permissões Derivadas

O sistema calcula permissões derivadas para simplificar verificações:

| Permissão Derivada | Lógica |
|-------------------|--------|
| `canSalesOrAdmin` | canSales \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin |
| `canOpsOrAdmin` | canOps \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin |
| `canFinanceOrAdmin` | canFinance \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin |
| `canAdminOrIsAdmin` | canAdmin \|\| isAdmin \|\| isSuperAdmin |
| `canRecurringOrAdmin` | canRecurring \|\| canAdmin \|\| isAdmin \|\| isSuperAdmin |

## 5.4 Fluxo de Autenticação

1. Usuário acessa `/auth` e insere credenciais
2. Supabase Auth valida email e senha
3. Sistema busca profile do usuário (current_agency_id, status)
4. Sistema busca role em `user_roles`
5. Sistema busca permissões em `user_permissions`
6. Contexto AuthContext é populado com todas as informações
7. Usuário é redirecionado para `/dashboard`

---

# 6. MÓDULO 1: FUNIL DE VENDAS (CRM)

## 6.1 Visão Geral

O funil de vendas é o módulo responsável por gerenciar todo o pipeline comercial da agência, desde a captação inicial de leads até a conversão em clientes. Acessível através do toggle "Vendas" no dashboard ou diretamente pela sidebar.

## 6.2 Estrutura de Dados (Lead)

```typescript
interface Lead {
  id: string;
  company_name: string;           // Nome da empresa
  contact_name: string | null;    // Nome do contato
  whatsapp: string | null;        // WhatsApp
  phone: string | null;           // Telefone fixo
  email: string | null;           // E-mail
  instagram: string | null;       // Instagram
  city: string | null;            // Cidade
  main_category: string | null;   // Categoria do negócio
  
  // Pipeline
  pipeline_stage: LeadPipelineStage; // Estágio no funil
  temperature: 'cold' | 'warm' | 'hot'; // Temperatura
  probability: number;            // % probabilidade de fechamento
  estimated_value: number | null; // Valor estimado da venda
  
  // Próxima ação
  next_action: string | null;     // Descrição da próxima ação
  next_action_date: string | null; // Data da próxima ação
  
  // Proposta
  proposal_url: string | null;
  proposal_status: ProposalStatus;
  proposal_notes: string | null;
  
  // Status final
  status: 'open' | 'gained' | 'lost' | 'future';
  lost_reason_id: string | null;  // Motivo de perda
  lost_notes: string | null;
  converted_client_id: string | null; // ID do cliente convertido
  converted_at: string | null;
  
  // Metadados
  responsible: string;            // Responsável pelo lead
  created_by: string;
  created_at: string;
  last_activity_at: string;
}
```

## 6.3 Estágios do Pipeline

O funil de vendas possui 10 estágios configuráveis:

| Estágio | Emoji | Cor | Descrição |
|---------|-------|-----|-----------|
| `cold` | 🧊 | Cinza | Leads frios, sem contato inicial |
| `contacted` | 📞 | Azul | Primeiro contato realizado |
| `qualified` | ✅ | Ciano | Lead qualificado, com potencial |
| `meeting_scheduled` | 📅 | Roxo | Reunião agendada |
| `meeting_done` | 🤝 | Índigo | Reunião realizada |
| `proposal_sent` | 📄 | Âmbar | Proposta enviada |
| `negotiating` | 💬 | Laranja | Em negociação |
| `future` | ⏳ | Cinza | Para contato futuro |
| `gained` | ✅ | Verde | Venda fechada (converte para cliente) |
| `lost` | ❌ | Vermelho | Oportunidade perdida |

## 6.4 Temperatura do Lead

| Temperatura | Emoji | Descrição |
|-------------|-------|-----------|
| `cold` 🧊 | Frio | Baixo interesse ou contato inicial |
| `warm` 🌤️ | Morno | Interesse moderado, em consideração |
| `hot` 🔥 | Quente | Alto interesse, pronto para fechar |

## 6.5 Telas e Funcionalidades

### 6.5.1 Dashboard de Vendas (`/dashboard` modo Vendas)

**Componentes exibidos:**
- `SalesDashboard`: KPIs de vendas (leads ativos, temperatura, valor estimado)
- `LeadsKanban`: Kanban arrastável com todos os leads por estágio

**Funcionalidades:**
- Visualizar todos os leads organizados por estágio
- Arrastar leads entre colunas (drag & drop)
- Filtrar por responsável, temperatura, cidade
- Clicar em um lead abre o painel de detalhes

### 6.5.2 Painel de Detalhes do Lead

**Abas disponíveis:**

1. **Atividades** (`LeadActivityTab`)
   - Histórico completo de interações
   - Adicionar nova atividade (WhatsApp, Ligação, Reunião, Nota, Follow-up, E-mail)
   - Cada atividade registra: tipo, conteúdo, link opcional, quem criou, quando

2. **Proposta** (`LeadProposalTab`)
   - Link para proposta enviada
   - Status da proposta (não enviada, enviada, em revisão, aprovada, rejeitada)
   - Notas sobre a proposta
   - Botão para criar nova proposta

3. **Conversão** (`LeadConversionTab`)
   - Marcar lead como "Ganho" e converter para cliente
   - Escolher tipo de plano (Único ou Recorrência)
   - Marcar lead como "Perdido" com motivo
   - Guardar para "Futuro"

4. **Raio-X** (`LeadRaioXTab`)
   - Análise de IA da chamada/reunião
   - Transcrição, resumo, objeções identificadas
   - Sugestão de script e próximos passos

5. **Copilot** (`LeadCopilotTab`)
   - Chat com IA sobre o lead
   - Resumo automático do lead
   - Sugestões de ação baseadas no histórico
   - Análise de qualidade do lead

### 6.5.3 Criar Novo Lead (`NewLeadDialog`)

**Campos do formulário:**
- Nome da empresa* (obrigatório)
- Nome do contato
- WhatsApp
- Telefone
- E-mail
- Instagram
- Cidade
- Categoria principal
- Fonte do lead (dropdown configurável)
- Estágio inicial
- Temperatura
- Valor estimado
- Responsável
- Notas

### 6.5.4 Importar Leads (`ImportLeadsDialog`)

**Funcionalidades:**
- Upload de arquivo CSV ou Excel
- Mapeamento de colunas
- Detecção de duplicados
- Preview antes de importar
- Relatório de importação

## 6.6 Conversão de Lead para Cliente

Quando um lead é marcado como "Ganho":

1. Usuário clica no botão "Ganhou!" no painel de conversão
2. Sistema solicita o tipo de plano: "Único" ou "Recorrência"
3. Edge Function `convert-lead-to-client` é acionada:
   - Cria novo registro em `clients` com dados do lead
   - Se recorrência, também cria em `recurring_clients`
   - Atualiza lead: `status = 'gained'`, `converted_client_id = novo_id`
   - Registra atividade no histórico do lead
4. Toast de sucesso com opção de ver o cliente
5. Sistema muda automaticamente para modo "Otimização"

## 6.7 Fontes de Lead (lead_sources)

Tabela configurável com origens dos leads:
- Instagram
- Indicação
- Google Ads
- Site
- WhatsApp
- Evento
- Parceiro
- Outros (customizável)

## 6.8 Motivos de Perda (lost_reasons)

Tabela configurável com motivos de perda:
- Preço alto
- Concorrência
- Timing inadequado
- Sem necessidade
- Não respondeu
- Desistiu
- Outro (customizável)

---

# 7. MÓDULO 2: FUNIL DE OTIMIZAÇÃO (DELIVERY)

## 7.1 Visão Geral

O funil de otimização gerencia todo o processo de execução dos serviços para clientes. Desde a entrada do cliente (após venda) até a entrega final, incluindo um checklist detalhado de 58 itens de otimização do perfil Google Meu Negócio.

## 7.2 Estrutura de Dados (Client)

```typescript
interface Client {
  id: string;
  companyName: string;
  googleProfileUrl?: string;      // URL do perfil Google
  driveUrl?: string;              // Pasta no Drive
  whatsappGroupUrl?: string;      // Grupo de WhatsApp
  whatsappLink?: string;          // Link direto WhatsApp
  
  // Classificação
  planType: 'unique' | 'recurring'; // Tipo de plano
  isOwner: boolean;               // Se cliente é proprietário do perfil
  mainCategory?: string;          // Categoria do negócio
  keywords?: string[];            // Palavras-chave
  city?: string;                  // Cidade
  
  // Status
  status: 'on_track' | 'delayed' | 'pending_client';
  columnId: ColumnId;             // Coluna atual no Kanban
  photoMode?: 'with_photos' | 'without_photos' | 'pending';
  
  // Conteúdo
  checklist: ChecklistSection[];  // Checklist com 58 itens
  comparisons: Comparison[];      // Fotos antes/depois
  history: HistoryEntry[];        // Histórico de ações
  notes?: string;                 // Notas gerais
  briefing?: string;              // Briefing do cliente
  
  // Datas
  responsible: string;            // Responsável
  startDate: string;              // Data de início
  lastUpdate: string;             // Última atualização
  suspendedAt?: string;           // Data de suspensão
  
  // Anexos
  attachments?: string[];
  attachmentsCount?: number;
  profileImage?: string;
  coverConfig?: CoverConfig;
  labels?: ClientLabel[];
  usefulLinks?: UsefulLink[];
}
```

## 7.3 Colunas do Kanban (Delivery)

| Coluna | Emoji | Cor | Descrição |
|--------|-------|-----|-----------|
| `suspended` | ⏸️ | Vermelho | Clientes suspensos para resolver |
| `pipeline` | 🔍 | Laranja | Verificação / Para entrar na fila |
| `onboarding` | ▶️ | Azul | Iniciar execução |
| `optimization` | 🚀 | Âmbar | Em processo de otimização |
| `ready_to_deliver` | ⚠️ | Amarelo | Feitos, mas com pendência do cliente |
| `finalized` | ✅ | Verde | 100% concluído, pronto para entregar |
| `delivered` | 📦 | Verde escuro | Entregues (arquivo) |

## 7.4 Checklist de Execução (58 Itens em 5 Etapas)

### Etapa 1: Onboarding (4 itens)
1. Fechar venda e criar grupo de comunicação com cliente
2. Alterar foto do grupo para foto padrão da agência
3. Dar boas vindas no grupo e se deixar à disposição
4. Agendar reunião de briefing (até 48h)

### Etapa 2: Preparação (12 itens)
1. Criar ou obter conta de e-mail para o cliente
2. Criar pasta do cliente no armazenamento em nuvem
3. Configurar ferramentas de IA para o projeto
4. Registrar métricas ANTES da execução
5. Realizar briefing + pegar propriedade do Perfil
6. Criar documento de briefing/notas no card do cliente
7. Criar slogans para postagens e validar com cliente
8. Criar link de contato direto e adicionar no card
9. Inserir link de contato no perfil e ativar chat
10. Definir: tirar fotos ou solicitar ao cliente
11. Tirar fotos da empresa (se aplicável)
12. Solicitar fotos ao cliente (se cliente vai enviar)

### Etapa 3: Produção (7 itens)
1. Editar fotos da empresa
2. Salvar fotos editadas na pasta do cliente
3. Criar modelo de geolocalização para imagens
4. Criar designs de produtos
5. Criar designs de postagens
6. Criar arte de QR Codes
7. Buscar ou criar vídeos do cliente (mínimo 3)

### Etapa 4: Otimização (13 itens)
1. Atualizar informações principais do cliente no Perfil
2. Responder todas as avaliações usando palavras-chave
3. Pesquisar, definir e ajustar categorias
4. Subir fotos com palavras-chave e geolocalização
5. Subir fotos editadas e vídeos no Perfil
6. Criar e incluir serviços com palavras-chave
7. Subir produtos no Perfil
8. Criar e subir postagens no Perfil
9. Alterar nome com palavras-chave (validar com Admin)
10. Responder perguntas e respostas
11. Criar FAQs no perfil
12. Cadastrar empresa em diretórios
13. Criar perfis em redes sociais com nome otimizado

### Etapa 5: Entrega (9 itens)
1. Conferir materiais organizados na pasta do cliente
2. Registrar métricas DEPOIS da execução
3. Criar relatório de entrega comparando ANTES x DEPOIS
4. Verificar se cliente está como proprietário principal
5. Manter acesso como administrador do Perfil
6. Entregar com apresentação do resultado
7. Solicitar indicação de novos clientes
8. Oferecer plano de recorrência se cliente for estratégico
9. 💰 Pagar comissão da equipe

## 7.5 Telas e Funcionalidades

### 7.5.1 Dashboard de Otimização (`/dashboard` modo Otimização)

**Componentes exibidos:**
- `OptimizationDashboard`: KPIs de execução
- `GlobalProgressBar`: Barra de progresso geral do checklist
- `KanbanBoard`: Kanban com clientes por coluna

**Modos de visualização:**
- Kanban (padrão)
- Tabela
- Checklist
- Timeline
- Calendário
- Cards
- Visão Geral (Overview)
- Minhas Tarefas

### 7.5.2 Painel de Detalhes do Cliente (`ClientDetailPanel`)

Ao clicar em um card de cliente:

**Cabeçalho:**
- Nome da empresa
- Cidade e categoria
- Status (Em dia, Atrasado, Aguardando cliente)
- Barra de progresso do checklist
- Botões de ação rápida

**Abas disponíveis:**
1. **Checklist**: Todas as 5 etapas com itens
2. **Comparações**: Fotos antes/depois
3. **Histórico**: Log de todas as ações
4. **Configurações**: Dados do cliente, links, anexos

### 7.5.3 Tela de Execução (`ClientExecutionView`)

Modal de tela cheia para execução focada:

**Layout:**
- Header com nome, progresso e status
- Checklist expansível por etapa
- Timer de tarefa
- Campo de notas
- Galeria de anexos

**Funcionalidades:**
- Marcar itens como concluídos
- Adicionar anexo ao item
- Registrar tempo gasto
- Adicionar notas ao item

### 7.5.4 Criar Novo Cliente (`NewClientWizard`)

Wizard em 3 passos:

**Passo 1 - Dados básicos:**
- Nome da empresa*
- Responsável*
- Cidade
- Categoria principal
- Palavras-chave

**Passo 2 - Links:**
- URL do perfil Google
- WhatsApp
- Pasta no Drive
- Grupo de WhatsApp

**Passo 3 - Configurações:**
- Tipo de plano (Único ou Recorrência)
- Modo de fotos
- Data de início
- Notas iniciais

## 7.6 Status do Cliente

| Status | Cor | Descrição |
|--------|-----|-----------|
| `on_track` | Verde | Execução dentro do prazo |
| `delayed` | Vermelho | Atrasado (mais de X dias sem atualização) |
| `pending_client` | Amarelo | Aguardando resposta/ação do cliente |

## 7.7 Labels (Etiquetas)

Etiquetas coloridas customizáveis para organização visual:
- Urgente (vermelho)
- VIP (dourado)
- Novo (azul)
- Indicação (verde)
- Problema (laranja)
- Etc.

---

# 8. MÓDULO 3: GESTÃO DE RECORRÊNCIA

## 8.1 Visão Geral

O módulo de recorrência gerencia clientes com planos mensais, incluindo rotinas automatizadas, tarefas periódicas e monitoramento de compliance. Diferente do funil de otimização (projeto único), a recorrência envolve tarefas repetitivas ao longo do tempo.

## 8.2 Estrutura de Dados

### Recurring Client
```typescript
interface RecurringClient {
  id: string;
  client_id?: string;             // Referência ao cliente original
  company_name: string;
  responsible_name: string;
  responsible_user_id?: string;
  schedule_variant: 'A' | 'B' | 'C' | 'D'; // Variante de agenda
  monthly_value: number;          // Valor mensal
  start_date: string;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  timezone: string;
}
```

### Recurring Routine (Template)
```typescript
interface RecurringRoutine {
  id: string;
  title: string;                  // Ex: "Responder Avaliações"
  description?: string;
  frequency: 'weekly' | 'monthly';
  occurrences_per_period: number; // Quantas vezes por período
  rules_json?: object;            // Regras adicionais
  sort_order: number;
  active: boolean;
}
```

### Recurring Task (Instância)
```typescript
interface RecurringTask {
  id: string;
  recurring_client_id: string;
  routine_id: string;
  due_date: string;               // Data de vencimento
  status: 'pending' | 'completed';
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  notes?: string;
}
```

## 8.3 Rotinas Padrão

Rotinas pré-configuradas para clientes recorrentes:

1. **Responder Avaliações** (Semanal, 2x)
2. **Criar Postagem** (Semanal, 1x)
3. **Atualizar Fotos** (Mensal, 1x)
4. **Verificar Informações** (Mensal, 1x)
5. **Relatório de Performance** (Mensal, 1x)
6. **Monitorar Ranking** (Semanal, 1x)
7. **Responder Perguntas** (Semanal, 1x)

## 8.4 Variantes de Agenda (A/B/C/D)

Para distribuir a carga de trabalho ao longo do mês:
- **Variante A**: Semanas 1 e 3
- **Variante B**: Semanas 2 e 4
- **Variante C**: Segunda e quinta
- **Variante D**: Terça e sexta

## 8.5 Telas e Funcionalidades

### 8.5.1 Dashboard de Recorrência (`/dashboard` modo Recorrência)

**Componentes exibidos:**
- `RecurringOverview`: KPIs (clientes ativos, tarefas hoje, compliance)
- `RecurringExecutionView`: Lista de tarefas do dia/semana

**Modos de visualização:**
- Execução (padrão) - tarefas do dia
- Overview - visão geral de todos os clientes

### 8.5.2 Overview de Recorrência

**KPIs exibidos:**
- Total de clientes recorrentes ativos
- Receita mensal recorrente (MRR)
- Tarefas para hoje
- Tarefas atrasadas
- Taxa de compliance (%)

**Lista de clientes:**
- Card por cliente com:
  - Nome e responsável
  - Status (ativo/pausado)
  - Próxima tarefa pendente
  - Taxa de compliance
  - Valor mensal

### 8.5.3 Execução de Recorrência (`RecurringExecutionView`)

**Funcionalidades:**
- Lista de tarefas ordenadas por data
- Filtro por cliente, rotina, status
- Marcar tarefa como concluída
- Adicionar notas à tarefa
- Visualizar histórico de tarefas

### 8.5.4 Card do Cliente Recorrente (`ClientRecurringCard`)

Ao clicar em um cliente:
- Checklist de tarefas pendentes
- Histórico de tarefas concluídas
- Configurações (variante, valor, status)
- Relatório de IA da recorrência

### 8.5.5 Geração Automática de Tarefas

Edge Function `generate-recurring-tasks`:
- Executada manualmente ou via cron
- Gera tarefas para os próximos 14 dias
- Respeita a variante de agenda do cliente
- Considera a frequência de cada rotina
- Não duplica tarefas já existentes

## 8.6 Fluxo: Otimização → Recorrência

Quando um cliente de otimização é convertido para recorrência:

1. Botão "Fechou Recorrência" no painel do cliente
2. Modal de confirmação com campos:
   - Valor mensal
   - Variante de agenda
   - Data de início
3. Ao confirmar:
   - `clients.plan_type` = 'recurring'
   - Cria registro em `recurring_clients`
   - Gera primeiras tarefas
   - Cliente permanece disponível para consulta no Kanban de Otimização

## 8.7 Relatório de IA da Recorrência

Agente de IA (`RecurrenceReportAgent`) que analisa:
- Performance do cliente no período
- Taxa de conclusão de tarefas
- Sugestões de melhorias
- Alertas de atrasos ou problemas

---

# 9. MÓDULO 4: PROPOSTAS COMERCIAIS

## 9.1 Visão Geral

O módulo de propostas permite criar, enviar e rastrear propostas comerciais profissionais. Propostas podem ser geradas manualmente ou com auxílio de IA, e incluem rastreamento de visualizações para acompanhar o engajamento do cliente.

## 9.2 Estrutura de Dados

```typescript
interface Proposal {
  id: string;
  lead_id?: string;               // Proposta vinculada a lead
  client_id?: string;             // Ou a cliente existente
  
  // Dados do cliente
  title: string;
  client_name: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  city?: string;
  
  // Conteúdo
  blocks: ProposalBlock[];        // Blocos de conteúdo
  variables: Record<string, string>; // Variáveis dinâmicas
  
  // Valores
  full_price?: number;            // Valor cheio
  discounted_price?: number;      // Valor com desconto
  installments?: number;          // Número de parcelas
  installment_value?: number;     // Valor da parcela
  payment_method?: string;
  discount_reason?: string;
  
  // Validade
  valid_until?: string;
  
  // Status
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  
  // Rastreamento
  public_token?: string;          // Token único para link público
  public_url?: string;            // URL pública da proposta
  sent_at?: string;
  first_viewed_at?: string;
  last_viewed_at?: string;
  view_count: number;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  
  // IA
  ai_generated: boolean;
  ai_prompt?: string;
}
```

## 9.3 Blocos de Proposta

Cada proposta é composta por blocos editáveis:

| Tipo | Emoji | Descrição |
|------|-------|-----------|
| `diagnosis` | 📌 | Diagnóstico do problema |
| `objective` | 🎯 | Objetivo do projeto |
| `scope` | 🔧 | Escopo estratégico (com checklist) |
| `investment` | 💰 | Valores e condições |
| `timeline` | 📅 | Cronograma de execução |
| `guarantee` | 🛡️ | Garantias oferecidas |
| `custom` | ✏️ | Bloco personalizado |

## 9.4 Variáveis Dinâmicas

Variáveis que são substituídas automaticamente:
- `{{nome_empresa}}` - Nome da empresa
- `{{cidade}}` - Cidade
- `{{palavras_chave}}` - Palavras-chave
- `{{valor}}` - Valor do investimento
- `{{parcelas}}` - Número de parcelas
- `{{data}}` - Data atual

## 9.5 Telas e Funcionalidades

### 9.5.1 Lista de Propostas (`/propostas`)

**Funcionalidades:**
- Lista de todas as propostas
- Filtros por status, data, responsável
- Busca por nome do cliente
- Badge de visualizações
- Ações rápidas (editar, enviar, copiar link)

### 9.5.2 Editor de Proposta (`ProposalEditor`)

**Layout:**
- Preview lado a lado com editor
- Toolbar de ações (salvar, enviar, gerar PDF)
- Painel de configuração de valores

**Funcionalidades:**
- Adicionar/remover/reordenar blocos
- Editar conteúdo de cada bloco
- Configurar valores e condições de pagamento
- Visualizar preview em tempo real
- Gerar proposta com IA (a partir de prompt)

### 9.5.3 Prévia da Proposta (`ProposalPreview`)

**Exibição:**
- Cabeçalho com logo da agência
- Dados do cliente
- Blocos de conteúdo formatados
- Tabela de investimento
- Rodapé com validade e assinatura

**Ações:**
- Copiar link público
- Enviar por e-mail
- Baixar PDF
- Gerar contrato

### 9.5.4 Proposta Pública (`/proposta/:token`)

Página pública acessível pelo cliente (sem login):
- Visualização completa da proposta
- Rastreamento de visualização (registra view)
- Botões de aceitar/rejeitar
- Campo para motivo de rejeição

## 9.6 Fluxo de Status

```
draft → sent → viewed → accepted → (gera contrato)
                    ↘ rejected
                    ↘ expired
```

## 9.7 Geração com IA

Edge Function `generate-proposal`:
- Recebe: dados do lead/cliente, prompt do usuário
- Retorna: blocos de proposta gerados
- Modelo: Gemini ou GPT
- Contexto: histórico de atividades, categoria, cidade

---

# 10. MÓDULO 5: CONTRATOS DIGITAIS

## 10.1 Visão Geral

O módulo de contratos permite gerar, gerenciar e coletar assinaturas digitais de contratos comerciais. Contratos podem ser criados a partir de propostas aceitas ou do zero, com cláusulas customizáveis e variáveis dinâmicas.

## 10.2 Estrutura de Dados

```typescript
interface Contract {
  id: string;
  proposal_id?: string;           // Contrato gerado de proposta
  client_id?: string;
  lead_id?: string;
  
  // Metadados
  title: string;
  contract_type: 'single_optimization' | 'recurring' | 'custom';
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'cancelled';
  
  // Dados da Contratada (Agência)
  contractor_name?: string;
  contractor_cnpj?: string;
  contractor_address?: string;
  contractor_email?: string;
  contractor_phone?: string;
  contractor_responsible?: string;
  
  // Dados do Contratante (Cliente)
  contracted_name?: string;
  contracted_cnpj?: string;
  contracted_cpf?: string;
  contracted_address?: string;
  contracted_email?: string;
  contracted_phone?: string;
  contracted_responsible?: string;
  
  // Conteúdo
  clauses: ContractClause[];      // Cláusulas do contrato
  variables?: Record<string, string>;
  
  // Valores
  full_price?: number;
  discounted_price?: number;
  installments?: number;
  installment_value?: number;
  payment_method?: string;
  
  // Execução
  execution_term_days?: number;
  start_date?: string;
  end_date?: string;
  
  // Recorrência
  is_recurring?: boolean;
  billing_cycle?: string;
  auto_renewal?: boolean;
  
  // Rastreamento
  public_token?: string;
  public_url?: string;
  sent_at?: string;
  first_viewed_at?: string;
  last_viewed_at?: string;
  signed_at?: string;
  view_count?: number;
  
  // Assinatura
  client_signature_name?: string;
  client_signature_cpf?: string;
  client_signed_at?: string;
  client_ip_address?: string;
}
```

## 10.3 Tipos de Contrato

| Tipo | Emoji | Descrição |
|------|-------|-----------|
| `single_optimization` | 📍 | Otimização única (projeto) |
| `recurring` | 🔁 | Contrato de recorrência mensal |
| `custom` | ✍️ | Contrato personalizado |

## 10.4 Cláusulas Padrão

Cláusulas incluídas automaticamente:

1. **Identificação das Partes** (parties)
2. **Proteção de Dados - LGPD** (lgpd)
3. **Objeto do Contrato** (object)
4. **Escopo do Projeto** (scope)
5. **Prazo de Execução** (execution_term)
6. **Investimento e Forma de Pagamento** (investment)
7. **Responsabilidades da Contratada** (obligations_contractor)
8. **Responsabilidades do Contratante** (obligations_contracted)
9. **Limites de Responsabilidade** (liability_limits)
10. **Rescisão** (rescission)
11. **Foro e Validade** (forum)
12. **Assinaturas** (signatures)

Para contratos de recorrência, adiciona-se:
- **Termos de Recorrência** (recurring_terms)

## 10.5 Variáveis de Contrato

```typescript
const CONTRACT_VARIABLES = [
  { key: '{{nome_empresa}}', label: 'Nome da Empresa' },
  { key: '{{cnpj}}', label: 'CNPJ' },
  { key: '{{cpf}}', label: 'CPF do Responsável' },
  { key: '{{email}}', label: 'E-mail' },
  { key: '{{endereco}}', label: 'Endereço' },
  { key: '{{responsavel}}', label: 'Nome do Responsável' },
  { key: '{{telefone}}', label: 'Telefone' },
  { key: '{{data}}', label: 'Data Atual' },
  { key: '{{valor}}', label: 'Valor do Projeto' },
  { key: '{{valor_desconto}}', label: 'Valor com Desconto' },
  { key: '{{parcelas}}', label: 'Número de Parcelas' },
  { key: '{{valor_parcela}}', label: 'Valor da Parcela' },
  { key: '{{prazo_execucao}}', label: 'Prazo de Execução (dias)' },
  { key: '{{cidade}}', label: 'Cidade' },
  { key: '{{agencia_nome}}', label: 'Nome da Agência' },
  { key: '{{agencia_cnpj}}', label: 'CNPJ da Agência' },
];
```

## 10.6 Telas e Funcionalidades

### 10.6.1 Lista de Contratos (`/contratos`)

**Funcionalidades:**
- Lista de todos os contratos
- Filtros por status, tipo, data
- Badge de status
- Ações rápidas (editar, enviar, copiar link)

### 10.6.2 Editor de Contrato (`ContractEditor`)

**Layout:**
- Editor de cláusulas
- Preview lado a lado
- Painel de dados das partes
- Configuração de valores

**Funcionalidades:**
- Selecionar template (Otimização Única, Recorrência, Custom)
- Editar cada cláusula
- Adicionar cláusulas personalizadas
- Reordenar cláusulas
- Ocultar cláusulas não aplicáveis
- Preencher dados das partes
- Configurar valores e prazos

### 10.6.3 Preview do Contrato (`ContractPreview`)

**Exibição:**
- Cabeçalho formal
- Identificação das partes
- Cláusulas numeradas
- Espaço para assinaturas
- Rodapé com data e foro

### 10.6.4 Contrato Público (`/contrato/:token`)

Página pública para assinatura (sem login):
- Visualização completa do contrato
- Formulário de assinatura:
  - Nome completo*
  - CPF*
  - Checkbox de aceite
  - Canvas para assinatura digital
- Registro de IP e timestamp
- Confirmação de assinatura

## 10.7 Fluxo de Status

```
draft → sent → viewed → signed
                    ↘ expired
                    ↘ cancelled
```

## 10.8 Fluxo: Proposta → Contrato

1. Proposta é aceita pelo cliente
2. Botão "Gerar Contrato" na prévia da proposta
3. Sistema navega para `/contratos?proposalId=XXX`
4. Dados da proposta pré-preenchem o contrato:
   - Nome da empresa → contracted_name
   - E-mail → contracted_email
   - Telefone → contracted_phone
   - Valores → full_price, installments, etc.
5. Usuário revisa e envia para assinatura

---

# 11. MÓDULO 6: SISTEMA DE COMISSÕES

## 11.1 Visão Geral

O módulo de comissões gerencia o cálculo, aprovação e pagamento de comissões para a equipe. Suporta diferentes tipos de destinatários, gatilhos de comissão e fluxo de aprovação.

## 11.2 Estrutura de Dados

### Comissão
```typescript
interface Commission {
  id: string;
  client_id?: string;
  lead_id?: string;
  client_name: string;
  
  // Destinatário
  recipient_id?: string;
  recipient_name: string;
  recipient_type: 'sdr' | 'seller' | 'photographer' | 'operational' | 'designer' | 'freelancer';
  recipient_role_id?: string;
  
  // Valores
  description: string;
  amount: number;                 // Valor da comissão
  sale_value?: number;            // Valor da venda
  
  // Status
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  delivered_at?: string;
  approved_at?: string;
  paid_at?: string;
  
  // Notas
  notes?: string;
  created_by: string;
}
```

### Configuração de Comissão
```typescript
interface CommissionConfig {
  id: string;
  collaborator_name: string;
  collaborator_user_id?: string;
  
  // Tipo de comissão
  commission_type: 'fixed' | 'percentage';
  commission_model: 'per_sale' | 'per_delivery' | 'per_task';
  amount: number;                 // Valor fixo ou percentual
  
  // Gatilho
  trigger_event: 'sale_closed' | 'client_delivered' | 'monitoring_complete';
  
  // Status
  initial_status: 'pending' | 'approved';
  active: boolean;
}
```

### Papéis de Comissão
```typescript
interface CommissionRole {
  id: string;
  label: string;                  // Ex: "SDR", "Vendedor", "Fotógrafo"
  sort_order: number;
  active: boolean;
}
```

## 11.3 Tipos de Destinatário

| Tipo | Descrição |
|------|-----------|
| `sdr` | Sales Development Representative |
| `seller` | Vendedor |
| `photographer` | Fotógrafo |
| `operational` | Operador |
| `designer` | Designer |
| `freelancer` | Freelancer externo |

## 11.4 Status da Comissão

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando aprovação |
| `approved` | Aprovada, aguardando pagamento |
| `paid` | Paga |
| `cancelled` | Cancelada |

## 11.5 Telas e Funcionalidades

### 11.5.1 Dashboard de Comissões (`/commissions`)

**Abas disponíveis:**
1. **Pendentes**: Comissões aguardando aprovação
2. **Aprovadas**: Comissões aprovadas, aguardando pagamento
3. **Pagas**: Histórico de comissões pagas
4. **Configurações**: Regras de comissão por colaborador

### 11.5.2 KPIs de Comissão

- Total pendente (R$)
- Total aprovado (R$)
- Total pago no mês (R$)
- Projeção do mês (R$)

### 11.5.3 Card de Comissão (`CommissionCard`)

**Informações exibidas:**
- Nome do cliente
- Nome do destinatário (e papel)
- Valor da comissão
- Status com badge colorido
- Data de criação
- Botões de ação (aprovar, pagar, cancelar)

### 11.5.4 Painel de Configuração (`CommissionConfigPanel`)

**Funcionalidades:**
- Listar regras de comissão
- Criar nova regra
- Editar regra existente
- Ativar/desativar regra

**Campos da regra:**
- Colaborador (nome ou usuário)
- Tipo (fixo ou percentual)
- Valor
- Gatilho (venda fechada, cliente entregue, etc.)
- Status inicial (pendente ou aprovado automaticamente)

### 11.5.5 Timeline de Comissões (`CommissionTimeline`)

Visualização cronológica de comissões:
- Agrupadas por mês
- Mostram status e valores
- Filtro por destinatário

### 11.5.6 Projeção Financeira (`CommissionForecast`)

Baseado nas comissões pendentes e aprovadas:
- Total projetado para o mês
- Breakdown por destinatário
- Gráfico de evolução

### 11.5.7 Por Destinatário (`CommissionsByRecipient`)

Visão agrupada por pessoa:
- Total ganho no período
- Quantidade de comissões
- Média por comissão

## 11.6 Fluxo de Comissão

```
Evento (venda/entrega) 
    → Comissão gerada (status: pending ou approved)
    → Aprovação manual (se pending)
    → Pagamento registrado
    → status: paid
```

---

# 12. MÓDULO 7: AGENTES DE INTELIGÊNCIA ARTIFICIAL

## 12.1 Visão Geral

O sistema conta com vários agentes de IA especializados para análise, geração de conteúdo e assistência. Todos utilizam a infraestrutura Lovable AI com modelos Gemini e GPT.

## 12.2 Agentes Disponíveis

### 12.2.1 Lead Copilot

**Propósito**: Assistente de vendas para análise de leads

**Funcionalidades:**
- **Resumo do Lead**: Gera resumo automático das informações
- **Sugestões de Ação**: Sugere próximos passos baseado no histórico
- **Análise de Qualidade**: Avalia probabilidade de fechamento
- **Chat Contextual**: Conversa sobre o lead com contexto completo

**Acesso**: Aba "Copilot" no painel de detalhes do lead

**Edge Function**: `lead-copilot`

### 12.2.2 Agente Raio-X (`/raio-x`)

**Propósito**: Análise de chamadas de vendas

**Funcionalidades:**
- Transcrição de áudio (via Whisper)
- Identificação de objeções
- Sugestão de scripts de resposta
- Próximos passos recomendados
- O que evitar na próxima interação

**Inputs:**
- Link da gravação da chamada
- Contexto do lead (opcional)

**Edge Function**: `analyze-raiox`

### 12.2.3 Agente SEO (`/agente-seo`)

**Propósito**: Análise de perfis Google Meu Negócio

**Funcionalidades:**
- Diagnóstico de otimização do perfil
- Identificação de pontos de melhoria
- Sugestões de palavras-chave
- Análise de concorrentes locais
- Checklist de ações recomendadas

**Inputs:**
- URL do perfil Google
- Categoria do negócio
- Cidade
- Palavras-chave atuais

**Edge Function**: `analyze-seo`

### 12.2.4 Agente de Suspensões (`/agente-suspensoes`)

**Propósito**: Análise de perfis suspensos pelo Google

**Funcionalidades:**
- Identificação de motivos prováveis da suspensão
- Plano de recuperação detalhado
- Passos para recurso junto ao Google
- Previsão de tempo para resolução
- Prevenção de futuras suspensões

**Inputs:**
- URL do perfil suspenso
- Histórico do perfil
- Ações recentes realizadas

**Edge Function**: `analyze-suspensao`

### 12.2.5 Agente de Relatório de Recorrência

**Propósito**: Análise de performance de clientes recorrentes

**Funcionalidades:**
- Resumo do período
- Taxa de cumprimento de tarefas
- Melhorias observadas
- Sugestões para o próximo período
- Alertas de problemas

**Acesso**: Card do cliente recorrente → botão "Relatório IA"

**Edge Function**: `analyze-recurrence`

### 12.2.6 Gerador de Propostas com IA

**Propósito**: Geração automática de propostas comerciais

**Funcionalidades:**
- Gera blocos de proposta a partir de prompt
- Considera contexto do lead/cliente
- Personaliza linguagem para o segmento
- Sugere valores baseado em histórico

**Acesso**: Editor de proposta → botão "Gerar com IA"

**Edge Function**: `generate-proposal`

### 12.2.7 Gerador de Contrato com IA

**Propósito**: Geração de cláusulas contratuais

**Funcionalidades:**
- Sugere cláusulas adicionais
- Personaliza linguagem jurídica
- Adapta termos ao tipo de serviço

**Acesso**: Editor de contrato → botão "Sugerir Cláusulas"

**Edge Function**: `generate-contract`

### 12.2.8 Relatório Gerencial com IA

**Propósito**: Insights executivos automatizados

**Funcionalidades:**
- Análise de tendências
- Identificação de gargalos
- Sugestões de ação para gestores
- Previsões de faturamento

**Acesso**: Página de Relatório Gerencial

**Edge Function**: `generate-manager-report`

## 12.3 Modelos de IA Utilizados

| Modelo | Uso Principal |
|--------|---------------|
| `google/gemini-2.5-pro` | Análises complexas, geração de conteúdo longo |
| `google/gemini-2.5-flash` | Respostas rápidas, chat |
| `openai/gpt-5` | Alternativa para casos específicos |
| `openai/whisper` | Transcrição de áudio (via voice-to-text) |

---

# 13. MÓDULO 8: RELATÓRIO GERENCIAL

## 13.1 Visão Geral

O relatório gerencial (`/relatorio-gestor`) oferece uma visão executiva consolidada da operação da agência, com KPIs, rankings, tendências e insights de IA.

## 13.2 Componentes do Relatório

### 13.2.1 KPIs Executivos (`ExecutiveKPICard`)

Cards com métricas principais:
- Leads ativos / Leads ganhos / Taxa de conversão
- Clientes em execução / Entregues no período
- Receita prevista / Receita realizada
- Comissões pendentes / Comissões pagas

### 13.2.2 Visualização de Funil (`FunnelVisualization`)

Gráfico de funil mostrando:
- Quantidade de leads por estágio
- Taxa de conversão entre estágios
- Tempo médio em cada estágio

### 13.2.3 Ranking de Equipe (`RankingTable`)

Tabela de performance:
- Nome do colaborador
- Leads trabalhados
- Conversões
- Clientes entregues
- Receita gerada
- Comissões recebidas

### 13.2.4 Tabela de Tendências (`TrendComparisonTable`)

Comparação período a período:
- Métrica
- Período anterior
- Período atual
- Variação (%)
- Tendência (↑/↓/→)

### 13.2.5 Heatmap Semanal (`WeeklyHeatmap`)

Mapa de calor mostrando:
- Dias da semana vs. Horários
- Intensidade de atividade
- Identificação de picos

### 13.2.6 Score de Saúde (`HealthScoreGauge`)

Gauge/velocímetro mostrando:
- Score geral da agência (0-100)
- Composição do score:
  - Conversão de leads
  - Tempo de entrega
  - Satisfação (NPS)
  - Receita vs. meta

### 13.2.7 Projeção Financeira (`FinancialProjection`)

Gráfico de projeção:
- Receita realizada (linha sólida)
- Receita projetada (linha pontilhada)
- Meta do período (linha de referência)

### 13.2.8 Painel de Insights IA (`AIInsightsPanel`)

Insights gerados automaticamente:
- "A taxa de conversão caiu 15% esta semana"
- "João é o vendedor com maior performance"
- "3 clientes estão atrasados há mais de 7 dias"
- "Sugestão: focar em leads quentes do setor X"

### 13.2.9 Lista de Alertas (`AlertsList`)

Alertas críticos:
- Leads sem atividade há X dias
- Clientes atrasados
- Comissões pendentes há muito tempo
- Contratos prestes a vencer

## 13.3 Filtros Disponíveis

- Período (7 dias, 30 dias, 90 dias, ano, custom)
- Responsável
- Tipo de serviço
- Cidade/região

---

# 14. MÓDULO 9: ADMINISTRAÇÃO E EQUIPE

## 14.1 Visão Geral

O módulo de administração permite gerenciar usuários, permissões, configurações da agência e monitorar a saúde do sistema.

## 14.2 Telas Administrativas

### 14.2.1 Gestão de Usuários (`/admin`)

**Funcionalidades:**
- Listar todos os usuários da agência
- Criar novo usuário
- Editar role e permissões
- Resetar senha
- Suspender/reativar usuário
- Excluir usuário

**Informações por usuário:**
- Nome e e-mail
- Role (admin, operador, visualizador)
- Status (ativo, suspenso)
- Último login
- Permissões ativas

### 14.2.2 Gestão de Equipe (`/equipe`)

**Funcionalidades:**
- Visão de cards da equipe
- Convidar novo membro (via e-mail)
- Gerenciar convites pendentes
- Remover membro

**Componentes:**
- `TeamMemberCard`: Card de cada membro
- `InviteMemberDialog`: Modal de convite

### 14.2.3 Aceitar Convite (`/convite/:token`)

Página pública para aceitar convite:
- Exibe informações da agência
- Formulário de criação de conta
- Vincula usuário à agência automaticamente

### 14.2.4 Permissões da Agência (`/agency/settings/permissions`)

**Funcionalidades:**
- Definir permissões padrão por role
- Criar templates de permissão
- Aplicar template a usuários

### 14.2.5 Log de Auditoria (`/admin/audit`)

**Funcionalidades:**
- Histórico de todas as ações no sistema
- Filtros por usuário, ação, período
- Detalhes de cada ação (valores anteriores/novos)

**Ações registradas:**
- Login/logout
- CRUD de leads, clientes, propostas, contratos
- Alterações de permissão
- Movimentações no Kanban

### 14.2.6 Plano da Agência (`/admin/plan`)

**Informações:**
- Plano atual (Starter, Pro, Master)
- Limites de uso
- Uso atual vs. limite
- Botão para upgrade

### 14.2.7 Super Admin (`/super-admin`)

**Acesso**: Apenas super_admin

**Funcionalidades:**
- Listar todas as agências
- Criar nova agência
- Editar configurações de agência
- Alterar plano de agência
- Suspender/reativar agência
- Dashboard de uso global
- Ranking de engajamento por agência

### 14.2.8 Detalhes da Agência (`/admin/agencia/:id`)

**Acesso**: Super admin

**Informações:**
- Dados da agência
- Lista de membros
- Estatísticas de uso
- Histórico de planos

## 14.3 Sistema de Convites

Fluxo de convite de novos membros:

1. Admin vai em `/equipe`
2. Clica em "Convidar Membro"
3. Preenche: e-mail, nome, role
4. Sistema envia e-mail com link único
5. Convidado acessa `/convite/:token`
6. Cria senha e aceita
7. É adicionado à agência automaticamente

---

# 15. MÓDULO 10: FERRAMENTAS AUXILIARES

## 15.1 Central de Dúvidas (`/duvidas`)

**Propósito**: Esclarecer dúvidas sobre clientes

**Funcionalidades:**
- Criar pergunta vinculada a um cliente
- Listar perguntas pendentes
- Responder perguntas
- Marcar como resolvida
- Filtrar por status, cliente, responsável

**Fluxo:**
```
Operador tem dúvida → Cria pergunta → Admin responde → Operador resolve
```

**Status:**
- `pending`: Aguardando resposta
- `answered`: Respondida
- `resolved`: Resolvida/arquivada

## 15.2 Caixa de Sugestões (`/sugestoes`)

**Propósito**: Receber feedback e sugestões da equipe

**Funcionalidades:**
- Criar sugestão (título, descrição, nível alvo)
- Listar sugestões
- Marcar como lida
- Arquivar

**Níveis alvo:**
- Sistema
- Processo
- Equipe
- Gestão

## 15.3 Notificações (`/notifications`)

**Funcionalidades:**
- Listar notificações do usuário
- Marcar como lida
- Marcar todas como lidas
- Clicar para navegar ao item relacionado

**Tipos de notificação:**
- Lead próximo de esfriar
- Cliente sem atualização
- Comissão aprovada
- Contrato assinado
- Proposta visualizada
- Tarefa atrasada

## 15.4 Histórico (`/historico`)

**Funcionalidades:**
- Histórico de ações do usuário
- Filtro por tipo de ação
- Busca por texto

## 15.5 Meu Perfil (`/meu-perfil`)

**Funcionalidades:**
- Editar nome
- Alterar avatar
- Alterar senha
- Ver permissões atuais
- Ver histórico de login

## 15.6 Configurações de Segurança (`/settings/security`)

**Funcionalidades:**
- Alterar senha
- Ver sessões ativas
- Encerrar outras sessões
- Configurar 2FA (futuro)

---

# 16. NAVEGAÇÃO E INTERFACE

## 16.1 Sidebar (`AppSidebar`)

A sidebar é o elemento principal de navegação, organizada em seções:

### Seção: Principais
- **Vendas** (🎯): Toggle para modo Vendas
- **Otimização** (📋): Toggle para modo Otimização
- **Recorrência** (🔄): Toggle para modo Recorrência

### Seção: Comercial (colapsável)
- Propostas
- Contratos
- Comissões

### Seção: Ferramentas (colapsável)
- Dúvidas (com badge de pendentes)
- Sugestões
- Raio-X
- Agente SEO
- Agente Suspensões

### Seção: Gestão (colapsável)
- Equipe
- Relatório Gestor
- Administração (se admin)
- Super Admin (se super_admin)

### Rodapé
- Perfil do usuário
- Logout

## 16.2 Header do Dashboard (`DashboardHeader`)

**Elementos:**
- Logo da agência
- Barra de busca
- Seletor de modo de visualização
- Notificações (com badge)
- Perfil do usuário

## 16.3 Toggle de Funil (`FunnelToggle`)

Componente que alterna entre modos:
- 🎯 Vendas (cor: âmbar)
- 📋 Otimização (cor: verde/primária)
- 🔄 Recorrência (cor: violeta)

## 16.4 Modos de Visualização

**Modo Otimização:**
- Kanban
- Tabela
- Checklist
- Timeline
- Calendário
- Cards
- Overview
- Minhas Tarefas

**Modo Vendas:**
- Kanban (padrão)
- Overview

**Modo Recorrência:**
- Execução (padrão)
- Overview

## 16.5 Breadcrumbs

Navegação hierárquica em páginas internas:
```
Dashboard > Propostas > Nova Proposta
```

## 16.6 Back Navigation

Sistema inteligente de navegação de volta:
- Rastreia histórico interno
- Evita voltar para landing page quando logado
- Fallback para /dashboard

## 16.7 Responsividade Mobile

**Adaptações para mobile:**
- Sidebar transforma em drawer
- Botão hamburger no header
- Cards empilhados verticalmente
- Kanban com scroll horizontal
- Formulários em coluna única
- Botões de ação em FAB (floating action button)

---

# 17. PÁGINAS PÚBLICAS

## 17.1 Landing Page (`/`)

**Propósito**: Apresentação do produto para visitantes

**Seções:**
- Hero com headline e CTA
- Problema que resolvemos
- Funcionalidades principais
- Comparativo com concorrentes
- Depoimentos
- Planos e preços
- FAQ
- Footer com links

**Componentes:**
- `HeroVideo`
- `GlassmorphicCard`
- `ComparisonTable`
- `TestimonialCard`
- `AnimatedCounter`
- `FloatingParticles`

## 17.2 Landing Alcateia (`/alcateia`)

**Propósito**: Landing page para programa de parceiros Alcateia

## 17.3 Autenticação (`/auth`)

**Funcionalidades:**
- Login com e-mail e senha
- Link "Esqueci minha senha"
- Redirect após login

## 17.4 Registro (`/register`)

**Funcionalidades:**
- Criar nova agência
- Formulário: nome da agência, slug, nome do owner, e-mail, senha
- Validação de senha (mínimo 8 caracteres, letras e números)
- Auto-login após registro

## 17.5 Proposta Pública (`/proposta/:token`)

**Funcionalidades:**
- Visualização da proposta sem login
- Registro de visualização
- Botões de aceitar/rejeitar
- Responsivo para mobile

## 17.6 Contrato Público (`/contrato/:token`)

**Funcionalidades:**
- Visualização do contrato sem login
- Formulário de assinatura digital
- Canvas para assinatura manuscrita
- Registro de IP e timestamp
- Download do contrato assinado (futuro)

## 17.7 Página 404 (`/*`)

Página de erro para rotas não encontradas:
- Ilustração
- Mensagem amigável
- Botão para voltar ao início

---

# 18. REGRAS DE NEGÓCIO

## 18.1 Regras de Leads

1. **Lead frio vira morno**: Após 2 atividades registradas
2. **Lead morno vira quente**: Após reunião realizada ou proposta enviada
3. **Lead esfria**: Após 7 dias sem atividade, temperatura diminui
4. **Lead convertido**: Não pode ser editado, apenas visualizado
5. **Lead perdido**: Requer motivo de perda

## 18.2 Regras de Clientes

1. **Cliente suspenso**: Vai para coluna "Suspensos Resolver"
2. **Cliente atrasado**: Mais de 3 dias sem atualização no checklist
3. **Cliente finalizado**: Só pode ir para "Entregues" com 100% do checklist
4. **Cliente recorrente**: Não é deletado, muda plan_type

## 18.3 Regras de Propostas

1. **Proposta enviada**: Gera link público único
2. **Proposta visualizada**: Registra primeira e última visualização
3. **Proposta expirada**: Após data de validade (se definida)
4. **Proposta aceita**: Habilita geração de contrato

## 18.4 Regras de Contratos

1. **Contrato enviado**: Gera link público único
2. **Assinatura válida**: Requer nome, CPF e desenho da assinatura
3. **Contrato assinado**: Registra IP e timestamp
4. **Dados do cliente**: Vão para campos "contracted_*"
5. **Dados da agência**: Vão para campos "contractor_*"

## 18.5 Regras de Comissões

1. **Comissão gerada**: Status inicial conforme configuração
2. **Comissão aprovada**: Requer ação manual (ou automática se configurado)
3. **Comissão paga**: Registra data de pagamento
4. **Comissão cancelada**: Mantém histórico, não contabiliza

## 18.6 Regras de Recorrência

1. **Tarefas geradas**: Para 14 dias à frente
2. **Tarefa atrasada**: Após due_date
3. **Compliance**: (tarefas concluídas / tarefas totais) × 100
4. **Cliente pausado**: Não gera novas tarefas
5. **Cliente cancelado**: Não gera novas tarefas, mantém histórico

## 18.7 Regras de Permissões

1. **Super Admin**: Acesso total a todas as agências
2. **Owner**: Acesso total à própria agência
3. **Admin**: Acesso total à própria agência
4. **Operador**: Acesso conforme permissões granulares
5. **Visualizador**: Apenas leitura

## 18.8 Regras de Multi-Tenancy

1. **Dados isolados**: RLS garante que usuário só vê dados da sua agência
2. **agency_id automático**: Triggers preenchem automaticamente
3. **Troca de agência**: Usuário pode pertencer a múltiplas agências
4. **current_agency_id**: Define qual agência está ativa

---

# 19. DESIGN SYSTEM

## 19.1 Paleta de Cores

### Modo Escuro (Padrão)

```css
/* Fundos */
--background: 220 15% 8%;        /* Fundo principal */
--card: 220 14% 18%;             /* Cards */
--muted: 220 15% 18%;            /* Elementos secundários */

/* Texto */
--foreground: 0 0% 100%;         /* Texto principal */
--muted-foreground: 220 10% 50%; /* Texto secundário */

/* Primária (Verde Neon) */
--primary: 142 100% 50%;         /* Ações principais */
--primary-foreground: 0 0% 0%;   /* Texto sobre primária */

/* Status */
--status-success: 142 76% 45%;   /* Sucesso */
--status-warning: 45 93% 47%;    /* Alerta */
--status-danger: 0 72% 51%;      /* Erro */
--status-info: 217 91% 60%;      /* Info */

/* Colunas Kanban */
--column-suspended: 0 72% 51%;   /* Vermelho */
--column-pipeline: 25 95% 53%;   /* Laranja */
--column-onboarding: 217 91% 60%;/* Azul */
--column-optimization: 32 95% 50%;/* Âmbar */
--column-delivered: 142 100% 50%; /* Verde */
```

### Cores por Modo de Funil

- **Vendas**: Âmbar (#FFC107) / Laranja
- **Otimização**: Verde Neon (#00FCA8) / Primária
- **Recorrência**: Violeta (#8B5CF6) / Roxo

## 19.2 Tipografia

- **Fonte Principal**: Inter (300-700)
- **Fonte Mono**: JetBrains Mono (para código e números)

## 19.3 Efeitos Visuais

### Glassmorphism
```css
.glass {
  backdrop-filter: blur(16px);
  background: hsl(var(--glass-bg) / 0.8);
  border: 1px solid hsl(var(--glass-border) / 0.2);
}
```

### Neon Glow
```css
.neon-glow {
  box-shadow: 0 0 20px hsl(142 100% 50% / 0.5);
}
```

### Hover Effects
```css
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}
```

## 19.4 Componentes Base (Shadcn/UI)

Componentes utilizados do Shadcn/UI:
- Button (variantes: default, outline, ghost, destructive)
- Card
- Dialog / Sheet / Drawer
- Dropdown Menu / Select
- Badge
- Toast (Sonner)
- Tooltip
- Tabs
- Accordion / Collapsible
- Table
- Form (react-hook-form + zod)
- Input / Textarea
- Checkbox / Switch
- Progress
- Avatar
- Calendar

## 19.5 Animações

Biblioteca: Framer Motion

Animações padrão:
- `fade-in`: Entrada com fade
- `fade-in-up`: Entrada com fade de baixo para cima
- `scale-in`: Entrada com scale
- `slide-in-right`: Entrada deslizando da direita

Transições padrão:
```typescript
transition={{ duration: 0.3, ease: "easeOut" }}
```

---

# CONCLUSÃO

O GBRank CRM é uma plataforma completa e especializada que atende todas as necessidades operacionais de agências de Google Meu Negócio. Com sua arquitetura multi-tenant, sistema robusto de permissões, integração com IA e design moderno, oferece uma solução única no mercado para profissionalização e escala de operações de marketing local.

Este documento serve como referência técnica e funcional completa do sistema, abrangendo todas as funcionalidades, telas, regras de negócio e arquitetura existentes no projeto.

---

*Documento gerado em Janeiro de 2025 - GBRank CRM v1.0*
