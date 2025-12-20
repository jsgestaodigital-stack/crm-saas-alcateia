# Plano de Teste QA - Plataforma Rankeia

## 1. INVENTÁRIO DE ROTAS E FLUXOS

### 1.1 Rotas Principais

| Rota | Página | Propósito | Acesso |
|------|--------|-----------|--------|
| `/` | Dashboard | Painel principal multi-modo (Delivery/Sales/Recorrência) | Autenticado |
| `/dashboard` | Dashboard | Alias do painel principal | Autenticado |
| `/auth` | Auth | Login do usuário | Público |
| `/admin` | Admin | Gestão de usuários e permissões | Admin only |
| `/commissions` | Commissions | Gestão de comissões | Finance/Admin |
| `/duvidas` | Questions | Central de dúvidas internas | Ops/Admin |
| `/sugestoes` | Suggestions | Mural de sugestões | Autenticado |
| `/raio-x` | RaioX | Agente AI de análise de leads | Sales/Admin |
| `/agente-seo` | AgenteSEO | Agente AI de SEO | Ops/Admin |
| `/agente-suspensoes` | AgenteSuspensoes | Agente AI de suspensões | Ops/Admin |
| `/historico` | Historico | Histórico de ações (undo/redo) | Autenticado |
| `/relatorio-gestor` | ManagerReport | Relatório executivo BI | Admin only |
| `/recorrencia` | Recorrencia | Gestão de tarefas recorrentes | Recurring/Admin |
| `*` | NotFound | Página 404 | Público |

### 1.2 Componentes Críticos por Tela

#### Dashboard (`/`)
- **Componentes**: AppSidebar, DashboardHeader, FunnelToggle, GlobalProgressBar
- **Modos de Visualização**: 
  - Delivery: KanbanBoard, ProgressTable, TimelineView, CalendarView, CardsView, UnifiedTasksView, ManagerOverview
  - Sales: LeadsKanban, SalesDashboard, SalesOverview
  - Recurring: RecurrenceView, RecurringOverview, RecurringExecutionView
- **Modais**: NewClientWizard, ClientExecutionView, NewLeadDialog, LeadDetailPanel
- **Estados**: loading, empty, error, permission-denied

#### Admin (`/admin`)
- **Componentes**: Tabela de usuários, Dialog de criação, AlertDialog de exclusão
- **Ações**: Criar usuário, editar role, editar permissões, excluir usuário
- **Estados**: loading, empty list, error

#### Commissions (`/commissions`)
- **Tabs**: Comissões, Configurações
- **Componentes**: CommissionKPI, CommissionTimeline, CommissionsByRecipient, CommissionForecast
- **Modais**: Dialog de nova comissão
- **Ações**: Criar, aprovar, pagar, cancelar comissão

### 1.3 Modais e Dialogs Identificados

| Componente | Localização | Trigger |
|------------|-------------|---------|
| NewClientWizard | Dashboard | Botão "Novo Cliente" |
| NewLeadDialog | Dashboard (Sales) | Botão "Novo Lead" |
| LeadDetailPanel | Dashboard (Sales) | Click em card de lead |
| ClientDetailPanel | Dashboard | Click em card de cliente |
| ClientExecutionView | Dashboard | Execução de checklist |
| ImportLeadsDialog | Sales | Botão de importação |
| ColumnSettingsDialog | Sales | Configuração de colunas |
| RecurrenceConversionDialog | Recorrência | Conversão de cliente |
| ExportReportModal | Diversos | Exportar relatório |

---

## 2. MATRIZ DE TESTES E2E

### 2.1 Prioridade P0 (Crítico - Bloqueia release)

| ID | Cenário | Pré-condição | Passos | Resultado Esperado | Sinal de Falha |
|----|---------|--------------|--------|-------------------|----------------|
| P0-001 | Login com credenciais válidas | Usuário existe no sistema | 1. Acessar /auth 2. Inserir email/senha válidos 3. Clicar "Entrar" | Redirect para / com sessão ativa | Permanece em /auth, erro não exibido |
| P0-002 | Redirect para login se não autenticado | Não logado | 1. Acessar / diretamente | Redirect automático para /auth | Tela em branco, loop infinito |
| P0-003 | Logout funciona | Logado | 1. Clicar logout na sidebar | Sessão destruída, redirect para /auth | Sessão persiste, dados visíveis |
| P0-004 | Admin não acessível por não-admin | Logado como operador | 1. Acessar /admin | Redirect para / ou mensagem de acesso negado | Tela admin carrega |
| P0-005 | Criar cliente (Delivery) | Logado com permissão ops | 1. Abrir wizard 2. Preencher dados 3. Salvar | Cliente aparece no kanban | Toast de erro, cliente não aparece |
| P0-006 | Mover cliente entre colunas | Cliente existe | 1. Arrastar card 2. Soltar em nova coluna | Posição atualizada no banco | Volta para posição original |
| P0-007 | Criar lead (Sales) | Logado com permissão sales | 1. Abrir dialog 2. Preencher 3. Salvar | Lead aparece no kanban | Erro silencioso |
| P0-008 | Mover lead entre estágios | Lead existe | 1. Arrastar lead 2. Soltar em novo estágio | Stage atualizado | Revert visual |
| P0-009 | Session expires gracefully | Token expirado | Qualquer ação autenticada | Toast informativo + redirect /auth | Erro 401 silencioso |
| P0-010 | Dados multi-tenant isolados | 2 agências existem | Logar em cada agência | Cada um vê apenas seus dados | Cross-tenant data leak |

