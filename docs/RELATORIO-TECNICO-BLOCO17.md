# 📘 RELATÓRIO TÉCNICO E FUNCIONAL COMPLETO
## GBRank CRM — Sistema Multi-Tenant para Agências de Google Meu Negócio

> **Versão:** Bloco 17 (RBAC Completo)  
> **Data:** Dezembro 2024  
> **Objetivo:** Documentar 100% da estrutura, lógica e fluxos do sistema para treinar IA

---

## 📋 RESUMO GERAL

O **GBRank CRM** é um SaaS multi-tenant desenvolvido em React + TypeScript + Supabase, voltado para **agências que gerenciam perfis do Google Meu Negócio**. O sistema oferece:

- 🎯 **Funil de Vendas (Leads)** — Pipeline comercial completo com Kanban
- 📋 **Funil de Otimização (Clientes)** — Gestão operacional com checklists
- 🔄 **Funil de Recorrência** — Tarefas periódicas automatizadas
- 👥 **Gestão Multi-Agência** — Sistema multi-tenant com isolamento por agência
- 🔐 **RBAC Completo** — Controle granular de permissões
- 💰 **Comissões** — Gestão financeira de comissões da equipe
- 📊 **Relatórios Executivos** — Business Intelligence integrado

### Tecnologias Utilizadas
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Estado:** Zustand, TanStack Query
- **Gráficos:** Recharts
- **Animações:** Framer Motion

---

## 🔐 SISTEMA DE PERMISSÕES (RBAC)

### Roles Disponíveis
| Role | Descrição | Escopo |
|------|-----------|--------|
| `super_admin` | Acesso total a todas as agências | Global |
| `owner` | Dono da agência, todas as permissões | Agência |
| `admin` | Administrador da agência | Agência |
| `manager` | Gerente com acesso a relatórios | Agência |
| `sales_rep` | Vendedor, acesso ao funil de vendas | Agência |
| `operador` | Operador, acesso ao funil operacional | Agência |
| `support` | Suporte, acesso limitado | Agência |
| `visualizador` | Apenas visualização | Agência |

### Permissões Granulares (tabela `user_permissions`)
| Permissão | Descrição |
|-----------|-----------|
| `can_sales` | Acesso ao módulo de vendas |
| `can_ops` | Acesso ao módulo operacional |
| `can_admin` | Permissões administrativas |
| `can_finance` | Acesso a dados financeiros |
| `can_recurring` | Acesso à recorrência |
| `is_super_admin` | Flag de super admin |
| `can_view_reports` | Visualizar relatórios |
| `can_edit_clients` | Editar clientes |
| `can_delete_clients` | Excluir clientes |
| `can_view_leads` | Visualizar leads |
| `can_edit_leads` | Editar leads |
| `can_delete_leads` | Excluir leads |
| `can_manage_team` | Gerenciar equipe |
| `can_manage_commissions` | Gerenciar comissões |
| `can_view_audit_logs` | Ver logs de auditoria |
| `can_export_data` | Exportar dados |
| `can_manage_settings` | Gerenciar configurações |

### Funções SQL de Permissão
- `get_user_permissions(user_id, agency_id)` → Retorna JSON com todas as permissões
- `is_allowed(user_id, agency_id, permission)` → Valida se usuário pode executar ação
- `update_member_role(target_user_id, new_role, agency_id)` → Atualiza role de membro
- `my_role()` → Retorna role do usuário atual
- `has_role(user_id, role)` → Verifica se usuário tem determinado role

---

## 📄 DETALHAMENTO POR PÁGINA

---

## **1. Página: `/auth` (Login)**

**Tipo:** Pública

### Descrição
Tela de autenticação com login e cadastro básico.

### Botões
| Botão | Ação | Visível para |
|-------|------|--------------|
| Entrar | Faz login com email/senha | Todos |
| Criar Conta | Alterna para modo signup | Todos |
| Já tem conta? / Não tem conta? | Alterna entre modos | Todos |

### Inputs
- Email (validação: formato email)
- Senha (validação: mínimo 6 caracteres)

