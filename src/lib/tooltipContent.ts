// Centralized tooltip content for the entire RANKEIA system
// Each tooltip has 2-4 lines explaining the feature

export const TOOLTIP_CONTENT = {
  // === NAVIGATION / SIDEBAR ===
  navigation: {
    kanban: "Visualização em colunas organizadas por etapa do processo. Arraste os cards entre colunas para atualizar o status. Ideal para acompanhar o fluxo de trabalho diário.",
    table: "Lista estruturada com todas as informações em formato de tabela. Permite ordenação e filtros rápidos. Ótimo para análise comparativa.",
    checklist: "Visão focada na execução das tarefas de cada cliente. Mostra o progresso detalhado do checklist e permite marcar itens como concluídos.",
    mytasks: "Suas tarefas pendentes de todos os clientes em um só lugar. Filtra automaticamente apenas as atividades atribuídas a você. Priorize o que precisa ser feito primeiro.",
    timeline: "Histórico temporal mostrando clientes organizados por mês de entrada. Identifica rapidamente projetos parados ou atrasados na linha do tempo.",
    calendar: "Visualização por datas importantes: entrada do cliente, prazos e entregas. Ajuda no planejamento semanal e mensal da equipe.",
    cards: "Cartões visuais compactos dos clientes com informações resumidas. Prioriza automaticamente clientes parados ou com baixo progresso no topo.",
    newClient: "Cadastra um novo cliente no sistema. Preencha as informações básicas e o cliente será adicionado na coluna inicial do Kanban.",
    newLead: "Cadastra uma nova oportunidade de venda. Preencha os dados do contato e a oportunidade será adicionada no funil de vendas.",
    questions: "Central de dúvidas da equipe. Aqui você pode ver, responder e gerenciar todas as perguntas feitas sobre os clientes. Dúvidas pendentes aparecem em destaque.",
    commissions: "Gerenciamento de comissões da equipe. Acompanhe valores a pagar, pagos e histórico mensal. As comissões são criadas automaticamente ao entregar um cliente.",
    admin: "Painel administrativo para gerenciar usuários, permissões e configurações do sistema. Apenas administradores têm acesso a esta área.",
    raioX: "Análise de ligações com inteligência artificial. Cole o link da gravação e receba insights sobre objeções, próximos passos e roteiro sugerido.",
  },

  // === STATS BAR ===
  stats: {
    active: "Quantidade de clientes em execução ativa (Verificação + Otimização + Prontos). Representa a carga de trabalho atual da equipe.",
    ready: "Clientes com execução 100% concluída aguardando entrega. Estes precisam de atenção para agendar a reunião de entrega com o cliente.",
    urgent: "Clientes com prazo de 30 dias prestes a vencer (menos de 5 dias restantes). Prioridade máxima para evitar atrasos.",
    stalled: "Clientes sem atualização há 3 ou mais dias. Podem indicar bloqueios ou esquecimentos. Verifique o motivo da parada.",
    delivered: "Total de clientes entregues no mês atual. Meta mensal de entregas da equipe.",
    progress: "Progresso médio de todos os clientes em execução. Indica a saúde geral do trabalho em andamento.",
  },

  // === SALES STATS ===
  sales: {
    pipelineValue: "Soma de todos os valores estimados das oportunidades em negociação. Representa o potencial total de vendas.",
    forecast: "Previsão de fechamento ponderada (valor × chance de fechar). Indica o valor esperado de receita.",
    hotLeads: "Oportunidades com alta probabilidade de fechar negócio. Priorize contato com estes.",
    conversionRate: "Porcentagem de oportunidades que viraram clientes este mês. Meta: acima de 30%.",
    overdue: "Oportunidades com data de retorno vencida. Precisam de contato urgente.",
    meetings: "Reuniões agendadas com potenciais clientes. Próximos compromissos importantes.",
    proposals: "Propostas comerciais enviadas aguardando resposta do cliente.",
    wonThisMonth: "Negócios fechados no mês atual. Celebre cada conquista!",
  },

  // === CLIENT CARD ===
  clientCard: {
    card: "Card do cliente com informações resumidas. Clique para abrir a visão detalhada com checklist completo. Arraste para mover entre colunas.",
    progress: "Barra de progresso baseada no checklist de execução. Verde = bom progresso, Amarelo = atenção, Vermelho = atrasado.",
    responsible: "Pessoa responsável pela execução deste cliente.",
    labels: "Etiquetas personalizadas para categorizar e identificar clientes rapidamente. Crie suas próprias etiquetas pelo menu do card.",
    menu: "Menu de ações do card: adicionar etiquetas, alterar capa, carregar foto de perfil ou excluir.",
    daysAgo: "Tempo desde a última atualização do cliente. Se passar de 3 dias, o sistema alerta que o cliente está parado.",
    suspended: "Contador de dias que o cliente está suspenso. Clientes suspensos precisam de ação para retomar o trabalho.",
  },

  // === LEAD CARD ===
  leadCard: {
    card: "Card da oportunidade com informações resumidas. Clique para abrir detalhes e histórico de atividades.",
    temperature: "Temperatura indica a probabilidade de fechamento: Frio (baixa), Morno (média), Quente (alta).",
    nextAction: "Próxima ação a ser tomada com esta oportunidade. Data em vermelho = atrasado.",
    estimatedValue: "Valor estimado do negócio se fechar. Usado para calcular previsão de vendas.",
    probability: "Chance percentual de fechar o negócio. Quanto maior, mais quente a oportunidade.",
  },

  // === CHECKLIST ===
  checklist: {
    item: "Tarefa do checklist de execução. Clique para marcar como concluída. O progresso do cliente é calculado automaticamente.",
    timer: "Cronômetro para medir o tempo de execução da tarefa. Clique para iniciar, clique novamente para parar e registrar. Os dados são salvos para análise posterior.",
    attachment: "Anexar link relacionado a esta tarefa (pasta do Drive, print, documento). Útil para manter referências organizadas.",
    tip: "Dica de como executar esta tarefa. Baseada nas melhores práticas definidas pela equipe.",
    responsible: "J = João, A = Amanda. Indica quem deve executar esta tarefa específica.",
  },

  // === EXECUTION VIEW ===
  execution: {
    header: "Cabeçalho com informações do cliente. Clique no lápis para editar nome, categoria ou links importantes.",
    briefing: "Notas do briefing com o cliente. Informações importantes coletadas na reunião inicial sobre o negócio.",
    photoMode: "Define como serão obtidas as fotos: João vai presencialmente ou o cliente envia. Impacta no fluxo de tarefas.",
    attachments: "Arquivos e links anexados ao cliente. Prints, documentos, pastas do Drive organizados em um só lugar.",
    whatsapp: "Link direto para o grupo de WhatsApp do cliente. Clique para abrir a conversa rapidamente.",
    drive: "Pasta do Google Drive com todos os arquivos do cliente. Fotos, documentos, relatórios organizados.",
    google: "Perfil do Google Business do cliente. Link direto para acessar e fazer as otimizações.",
  },

  // === KANBAN COLUMNS ===
  columns: {
    suspended: "Projetos pausados aguardando resolução. Podem ser problemas de pagamento, falta de resposta do cliente ou outros bloqueios.",
    pipeline: "Oportunidades em negociação quente, prestes a fechar. Ainda não são clientes oficiais, mas têm alta probabilidade de conversão.",
    onboarding: "Clientes novos entrando no sistema. Fase de coleta de dados, briefing e preparação para início da execução.",
    optimization: "Execução ativa das otimizações do perfil Google. Fase mais longa do processo onde todo o trabalho técnico acontece.",
    ready: "Trabalho técnico concluído, aguardando entrega. Momento de agendar reunião para apresentar resultados ao cliente.",
    delivered: "Projeto entregue ao cliente. Período de monitoramento de 30 dias ainda ativo para suporte.",
    finalized: "Projetos 100% encerrados. Cliente satisfeito, comissão paga, caso arquivado com sucesso.",
  },

  // === DASHBOARD ===
  dashboard: {
    urgentActions: "Top 5 ações mais urgentes baseadas em prazos e clientes parados. Priorize resolver estes itens primeiro.",
    agenda: "Sua agenda pessoal de compromissos do dia. Adicione reuniões, lembretes e tarefas que não são do checklist.",
    progressBar: "Distribuição visual de todos os clientes por etapa. Mostra a saúde do funil em tempo real.",
    collapse: "Clique para minimizar/expandir esta seção. Útil para focar no que importa no momento.",
  },

  // === ACTIONS ===
  actions: {
    voiceCommand: "Comando de voz para executar ações no sistema. Fale naturalmente o que deseja fazer e o sistema interpreta automaticamente.",
    trash: "Lixeira com itens excluídos. Você pode restaurar ou excluir permanentemente. Itens ficam aqui por segurança.",
    search: "Busca rápida por nome. Digite para filtrar a lista em tempo real.",
    themeToggle: "Alternar entre modo claro e escuro. O sistema lembra sua preferência.",
    notifications: "Central de notificações e dúvidas pendentes. Número em vermelho indica itens que precisam de atenção.",
    userMenu: "Menu do usuário com opções de perfil e logout. Clique para ver suas informações ou sair do sistema.",
    importLeads: "Importar oportunidades de uma planilha CSV ou Excel. Preencha os dados no formato correto e importe em massa.",
    columnSettings: "Personalizar as etapas do funil de vendas. Adicione, remova ou reordene as colunas conforme sua necessidade.",
  },

  // === FORMS ===
  forms: {
    save: "Salvar as alterações feitas. Os dados são enviados para o servidor e ficam disponíveis para toda a equipe.",
    cancel: "Cancelar a operação atual sem salvar alterações. Volta para o estado anterior.",
    delete: "Excluir este item. A ação move para a lixeira, de onde pode ser recuperado se necessário.",
    edit: "Editar as informações deste item. Clique para abrir o formulário de edição.",
  },
} as const;

// Helper type for accessing tooltip content
export type TooltipCategory = keyof typeof TOOLTIP_CONTENT;
export type TooltipKey<T extends TooltipCategory> = keyof typeof TOOLTIP_CONTENT[T];