### 2.2 Prioridade P1 (Alto - Afeta UX significativamente)

| ID | Cenário | Pré-condição | Passos | Resultado Esperado | Sinal de Falha |
|----|---------|--------------|--------|-------------------|----------------|
| P1-001 | Botão voltar do browser funciona | Navegou entre telas | 1. Ir para /admin 2. Clicar voltar | Volta para tela anterior | Loop, tela errada |
| P1-002 | Filtros preservados ao voltar | Filtro aplicado | 1. Aplicar filtro 2. Navegar 3. Voltar | Filtro mantido | Filtro resetado |
| P1-003 | Formulário não perde dados ao erro | Formulário preenchido | 1. Preencher 2. Simular erro 3. Retry | Dados mantidos | Form limpo |
| P1-004 | Duplo clique não duplica ação | Formulário pronto | 1. Clicar submit rapidamente 2x | Apenas 1 registro criado | 2 registros |
| P1-005 | Loading state em todas as telas | Rede lenta | Acessar qualquer tela | Spinner visível | Tela em branco |
| P1-006 | Empty state quando sem dados | Novo usuário | Acessar dashboard | Mensagem amigável | Tela vazia sem contexto |
| P1-007 | Troca de modo Delivery/Sales | Dashboard aberto | Clicar FunnelToggle | Troca suave, dados corretos | Flash, dados incorretos |
| P1-008 | Checklist salva automaticamente | Checklist aberto | Marcar item | Persistido imediatamente | Perde ao navegar |
| P1-009 | Deep link com sessão válida | Logado | Acessar /commissions diretamente | Tela carrega corretamente | Redirect indevido |
| P1-010 | Deep link com sessão inválida | Não logado | Acessar /commissions | Redirect para /auth | Tela quebrada |

### 2.3 Prioridade P2 (Médio - Melhorias de qualidade)

| ID | Cenário | Pré-condição | Passos | Resultado Esperado | Sinal de Falha |
|----|---------|--------------|--------|-------------------|----------------|
| P2-001 | Busca de clientes funciona | Clientes existem | Digitar no campo de busca | Resultados filtrados | Sem resposta |
| P2-002 | Paginação funciona | >20 itens | Clicar próxima página | Novos itens carregam | Mesmos itens |
| P2-003 | Ordenação funciona | Lista visível | Clicar header de coluna | Lista reordenada | Sem efeito |
| P2-004 | Máscaras de input funcionam | Campo telefone | Digitar número | Formatação automática | Sem máscara |
| P2-005 | Validação de email | Campo email | Digitar email inválido | Erro inline | Aceita inválido |
| P2-006 | Responsividade mobile | Dispositivo móvel | Acessar dashboard | Layout adaptado | Overflow, corte |
| P2-007 | Dark/Light mode toggle | Tema atual | Clicar toggle | Tema muda | Sem efeito |
| P2-008 | Undo/Redo funciona | Ação realizada | Ctrl+Z | Ação desfeita | Sem efeito |
| P2-009 | Export PDF funciona | Relatório aberto | Clicar exportar | PDF gerado | Erro/timeout |
| P2-010 | Notificações aparecem | Evento ocorre | Aguardar | Badge de notificação | Sem indicação |

---

## 3. TESTES DE NAVEGAÇÃO E HISTÓRICO

### 3.1 Cenários de Botão Voltar

| Cenário | De | Para | Voltar | Esperado |
|---------|----|----|--------|----------|
| Dashboard → Admin → Voltar | / | /admin | browser back | / |
| Login → Dashboard → Voltar | /auth | / | browser back | NÃO voltar para /auth |
| Dashboard → Cliente → Voltar | / | detail | UI back | / com estado preservado |
| Deep link → Voltar | /commissions (direto) | - | browser back | / ou tab anterior |

### 3.2 Cenários de Loop Detection

| Cenário | Passos | Esperado | Falha |
|---------|--------|----------|-------|
| Login redirect loop | Tentar acessar / sem login | /auth uma vez | Loop /auth ↔ / |
| Permission redirect loop | Acessar /admin sem permissão | / uma vez | Loop /admin ↔ / |
| Session expiry loop | Token expira durante uso | /auth uma vez | Múltiplos redirects |