### Fluxo
```
1. Usuário insere email e senha
2. Validação com Zod
3. supabase.auth.signInWithPassword() ou signUp()
4. Se sucesso → navega para /dashboard
5. Se erro → exibe toast com mensagem
6. Registra evento de login em login_events
```

### Chamadas de API
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signUp()`
- `supabase.rpc('log_login_event')` — registra tentativa

### Permissões
Nenhuma requerida (página pública)

---

## **2. Página: `/register` (Cadastro de Agência)**

**Tipo:** Pública

### Descrição
Formulário para solicitar cadastro de nova agência no sistema.

### Botões
| Botão | Ação |
|-------|------|
| Solicitar Cadastro | Envia solicitação |
| Ir para Login | Navega para /auth |

### Inputs
- Nome da Agência* (gera slug automaticamente)
- Nome do Responsável*
- Email*
- WhatsApp (opcional)

### Fluxo
```
1. Usuário preenche dados
2. Gera slug: nome.toLowerCase().normalize().replace(/[^a-z0-9]/g, '-')
3. INSERT em pending_registrations (status='pending')
4. Exibe tela de confirmação
5. Super Admin aprova via /super-admin
```

### Chamadas de API
- `supabase.from('pending_registrations').insert()`

### Permissões
Nenhuma (público)

---

## **3. Página: `/dashboard` (Dashboard Principal)**

**Tipo:** Privada (autenticado)

### Descrição
Hub central do sistema com 3 modos de visualização (funis).

### Modos de Visualização
| Modo | Cor Tema | Descrição | Permissão |
|------|----------|-----------|-----------|
| Vendas | Âmbar | Pipeline comercial de leads | `can_sales` |
| Otimização | Verde | Gestão operacional de clientes | `can_ops` |
| Recorrência | Violeta | Tarefas periódicas | `can_recurring` |

### Botões Globais
| Botão | Ação | Localização |
|-------|------|-------------|
| Toggle Funil | Alterna entre modos | Header |
| Menu Mobile | Abre sidebar | Header mobile |
| Lixeira | Restaurar clientes deletados | Flutuante |
| Comando de Voz | Captura comando por voz | Flutuante |

### Componentes por Modo

#### **Modo VENDAS (isSalesMode)**

**Visualizações:**
- Kanban (padrão) — `LeadsKanban`
- Visão Geral — `SalesOverview`

**Botões:**
| Botão | Ação | Permissão |
|-------|------|-----------|
| + Novo Lead | Abre `NewLeadDialog` | `can_sales` |
| Raio-X (Ferramentas) | Abre modal de análise IA | `can_sales` |

**Interações Kanban:**
- Arrastar lead entre colunas → `moveLead(leadId, newStage)`
- Clicar no lead → Abre `LeadDetailPanel`

**Etapas do Pipeline:**
```
Cold → Contacted → Qualified → Meeting Scheduled → 
Meeting Done → Proposal Sent → Negotiating → Gained/Lost/Future
```

**Stats Sidebar:**
- Leads abertos (total open)
- Leads quentes (temperature='hot')
- Leads atrasados (next_action_date < today)
- Follow-ups de hoje

#### **Modo OTIMIZAÇÃO (isDeliveryMode)**

**Visualizações:**
- Overview — `ManagerOverview` (visão gerencial)
- Kanban — `KanbanBoard` (clientes por coluna)
- Execução — `UnifiedTasksView` (tarefas)
- Tabela — `ProgressTable`
- Timeline — `TimelineView`
- Calendário — `CalendarView`
- Cards — `CardsView`

**Botões:**
| Botão | Ação | Permissão |
|-------|------|-----------|
| + Novo Cliente | Abre `NewClientWizard` | `can_ops` |
| Agente SEO | Modal análise SEO | `can_ops` |
| Agente Suspensões | Modal análise suspensões | `can_ops` |

**Interações Kanban:**
- Arrastar cliente entre colunas
- Clicar no cliente → Abre painel de execução

**Colunas Operacionais:**
```
Pipeline → Onboarding → Optimization → Ready to Deliver → 
Delivered → Suspended → Finalized
```

**Stats Sidebar:**
- Clientes ativos
- Prontos para entregar
- Clientes parados (>3 dias sem update)
- Progresso médio %

#### **Modo RECORRÊNCIA (isRecurringMode)**

**Visualizações:**
- Execução — `RecurringExecutionView`
- Overview — `RecurringOverview`

**Botões:**
| Botão | Ação | Permissão |
|-------|------|-----------|
| Agente Relatórios | Modal de análise IA | `can_recurring` |

**Stats Sidebar:**
- Tarefas de hoje
- Tarefas atrasadas
- Taxa de compliance %
- Clientes ativos

### Hooks Utilizados
- `useClientStore()` — estado global de clientes
- `useLeads()` — CRUD de leads
- `useRecurring()` — dados de recorrência
- `useFunnelMode()` — modo atual do funil
- `useAuth()` — dados do usuário

### Lógica Condicional de Acesso
```typescript
const canAccessSales = derived?.canSalesOrAdmin ?? isAdmin;
const canAccessOps = derived?.canOpsOrAdmin ?? isAdmin;
const canAccessRecurring = derived?.canRecurringOrAdmin ?? isAdmin;
```

Se usuário não tem permissão para o modo atual, exibe mensagem "Acesso Restrito".

---

## **4. Página: `/equipe` (Gestão de Equipe)**

**Tipo:** Privada

### Descrição
Gerenciamento de membros da agência.

### Tabs
1. **Membros** — Lista de membros atuais
2. **Convites pendentes** — Convites aguardando aceitação (só para canManageTeam)

### Botões
| Botão | Ação | Visível para | Permissão |
|-------|------|--------------|-----------|
| + Adicionar Membro | Adiciona usuário existente | Admins | `canManageTeam` |
| Convidar por Email | Envia convite por email | Admins | `canManageTeam` |
| Alterar Função | Dropdown para mudar role | Owners | `canAssignRoles` |
| Remover | Remove membro da agência | Admins | `canManageTeam` |
| Cancelar Convite | Cancela convite pendente | Admins | `canManageTeam` |

### Inputs
- Busca por nome
- Filtro por função (role)

### Fluxo de Convite
```
1. Admin clica "Convidar por Email"
2. Preenche email e seleciona role
3. Sistema cria agency_invite (token único, expires_at +7 dias)
4. Convite aparece na aba "Convites pendentes"
5. Convidado acessa /convite/:token
```

### Chamadas de API
- `supabase.rpc('assign_role')` — atribuir role
- `supabase.from('agency_members').delete()` — remover
- `supabase.from('agency_invites').insert()` — criar convite

### Permissões
- Visualizar página: `canAdminOrIsAdmin`
- Gerenciar membros: `canManageTeam` (owner/admin)
- Atribuir roles: `canAssignRoles` (owner apenas)

---

## **5. Página: `/convite/:token` (Aceitar Convite)**

**Tipo:** Pública (com token)

### Descrição
Permite aceitar convite para entrar em uma agência.

### Estados do Convite
| Status | Comportamento |
|--------|---------------|
| `pending` | Exibe formulário de aceitação |
| `accepted` | Mensagem "já utilizado" |
| `expired` | Mensagem "expirado" |
| Token inválido | Mensagem "não encontrado" |

### Tabs (se não logado)
1. **Criar conta** — Signup com dados do convite
2. **Já tenho conta** — Login

### Botões
| Botão | Ação |
|-------|------|
| Criar conta e aceitar | Signup + aceita convite |
| Entrar e aceitar | Login + aceita convite |
| Aceitar convite | Para usuários já logados |
| Ir para login | Redireciona |

### Inputs
- Nome completo (signup)
- Email (preenchido do convite, readonly no signup)
- Senha (validação: 8+ chars, 1 número, 1 símbolo)

### Fluxo (usuário não logado)
```
1. Acessa /convite/:token
2. Verifica token válido e não expirado
3. Exibe info: agência, role, quem convidou
4. Usuário escolhe criar conta ou login
5. Após autenticação, aceita convite automaticamente
```

### Fluxo de Aceitação
```
1. Atualiza agency_invite (status='accepted', accepted_at, accepted_by)
2. Cria agency_member (agency_id, user_id, role)
3. Cria user_role (user_id, role)
4. Cria user_permissions (baseado no template do role)
5. Atualiza profile.current_agency_id
6. Redireciona para /dashboard
```

### Chamadas de API
- `useInviteAcceptance(token)` — hook customizado
- `acceptInvite.mutateAsync()` — aceita convite
- `supabase.auth.signUp()` — cria conta
- `supabase.auth.signInWithPassword()` — login

---

## **6. Página: `/admin` (Painel Admin)**

**Tipo:** Privada

### Descrição
Gestão de usuários da agência.

### Botões
| Botão | Ação | Permissão |
|-------|------|-----------|
| + Novo Usuário | Abre dialog de criação | `canAdminOrIsAdmin` |
| Alterar Role | Select dropdown | `canAdminOrIsAdmin` |
| Resetar Senha | Abre dialog de reset | `canAdminOrIsAdmin` |
| Gerar Senha | Gera senha aleatória forte | `canAdminOrIsAdmin` |
| Copiar Senha | Copia para clipboard | `canAdminOrIsAdmin` |
| Excluir | Soft delete (status=excluido) | `canAdminOrIsAdmin` |
| Copiar Link Login | Copia URL de /auth | `canAdminOrIsAdmin` |

### Inputs
- Busca por nome/email
- Nome completo (novo usuário)
- Email (novo usuário)
- Senha (novo usuário, validação forte)
- Role (select)

### Toggles de Permissão por Usuário
- 🎯 Vendas (`can_sales`)
- ⚙️ Operações (`can_ops`)
- 💰 Financeiro (`can_finance`)
- 🔄 Recorrência (`can_recurring`)
- 🛡️ Admin (`can_admin`)

### Fluxo Criar Usuário
```
1. Admin clica "+ Novo Usuário"
2. Preenche: nome, email, senha, role
3. Valida campos (Zod)
4. Chama edge function create-user
5. Edge function:
   - Cria auth.users
   - Cria profile
   - Cria user_role
   - Cria user_permissions (baseado no role)
   - Cria agency_member
