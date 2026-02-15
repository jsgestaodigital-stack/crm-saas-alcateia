
# Plano de Teste Completo - 50 Verificacoes do GBRANK CRM

## Objetivo
Executar 50 testes end-to-end cobrindo todas as areas criticas do sistema, organizados por modulo. Cada teste sera executado navegando no app, verificando console/network, e consultando o banco de dados quando necessario.

---

## BLOCO 1: AUTENTICACAO E REGISTRO (Testes 1-8)

1. **Rota /auth carrega sem erros** - Navegar para /auth, verificar que o formulario de login renderiza, sem erros no console
2. **Validacao de email invalido** - Digitar email invalido e clicar "Entrar", verificar que a mensagem de erro aparece inline
3. **Validacao de senha curta** - Digitar senha com menos de 8 caracteres, verificar erro
4. **Rate limit visual** - Verificar que o componente de rate limit esta presente no codigo e funcional
5. **Rota /register carrega sem erros** - Navegar para /register, verificar formulario completo com todos os campos
6. **Validacao de registro** - Testar validacoes Zod (nome curto, email invalido, senha fraca, senhas diferentes)
7. **Redirect autenticado** - Verificar que usuario logado em /auth e redirecionado para /dashboard
8. **Recuperacao de senha** - Verificar que o fluxo "Esqueci minha senha" renderiza corretamente

## BLOCO 2: DASHBOARD E NAVEGACAO (Testes 9-16)

9. **Dashboard carrega com skeleton** - Navegar para /dashboard, verificar que skeleton screens aparecem durante loading
10. **Sidebar renderiza todas as secoes** - Verificar que AppSidebar tem links para todos os modulos (Vendas, Otimizacao, Recorrencia, Propostas, Contratos, etc.)
11. **FunnelToggle alterna modos** - Verificar que o seletor de funil alterna entre Vendas/Otimizacao/Recorrencia sem erros
12. **KPIs do Dashboard calculam corretamente** - Verificar que DashboardGrid renderiza os 6 KPIs com dados reais do banco
13. **PriorityAlerts renderiza alertas** - Verificar que alertas de clientes sem atualizar >7 dias e leads >5 dias aparecem
14. **Agenda lateral abre** - Verificar que o Sheet de Agenda abre ao clicar no botao Calendar
15. **Mobile header renderiza** - Verificar que o header mobile com menu hamburger aparece em viewport mobile
16. **Todas as 39 rotas carregam sem erro** - Navegar para cada rota definida em App.tsx e verificar que nao ha crash

## BLOCO 3: FUNIL DE VENDAS (Testes 17-26)

17. **LeadsKanban renderiza 10 colunas** - Verificar que todas as 10 colunas do pipeline estao presentes
18. **Contadores de valor por coluna** - Verificar que cada coluna mostra a soma de estimated_value dos leads
19. **NewLeadDialog abre e valida** - Abrir dialog de novo lead, verificar campos obrigatorios e validacao Zod
20. **Deteccao de duplicatas funciona** - Criar lead com nome similar a existente, verificar alerta de duplicata
21. **Drag & Drop de leads** - Arrastar um lead entre colunas e verificar que pipeline_stage atualiza no banco
22. **LeadDetailPanel abre** - Clicar em um lead e verificar que o painel lateral abre com todas as tabs
23. **Lead Copilot tab renderiza** - Verificar que a tab de IA do lead abre sem erro
24. **Conversao de lead para cliente** - Verificar que o botao de conversao chama o edge function convert-lead-to-client
25. **Lead marcado como perdido** - Verificar que o fluxo de marcar lead como perdido atualiza status e registra atividade
26. **Filtros e busca de leads** - Verificar que busca por nome e filtros por temperatura/responsavel funcionam

## BLOCO 4: FUNIL DE OTIMIZACAO (Testes 27-33)

27. **KanbanBoard renderiza 7 colunas** - Verificar colunas: Suspensos, Fila, Onboarding, Otimizacao, Pronto, Finalizado, Entregue
28. **ClientCard mostra informacoes corretas** - Verificar nome, cidade, barra de progresso, dias sem atualizar
29. **NewClientWizard abre e funciona** - Criar novo cliente pelo wizard e verificar que salva no banco
30. **ClientExecutionView abre** - Clicar em cliente e verificar que a view de execucao full-screen carrega
31. **Checklist de 47 pontos renderiza** - Verificar que o checklist completo carrega na view de execucao
32. **Conversao para recorrencia** - Verificar que o RecurrenceConversionDialog funciona ao mover para "Finalizado"
33. **Visualizacoes alternativas** - Verificar que Tabela, Timeline, Calendario, Cards carregam sem erro

## BLOCO 5: RECORRENCIA (Testes 34-37)

34. **RecurringExecutionView carrega** - Verificar que as tarefas recorrentes carregam do banco
35. **Completar tarefa recorrente** - Marcar tarefa como concluida e verificar atualizacao no banco
36. **Pular tarefa recorrente** - Pular tarefa e verificar status "skipped"
37. **RecurringOverview mostra estatisticas** - Verificar KPIs de compliance e tarefas atrasadas

## BLOCO 6: PROPOSTAS E CONTRATOS (Testes 38-42)

38. **Pagina /propostas carrega** - Verificar listagem de propostas sem erro
39. **Criar nova proposta** - Verificar que o editor de propostas abre e permite salvar
40. **Pagina /contratos carrega** - Verificar listagem de contratos sem erro
41. **Gerar contrato via IA** - Verificar que o edge function generate-contract responde corretamente
42. **Pagina publica de proposta** - Verificar que /proposta/:token carrega sem autenticacao

## BLOCO 7: SEGURANCA E PERMISSOES (Testes 43-47)

43. **RLS esta ativo em tabelas criticas** - Consultar pg_tables para verificar RLS habilitado em leads, clients, contracts, proposals
44. **Isolamento multi-tenant** - Verificar que leads de uma agencia nao aparecem para outra
45. **Permissoes por role funcionam** - Verificar que canAccessSales/canAccessDelivery respeita user_permissions
46. **SubscriptionGuard bloqueia rotas** - Verificar que rotas protegidas redirecionam quando subscription expirada
47. **Edge functions validam agency_id** - Verificar que convert-lead-to-client valida pertencimento do lead a agencia

## BLOCO 8: INFRAESTRUTURA E PERFORMANCE (Testes 48-50)

48. **Lazy loading funciona** - Verificar que paginas pesadas (Dashboard, Contratos) usam React.lazy corretamente
49. **Erro no console** - Verificar console do preview para erros JavaScript nao tratados
50. **Edge functions deployadas** - Verificar que todas as edge functions listadas em config.toml estao responsivas

---

## Execucao Tecnica

Para cada teste, a execucao seguira este padrao:
1. Navegar para a rota/componente usando browser tools
2. Verificar console logs para erros
3. Verificar network requests para falhas HTTP
4. Consultar banco de dados quando necessario para validar dados
5. Documentar resultado: PASSOU / FALHOU + detalhes

### Criterios de Falha
- Erro JavaScript no console (exceto warnings do React Router v6)
- Request HTTP com status 4xx/5xx
- Componente que nao renderiza ou mostra tela branca
- Dados inconsistentes entre UI e banco
- Fluxo que nao completa (botao que nao faz nada)

### Entregavel Final
Relatorio completo com status de cada um dos 50 testes, bugs encontrados, e correcoes implementadas imediatamente para cada falha critica.