### 3.3 Estado Preservado ao Navegar

| Estado | Navegar Para | Voltar | Deve Preservar |
|--------|-------------|--------|----------------|
| Filtro de status | /admin | back | ✓ Filtro |
| Scroll position | /admin | back | ✓ Scroll |
| Form parcialmente preenchido | /admin | back | ⚠️ Alerta de dados não salvos |
| Modo (Sales/Delivery) | /commissions | back | ✓ Modo |
| Tab ativa | /commissions | back | ✓ Tab |

---

## 4. TESTES DE SESSÃO E AUTENTICAÇÃO

### 4.1 Cenários de Token

| Cenário | Ação | Esperado |
|---------|------|----------|
| Token expira | Qualquer requisição | Toast "Sessão expirada" + redirect /auth |
| Refresh token falha | Auto-refresh | Logout gracioso |
| Sessão inválida | Abrir app | Redirect /auth |
| Logout em outra aba | Ação na aba atual | Detectar e redirect |

### 4.2 Cross-Tab Behavior

| Cenário | Aba 1 | Aba 2 | Esperado |
|---------|-------|-------|----------|
| Logout em uma aba | Logout | Ativa | Aba 2 detecta e redireciona |
| Login em uma aba | Login | Em /auth | Aba 2 atualiza |
| Troca de tenant | Muda agência | Ativa | Aba 2 recarrega dados |

### 4.3 Proteções

- [ ] Não mostrar dados antes de confirmar sessão
- [ ] Spinner durante verificação inicial
- [ ] Mensagens claras de erro de autenticação
- [ ] Não "girar infinito" em caso de erro

---

## 5. TESTES DE FORMULÁRIOS E VALIDAÇÕES

### 5.1 Campos Obrigatórios

| Form | Campo | Tipo | Validação |
|------|-------|------|-----------|
| Login | Email | email | Required, formato email |
| Login | Senha | password | Required, min 8 chars |
| Novo Cliente | Nome empresa | text | Required |
| Novo Lead | Nome empresa | text | Required |
| Nova Comissão | Cliente | select | Required |
| Nova Comissão | Valor | number | Required, > 0 |

### 5.2 Comportamento de Submit

| Cenário | Esperado |
|---------|----------|
| Submit válido | Botão desabilitado, loading, success toast |
| Submit inválido | Erros inline, botão habilitado |
| Erro de rede | Toast de erro, retry possível |
| Duplo clique | Apenas 1 requisição |

---

## 6. TESTES DE ERROS E RESILIÊNCIA

### 6.1 Respostas de API

| Status | Cenário | Reação UI |
|--------|---------|-----------|
| 401 | Token inválido | Toast + redirect /auth |
| 403 | Sem permissão | Toast + redirect / |
| 404 | Recurso não existe | Toast informativo |
| 409 | Conflito | Toast explicativo |
| 422 | Validação falhou | Erros inline |
| 429 | Rate limit | Toast "Aguarde" |
| 500 | Erro servidor | Toast + opção retry |
| 503 | Indisponível | Toast + retry automático |
| Timeout | Rede lenta | Toast + retry manual |
| Offline | Sem internet | Banner "Sem conexão" |

### 6.2 Regras

- ❌ Erro silencioso é proibido
- ✓ Todo erro = feedback visual + log no QA Console
- ✓ Retry quando aplicável

---

## 7. TESTES DE PERFORMANCE E UX

### 7.1 Métricas Alvo

| Métrica | Alvo | Aceitável |
|---------|------|-----------|
| LCP (Largest Contentful Paint) | < 2.5s | < 4s |
| TTI (Time to Interactive) | < 3s | < 5s |
| Loading spinner máximo | 5s | 10s |

### 7.2 Checklist Visual

- [ ] Sem layout shift ao carregar
- [ ] Sem "piscada" de listas
- [ ] Animações suaves (60fps)
- [ ] Imagens lazy loaded
- [ ] Skeleton loaders onde apropriado

### 7.3 Mobile

- [ ] Touch targets ≥ 44px
- [ ] Scroll suave
- [ ] Teclado não cobre inputs
- [ ] Safe area respeitada
- [ ] Gestos funcionam (swipe, pinch)

---

## 8. TESTES DE ACESSIBILIDADE

### 8.1 Checklist

- [ ] Tab order lógico
- [ ] Focus visible em todos elementos interativos
- [ ] Labels em todos os inputs
- [ ] Alt text em imagens significativas
- [ ] Contraste mínimo 4.5:1
- [ ] Erros anunciados para screen readers
- [ ] Estados disabled/hover/focus distintos

---

## 9. MODO DEBUG QA (IMPLEMENTADO)