6. Exibe toast de sucesso
```

### Fluxo Reset Senha
```
1. Admin clica "Resetar Senha" no usuário
2. Opção 1: Gerar automática (botão "Gerar Senha")
3. Opção 2: Digitar manual (inputs)
4. Chama edge function reset-user-password
5. Edge function atualiza auth.users
6. Exibe senha gerada para copiar
```

### Edge Functions
- `create-user` — Cria usuário completo
- `reset-user-password` — Reseta senha

### Permissões
`canAdminOrIsAdmin` (can_admin || role === 'admin')

---

## **7. Página: `/super-admin` (Super Admin)**

**Tipo:** Privada (Super Admin)

### Descrição
Controle global de todas as agências da plataforma.

### Verificação de Acesso
```typescript
const { data } = await supabase
  .from("user_permissions")
  .select("is_super_admin")
  .eq("user_id", user.id)
  .single();

if (!data?.is_super_admin) navigate("/dashboard");
```

### Stats Cards
| Card | Descrição |
|------|-----------|
| Agências | Total de agências |
| Solicitações | Pendentes de aprovação |
| Ativas | Agências ativas |
| Suspensas | Agências suspensas |
| Usuários | Total global |
| Clientes | Total global |
| Leads | Total global |

### Tabs
1. **Solicitações** — Aprovação de novas agências
2. **Agências** — Lista completa
3. **Logs de Auditoria** — Ações de super admin

### Botões - Aba Solicitações
| Botão | Ação |
|-------|------|
| Aprovar | Abre dialog de aprovação |
| Rejeitar | Abre dialog de rejeição |

### Botões - Aba Agências
| Botão | Ação |
|-------|------|
| + Criar Agência | Abre `CreateAgencyModal` |
| Editar | Navega para `/admin/agencia/:id` |
| Suspender | Muda status para "suspended" |
| Reativar | Muda status para "active" |
| Entrar como | Impersonate (muda current_agency_id) |

### Fluxo Aprovar Solicitação
```
1. Super Admin clica "Aprovar"
2. Opção de definir senha ou gerar automática
3. Chama edge function create-agency-owner:
   - Cria registro em agencies
   - Cria auth.users para owner
   - Cria profile
   - Cria user_role (owner)
   - Cria user_permissions (todas true)
   - Cria agency_member
   - Cria agency_limits (padrões)
   - Cria agency_usage (zerado)
   - Atualiza pending_registration (status='approved')
   - Registra em super_admin_actions
4. Exibe credenciais para copiar
```

### Fluxo Impersonate
```
1. Super Admin clica "Entrar como" em uma agência
2. Atualiza profile.current_agency_id para a agência alvo
3. Exibe banner "Você está acessando como [Agência]"
4. Super Admin vê o sistema como owner daquela agência
5. Clica "Sair" no banner para voltar
```

### Edge Functions
- `create-agency-owner` — Cria agência com owner

### Chamadas de API
- `useSuperAdmin()` — hook principal
- `usePendingRegistrations()` — solicitações
- `approveRegistration()` — aprova
- `rejectRegistration()` — rejeita
- `impersonateAgency()` — impersonate
- `suspendAgency()` — suspende
- `reactivateAgency()` — reativa

---

## **8. Página: `/admin/agencia/:id` (Detalhes da Agência)**

**Tipo:** Privada (Super Admin)

### Descrição
Edição detalhada de uma agência específica.

### Informações Exibidas
- Nome da agência
- Slug
- Status (badge colorido)
- Data de criação
- Última atualização

### Inputs Editáveis
| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome | text | Obrigatório |
| Slug | text | Lowercase, sem espaços |
| Status | select | active/suspended/pending |
| Máx. Usuários | number | ≥1 |
| Máx. Clientes | number | ≥0 |
| Máx. Leads | number | ≥0 |
| Máx. Recorrentes | number | ≥0 |
| Storage (MB) | number | ≥0 |

### Barras de Uso
- Usuários: current_users / max_users
- Clientes: current_clients / max_clients
- Leads: current_leads / max_leads
- Recorrentes: current_recurring_clients / max_recurring_clients
- Storage: storage_used_mb / storage_mb

### Botões
| Botão | Ação |
|-------|------|
| Voltar | Navega para /super-admin |
| Salvar | Salva alterações |

### Chamadas de API
- `supabase.rpc('get_agency_details', { _agency_id })` — busca dados
- `supabase.rpc('update_agency', { ... })` — salva

---

## **9. Página: `/admin/permissions` (Templates de Permissões)**

**Tipo:** Privada (Super Admin)

### Descrição
Gerenciamento global de templates de permissões por role.

### Lista de Roles
Cada role exibe card com:
- Nome do role
- Descrição
- Toggles para cada permissão

### Toggles por Role
| Permissão | Descrição |
|-----------|-----------|
| can_sales | Vendas |
| can_ops | Operações |
| can_admin | Administração |
| can_finance | Financeiro |
| can_recurring | Recorrência |
| can_view_reports | Ver Relatórios |
| can_edit_clients | Editar Clientes |
| can_delete_clients | Excluir Clientes |
| can_view_leads | Ver Leads |
| can_edit_leads | Editar Leads |
| can_delete_leads | Excluir Leads |
| can_manage_team | Gerenciar Equipe |
| can_manage_commissions | Gerenciar Comissões |
| can_view_audit_logs | Ver Logs |
| can_export_data | Exportar Dados |
| can_manage_settings | Gerenciar Config |

### Fluxo
```
1. Super Admin acessa página
2. Vê lista de roles com permissões atuais
3. Altera toggle de permissão
4. Chama supabase.rpc('update_role_template')
5. Novos usuários com esse role terão permissões atualizadas
```

### Chamadas de API
- `supabase.from('role_permission_templates').select()`
- `supabase.rpc('update_role_template', { _role, _permissions })`

---

## **10. Página: `/agency/settings/permissions` (Permissões da Agência)**

**Tipo:** Privada (Owner/Admin)

### Descrição
Gerenciar permissões dos membros da própria agência.

### Lista de Membros
Cada membro exibe:
- Avatar
- Nome
- Email
- Role atual (badge)
- Dropdown para alterar role

### Botões
| Botão | Ação | Permissão |
|-------|------|-----------|
| Alterar Função | Dropdown select | Owner/Admin |

### Lógica de Hierarquia
- Owner pode alterar qualquer um
- Admin pode alterar roles abaixo de admin
- Não pode alterar próprio role
- Não pode alterar owner

### Chamadas de API
- `usePermissions()` — hook principal
- `updateMemberRole.mutate({ targetUserId, newRole })`

---

## **11. Página: `/commissions` (Comissões)**

**Tipo:** Privada

### Descrição
Gestão de comissões da equipe. View diferente para admin vs colaborador.

### Views
| Role | View | Descrição |
|------|------|-----------|
| Admin/Finance | AdminCommissionView | Dashboard completo |
| Outros | CollaboratorCommissionView | Apenas próprias comissões |

### KPI Cards (Admin)
- Total Gerado
- Pendentes
- Aprovadas
- Pagas

### Tabs (Admin)
1. **Comissões** — Lista e gestão
2. **Configurações** — Config de comissões automáticas

### Botões (Admin)
| Botão | Ação | Permissão |
|-------|------|-----------|
| + Nova Comissão | Modal de registro manual | `canFinanceOrAdmin` |
| Aprovar | Muda status para "approved" | `canFinanceOrAdmin` |
| Marcar como Pago | Muda status para "paid" | `canFinanceOrAdmin` |
| Cancelar | Muda status para "cancelled" | `canFinanceOrAdmin` |

### Inputs (Nova Comissão)
- Cliente (select)
- Valor da Venda
- Função (select de commission_roles)
- Nome do destinatário
- Descrição
- Valor da Comissão
- Observações

### Filtros
- Status: all/pending/approved/paid/cancelled
- Período: all/week/month

### Automatização
Quando lead move para "gained":
```typescript
if (newStage === 'gained' && previousStage !== 'gained') {
  const commissionAmount = saleValue * 0.10; // 10%
  await createAutoCommission({
    leadId, clientName: lead.company_name,
    saleValue, recipientName: lead.responsible,
    recipientRoleLabel: 'Vendedor',
    amount: commissionAmount,
    description: `Venda ${lead.company_name}`,
    userId: user.id,
  });
}
```

### Chamadas de API
- `useCommissions()` — hook principal
- `approveCommission(id)` — aprovar
- `markAsPaid(id)` — marcar pago
- `cancelCommission(id)` — cancelar

---

## **12. Página: `/admin/audit` (Logs de Auditoria)**

**Tipo:** Privada (Admin)

### Descrição
Histórico de ações realizadas na agência.

### Tabela de Logs
| Coluna | Descrição |
|--------|-----------|
| Data/Hora | Timestamp formatado |
| Usuário | Quem executou |
| Ação | create/update/delete/etc |
| Entidade | leads/clients/etc |
| Nome | Nome do registro afetado |
| Visualizar | Abre modal de detalhes |

### Filtros
- Busca por usuário/entidade
- Filtro por ação
- Filtro por tipo de entidade

### Botões
| Botão | Ação |
|-------|------|
| Atualizar | Refetch da lista |
| Exportar CSV | Download dos logs |
| 👁️ Visualizar | Modal com old_value/new_value |

### Modal de Detalhes
- Data/Hora completa
- Usuário
- Ação (badge)
- Entidade
- Nome da Entidade
- Valor Anterior (JSON)
- Novo Valor (JSON)
- Metadados (JSON)

### Triggers Automáticos
Logs criados via triggers em:
- `leads` (INSERT/UPDATE/DELETE)
- `clients_v2` (INSERT/UPDATE/DELETE)
- `agency_invites` (INSERT/UPDATE/DELETE)
- `user_roles` (INSERT/UPDATE/DELETE)
- `commissions_v2` (INSERT/UPDATE/DELETE)

### Chamadas de API
- `supabase.from('audit_log').select()`

---

## **13. Página: `/relatorio-gestor` (Relatório do Gestor)**

**Tipo:** Privada (Admin)

### Descrição
Business Intelligence completo para gestores.

### Seletor de Período
- Hoje
- 7 dias
- 30 dias
- Este mês
- Personalizado (date picker)

### Tabs
1. **Executivo** — KPIs consolidados
2. **Operacional** — Funil de clientes
3. **Comercial** — Funil de leads
4. **Financeiro** — Comissões
5. **Recorrência** — Compliance
6. **Alertas** — Riscos

### KPIs Executivos
- Health Score Operacional (gauge)
- Health Score Comercial (gauge)
- Total Clientes
- Leads Criados/Ganhos/Perdidos
- Taxa de Conversão
- MRR (Monthly Recurring Revenue)

### Gráficos
- Funil operacional (pie chart)
- Funil comercial (bar chart)
- Timeline de atividades (area chart)
- Heatmap semanal (activity by day)
- Comissões por role (pie)
- Tendências (line chart)

### Alertas
- Clientes parados >X dias
- Leads quentes sem atividade
- Tarefas atrasadas
- Follow-ups vencidos

### Insights IA
- Gargalos operacionais
- Gargalos comerciais
- Top motivos de perda
- Ações recomendadas

### Edge Function
- `generate-manager-report` — Calcula todas as métricas

### Botões
| Botão | Ação |
|-------|------|
| ← Voltar | Dashboard |
| 🔄 Atualizar | Refetch report |
| 📥 Exportar | Download PDF/Excel |

---

## **14. Página: `/duvidas` (Central Operacional)**

**Tipo:** Privada (Ops)

### Descrição
Sistema de perguntas operacionais da equipe.

### Tabs
1. **Pendentes** — Aguardando resposta
2. **Respondidas** — Histórico

### Botões
| Botão | Ação | Permissão |
|-------|------|-----------|
| + Nova Pergunta | Abre formulário | Todos |
| Responder | Abre campo de resposta | Admin/Manager |

### Inputs
- Selecionar cliente (obrigatório)
- Pergunta (textarea)
- Resposta (textarea) — só para responder

### Fluxo
```
1. Operador tem dúvida sobre cliente
2. Clica "+ Nova Pergunta"
3. Seleciona cliente, escreve pergunta
4. Cria registro em questions (status='pending')
5. Notificação para admins
6. Admin vê na aba Pendentes
7. Clica "Responder", escreve resposta
8. Atualiza question (status='answered', answer, answered_by)
9. Operador vê resposta
```

---

## **15. Página: `/sugestoes` (Mural de Sugestões)**

**Tipo:** Privada

### Descrição
Sugestões de melhoria do sistema.

### Lista de Sugestões
- Título
- Descrição
- Status (pending/approved/rejected)
- Votos (upvotes)
- Autor
- Data

### Botões
| Botão | Ação | Permissão |
|-------|------|-----------|
| + Nova Sugestão | Formulário | Todos |
| 👍 Votar | Incrementa upvotes | Todos |
| Aprovar | Muda status | Super Admin |
| Rejeitar | Muda status | Super Admin |

---

## **16. Página: `/notifications` (Notificações)**

**Tipo:** Privada

### Descrição
Central de notificações do usuário.

### Lista de Notificações
- Ícone por tipo
- Título
- Mensagem
- Tempo relativo
- Status (lida/não lida)

### Tipos de Notificação
| Tipo | Trigger |
|------|---------|
| Lead sem atividade | Cron check-notifications |
| Tarefa vencida | Cron |
| Menção de equipe | Mensagem com @mention |
| Insight de IA | Análise automatizada |

### Botões
| Botão | Ação |
|-------|------|
| Marcar como lida | Atualiza read_at |
| Marcar todas | Atualiza todas |
| Configurações | Preferências de notificação |

---

## ⚡ EDGE FUNCTIONS

| Função | Descrição | Trigger |
|--------|-----------|---------|
| `create-user` | Cria usuário com role e permissões | Admin cria usuário |
| `reset-user-password` | Reseta senha de usuário | Admin reseta senha |
| `create-agency-owner` | Cria agência com owner completo | Super Admin aprova |
| `convert-lead-to-client` | Converte lead em cliente | Vendedor confirma |
| `generate-manager-report` | Gera relatório executivo | Admin acessa relatório |
| `generate-recurring-tasks` | Gera tarefas de recorrência | Cron diário |
| `check-notifications` | Verifica e cria notificações | Cron periódico |
| `analyze-seo` | Análise SEO via IA | Usuário aciona |
| `analyze-suspensao` | Análise de suspensão via IA | Usuário aciona |
| `analyze-raiox` | Análise de fechamento via IA | Usuário aciona |
| `analyze-recurrence` | Relatório de recorrência IA | Usuário aciona |
| `lead-copilot` | Copilot de vendas via IA | Usuário no lead |
| `process-voice-command` | Processa comando de voz | VoiceCommandButton |
| `voice-to-text` | Transcrição de áudio | Suporte voice |
| `permissions` | API de validação de permissões | Chamadas programáticas |

---

## 🔄 FLUXOS PRINCIPAIS

### Fluxo 1: Onboarding de Agência
```
/register → pending_registrations → /super-admin (Aprovar)
→ create-agency-owner → agencies + profiles + user_roles + 
  user_permissions + agency_members + agency_limits + agency_usage