### 9.1 Ativação

- **URL**: Adicionar `?qa=1` a qualquer rota
- **Atalho**: `Ctrl + Alt + D`
- **Persistência**: Salvo em localStorage

### 9.2 Funcionalidades

#### QA Console Drawer
- **Logs de Navegação**: Rota anterior/atual, motivo (click/redirect/guard/back)
- **Estado de Sessão**: Logado? User ID, Email, Role, Permissões
- **Chamadas de API**: Endpoint, método, status, tempo, erro
- **Eventos de UI**: Cliques, submits, back navigation
- **Erros JS**: window.onerror, unhandledrejection

#### Botões de Simulação
- **Simular 401**: Força logout e redirect
- **Simular Offline**: Bloqueia requisições de rede
- **Limpar Cache**: Remove localStorage (exceto qa_debug)
- **Reset Estado**: Limpa todos os logs do QA Console
- **Forçar Refresh Sessão**: Recarrega permissões

#### Bug Report
- Copia para clipboard um JSON sanitizado com:
  - Rota atual
  - Estado de sessão (sem tokens)
  - Últimas navegações
  - Erros de API recentes
  - Erros JS recentes
  - User agent
  - Dimensões de tela

---

## 10. TRILHA DE EXECUÇÃO

### 10.1 Ordem Recomendada

```
1. SETUP
   ├── Ativar QA Mode (?qa=1)
   ├── Verificar QA Console abre (Ctrl+Alt+D)
   └── Limpar cache inicial

2. AUTENTICAÇÃO (P0)
   ├── Testar login válido
   ├── Testar login inválido
   ├── Testar redirect não-autenticado
   ├── Testar logout
   └── Testar sessão expirada (Simular 401)

3. PERMISSÕES (P0)
   ├── Testar acesso admin (como admin)
   ├── Testar acesso admin (como operador) → deve bloquear
   ├── Testar acesso commissions (como finance)
   └── Testar troca de modo Delivery/Sales

4. CRUD CLIENTES (P0)
   ├── Criar cliente
   ├── Editar cliente
   ├── Mover entre colunas
   ├── Checklist funciona
   └── Excluir cliente

5. CRUD LEADS (P0)
   ├── Criar lead
   ├── Editar lead
   ├── Mover entre estágios
   └── Converter para cliente

6. NAVEGAÇÃO (P1)
   ├── Testar botão voltar browser
   ├── Testar botão voltar UI
   ├── Testar deep links
   ├── Verificar filtros preservados
   └── Verificar scroll preservado

7. FORMULÁRIOS (P1)
   ├── Validações obrigatórias
   ├── Duplo clique
   ├── Erro de rede → retry
   └── Dados preservados após erro

8. RESILIÊNCIA (P1)
   ├── Simular offline
   ├── Verificar error toasts
   └── Verificar logs no QA Console

9. MOBILE (P2)
   ├── Layout responsivo
   ├── Touch targets
   └── Teclado virtual

10. CLEANUP
    ├── Exportar Bug Report (se houver issues)
    └── Documentar findings
```

### 10.2 Checklist Final de Release

#### P0 - Obrigatório Verde
- [ ] Login/logout funciona
- [ ] Redirects de permissão funcionam
- [ ] CRUD de clientes funciona
- [ ] CRUD de leads funciona
- [ ] Dados são isolados por tenant
- [ ] Erros mostram feedback

#### P1 - Altamente Recomendado
- [ ] Navegação back funciona
- [ ] Formulários validam corretamente
- [ ] Loading states existem
- [ ] Empty states existem

#### P2 - Desejável
- [ ] Mobile responsivo
- [ ] Acessibilidade básica
- [ ] Performance aceitável

---

## 11. TEMPLATE DE BUG REPORT

```markdown
## Bug Report

**Data/Hora**: 
**Rota**: 
**Usuário**: 
**Role**: 

### Descrição
[O que aconteceu]

### Passos para Reproduzir
1. 
2. 
3. 

### Resultado Esperado
[O que deveria acontecer]

### Resultado Atual
[O que aconteceu de fato]

### QA Console Output
[Cole aqui o bug report gerado]

### Screenshots
[Anexar se aplicável]

### Severidade
- [ ] P0 - Crítico
- [ ] P1 - Alto
- [ ] P2 - Médio
- [ ] P3 - Baixo
```

---

## 12. NOTAS FINAIS

### Issues Conhecidas
- AlertDialog no Admin.tsx gera warning de ref (não impacta função)

### Áreas de Risco
- Troca de tenant em tempo real
- Sessão expirada durante edição
- Offline mode recovery
- Concurrent edits (mesmo recurso)

### Próximos Passos
1. Executar trilha de testes
2. Documentar bugs encontrados
3. Priorizar correções
4. Re-testar após fixes
5. Sign-off para release