→ Credenciais → /auth (Login) → /dashboard
```

### Fluxo 2: Convite de Membro
```
/equipe (Convidar) → agency_invites (token) → Email
→ /convite/:token → Signup/Login → Accept
→ agency_members + user_roles + user_permissions
→ /dashboard
```

### Fluxo 3: Lead → Cliente
```
Modo Vendas → Lead no Kanban → Arrastar para "Ganho"
→ lead.pipeline_stage = 'gained' → Cria comissão automática
→ Botão "Converter em Cliente" → convert-lead-to-client
→ Cria clients_v2 → Atualiza lead.converted_client_id
→ Aparece no Modo Otimização
```

### Fluxo 4: Recorrência
```
Admin configura recurring_routines → Cron generate-recurring-tasks
→ Cria recurring_tasks (due_date) → Modo Recorrência
→ Operador visualiza tarefas → Marca concluída
→ completed_at, completed_by → Dashboard compliance
```

---

## 📊 RESUMO DE PERMISSÕES POR PÁGINA

| Página | Acesso Mínimo |
|--------|---------------|
| `/auth` | Público |
| `/register` | Público |
| `/convite/:token` | Público (token válido) |
| `/dashboard` | Autenticado |
| `/equipe` | `canManageTeam` |
| `/admin` | `canAdminOrIsAdmin` |
| `/admin/audit` | `canAdminOrIsAdmin` |
| `/admin/permissions` | `is_super_admin` |
| `/super-admin` | `is_super_admin` |
| `/admin/agencia/:id` | `is_super_admin` |
| `/agency/settings/permissions` | Owner/Admin |
| `/commissions` | `canFinanceOrAdmin` |
| `/relatorio-gestor` | `canAdminOrIsAdmin` |
| `/duvidas` | `can_ops` |
| `/sugestoes` | Autenticado |
| `/notifications` | Autenticado |

---

## 🏁 CONCLUSÃO

Este relatório documenta o sistema G-Rank CRM em sua versão Bloco 17, com:
- **17+ páginas** funcionais
- **16 edge functions**
- **60+ tabelas** no banco de dados
- **17 permissões granulares**
- **8 roles** de usuário
- **3 funis** de trabalho (Vendas, Otimização, Recorrência)

O sistema está completo com arquitetura multi-tenant robusta, RBAC granular e auditoria de ações.
