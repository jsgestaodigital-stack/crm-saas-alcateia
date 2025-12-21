import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, FileText, Bell, TrendingUp, Shield, Check, X, ArrowRight, Sparkles, Zap, 
  Calculator, Clock, MessageCircle, ChevronDown, Menu, X as CloseIcon, CreditCard, 
  UserCheck, Target, Award, MapPin, Star, Phone, Camera, BarChart3, Calendar,
  CheckCircle2, ListChecks, Rocket, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import grankLogoDark from "@/assets/grank-logo-dark.png";
import { 
  AnimatedCounter, ScrollProgress, InteractiveDemo, HeroVideo, ComparisonTable, SectionDivider,
  FloatingMapPins, GoogleStars, GMBProfileMockup, GMBStatsCard, GMBChecklistPreview, GMBBadge,
  GMBWaveDivider, GMBTestimonialCard, GMBFeatureCard
} from "@/components/landing";

const Landing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Force light mode on landing page
  useEffect(() => {
    document.documentElement.classList.add('light');
    return () => {
      document.documentElement.classList.remove('light');
    };
  }, []);

  // 2 cards for Prospecção (combined features)
  const prospectionFeatures = [
    {
      icon: Users,
      title: "Funil de Leads Visual + CRM",
      description: "Organize leads GMB em estágios claros com kanban. Histórico completo, temperatura de interesse e próximas ações programadas."
    },
    {
      icon: FileText,
      title: "Propostas + Contratos Digitais",
      description: "Gere propostas profissionais em 2 cliques. Envie por link rastreável e converta em contrato com assinatura digital."
    }
  ];

  // 4 cards for Execução Operacional (DESTAQUE)
  const executionFeatures = [
    {
      icon: ListChecks,
      title: "Checklist de 47 Pontos GMB",
      description: "Da categoria principal às fotos de fachada. Checklist completo de otimização que qualquer operador consegue seguir.",
      highlight: true
    },
    {
      icon: Calendar,
      title: "Gestão de Tarefas Recorrentes",
      description: "Controle de posts semanais, calendário visual, status de publicação e histórico completo de cada perfil."
    },
    {
      icon: UserCheck,
      title: "Controle Gestor vs Operador",
      description: "Permissões claras. Gestor supervisiona e aprova, operador executa. Responsabilidades bem definidas."
    },
    {
      icon: MessageCircle,
      title: "Posts e Avaliações",
      description: "Monitore e responda avaliações de todos os perfis. Templates de resposta e alertas de novas reviews."
    }
  ];

  // 2 cards for Gestão (combined features)
  const managementFeatures = [
    {
      icon: BarChart3,
      title: "Dashboard com Alertas",
      description: "Visão geral de todos os clientes, tarefas pendentes, contratos vencendo e alertas inteligentes de performance."
    },
    {
      icon: Calculator,
      title: "Comissões + Relatórios",
      description: "Cálculo automático de comissões por venda ou renovação. Relatórios completos para mostrar valor ao cliente."
    }
  ];

  const plans = [
    {
      name: "Starter",
      emoji: "🟢",
      tagline: "Feito pro lobo solo",
      monthlyPrice: 67,
      annualPrice: 54,
      color: "google-green",
      features: [
        "Até 15 clientes GMB ativos",
        "Até 200 leads",
        "Até 2 membros da equipe",
        "Funil e tarefas básicas",
        "Checklist de otimização",
        "Dashboard principal",
        "Suporte por e-mail"
      ],
      limitations: ["Sem automações", "Sem controle de comissão", "Sem exportação de dados"],
      cta: "Começar Grátis",
      popular: false
    },
    {
      name: "Pro",
      emoji: "🔵",
      tagline: "Feito pra quem vive de GMB",
      monthlyPrice: 127,
      annualPrice: 102,
      color: "google-green",
      features: [
        "Até 50 clientes GMB ativos",
        "Até 1.000 leads",
        "Até 5 membros",
        "Funil e tarefas avançadas",
        "Automações por status",
        "Relatórios por cliente",
        "Controle de comissões",
        "Logs e auditoria",
        "Suporte prioritário"
      ],
      limitations: [],
      cta: "Testar Grátis",
      popular: true
    },
    {
      name: "Master",
      emoji: "🟣",
      tagline: "Feito pro lobo alfa de matilha",
      monthlyPrice: 197,
      annualPrice: 158,
      color: "google-blue",
      features: [
        "Até 150 clientes GMB ativos",
        "Até 5.000 leads",
        "Até 15 membros",
        "Tudo do Pro +",
        "Dashboard financeiro",
        "Exportação de dados",
        "Suporte por WhatsApp",
        "Acesso antecipado"
      ],
      limitations: [],
      cta: "Testar Grátis",
      popular: false
    }
  ];

  // Removed testimonials - we don't have real clients yet

  const faqs = [
    {
      question: "Preciso ser expert em tecnologia para usar?",
      answer: "Não. O GRank CRM foi feito para ser simples. Se você usa WhatsApp, vai usar o GRank CRM tranquilamente."
    },
    {
      question: "Funciona especificamente para Google Meu Negócio?",
      answer: "Sim! O GRank foi construído especificamente para agências que trabalham com GMB, SEO local e otimização de perfis Google."
    },
    {
      question: "E se eu não gostar?",
      answer: "Sem problema. Você testa 14 dias grátis e cancela se não fizer sentido. Zero burocracia."
    },
    {
      question: "Posso importar meus clientes atuais?",
      answer: "Sim. Você consegue importar seus dados de planilhas ou outros sistemas facilmente."
    },
    {
      question: "Tem suporte em português?",
      answer: "Sim. Suporte completo em português, feito por quem entende de Google Meu Negócio."
    },
    {
      question: "Qual o investimento mensal?",
      answer: "Os valores variam de acordo com o tamanho da sua operação. Planos a partir de R$67/mês. Veja os detalhes acima."
    }
  ];

  const navLinks = [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Preços", href: "#precos" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgress />
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={grankLogoDark} alt="GRank CRM" className="h-7 sm:h-8 w-auto" />
            <span className="font-bold text-lg sm:text-xl text-google-green">GRank CRM</span>
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map(link => (
              <a 
                key={link.label} 
                href={link.href} 
                className="text-sm text-muted-foreground hover:text-google-green transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" asChild className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted text-sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="bg-google-green hover:bg-google-green-dark text-white border-0 shadow-lg shadow-google-green/30 text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10">
              <Link to="/register">
                <span className="hidden xs:inline">Testar Grátis</span>
                <span className="xs:hidden">Testar</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 sm:h-4 w-3 sm:w-4" />
              </Link>
            </Button>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 text-foreground touch-target"
            >
              {mobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-t border-border px-4 py-4 safe-area-inset-left safe-area-inset-right"
          >
            {navLinks.map(link => (
              <a 
                key={link.label} 
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-foreground hover:text-google-green transition-colors touch-target"
              >
                {link.label}
              </a>
            ))}
            <Link 
              to="/auth" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-muted-foreground touch-target"
            >
              Entrar
            </Link>
          </motion.div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="min-h-screen relative flex items-center justify-center pt-20 sm:pt-24 pb-16 sm:pb-32 px-3 sm:px-4 section-gmb-hero overflow-hidden">
        <FloatingMapPins />
        
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-google-green/10 rounded-full blur-[80px] sm:blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-google-blue/8 rounded-full blur-[60px] sm:blur-[100px]" />
        </div>

        <div className="container mx-auto text-center relative z-10 px-2 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* GMB Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-google-green/10 border-2 border-google-green/30 mb-6 sm:mb-8"
            >
              <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-google-red flex-shrink-0" />
              <span className="text-xs sm:text-sm text-google-green font-semibold text-center">
                🗺️ A Plataforma #1 para Google Meu Negócio
              </span>
            </motion.div>
            
            {/* Headline Principal */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight font-display">
              <span className="text-foreground">Pare de Fazer Tudo Sozinho.</span>
              <br />
              <span className="gradient-google-text">Delegue, Controle e Escale</span>
              <br />
              <span className="text-foreground">sua Agência de GMB.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
              Da prospecção à execução recorrente. Da proposta ao checklist de otimização.
              <br className="hidden sm:block" />
              O único sistema que gerencia <strong className="text-foreground">todo o ciclo operacional</strong> de perfis Google em um só lugar.
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-4 sm:mb-6 px-2">
              <Button 
                size="lg" 
                asChild 
                className="bg-google-green hover:bg-google-green-dark text-white border-0 shadow-xl shadow-google-green/30 btn-pulse btn-press text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto min-h-[48px] sm:min-h-[56px] w-full sm:w-auto"
              >
                <Link to="/register">
                  <Zap className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                  TESTE GRÁTIS POR 14 DIAS
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="border-2 border-google-green text-google-green hover:bg-google-green hover:text-white text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto min-h-[48px] sm:min-h-[56px] btn-press w-full sm:w-auto"
              >
                <a href="#demo">
                  <MessageCircle className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                  Agendar Demonstração
                </a>
              </Button>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-2 sm:gap-4 flex-wrap px-2 mb-6">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-google-green" />
                Mais de 500 perfis gerenciados
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-google-yellow fill-google-yellow" />
                4.9/5 estrelas
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-google-green" />
                Sem cartão de crédito
              </span>
            </p>
          </motion.div>

          {/* Hero Video/Demo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12"
          >
            <HeroVideo />
          </motion.div>
        </div>

        {/* Wave divider to next section */}
        <GMBWaveDivider position="bottom" color="green" />
      </section>

      {/* ===== SEÇÃO ESTATÍSTICAS - 4 CARDS SIMÉTRICOS ===== */}
      <section className="py-20 px-4 relative section-gmb-light">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            <GMBStatsCard 
              icon={MapPin} 
              value="500+" 
              label="Perfis GMB gerenciados" 
              color="green" 
              delay={0}
            />
            <GMBStatsCard 
              icon={Calendar} 
              value="4 anos" 
              label="Experiência em SEO local" 
              color="blue" 
              delay={0.1}
            />
            <GMBStatsCard 
              icon={Target} 
              value="1.500+" 
              label="Reuniões de vendas" 
              color="red" 
              delay={0.2}
            />
            <GMBStatsCard 
              icon={CheckCircle2} 
              value="47" 
              label="Pontos de otimização" 
              color="yellow" 
              delay={0.3}
            />
          </div>
        </div>
        <GMBWaveDivider position="bottom" color="white" />
      </section>

      {/* ===== SEÇÃO PROBLEMA ===== */}
      <section className="py-16 md:py-24 px-4 relative section-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 font-display px-2">
              Você Está <span className="text-google-red">Preso na Operação?</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
              Identifique se esses sintomas estão te impedindo de escalar sua agência GMB:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: "😰 Você Faz Tudo Sozinho",
                description: "Prospecta, vende, otimiza perfis, cria posts, responde avaliações... E quando tenta delegar, vira bagunça.",
                borderColor: "border-l-google-red"
              },
              {
                icon: FileText,
                title: "📝 Otimização Sem Padrão",
                description: "Cada operador faz do seu jeito. Um esquece categorias, outro pula atributos. Não tem como garantir qualidade.",
                borderColor: "border-l-google-blue"
              },
              {
                icon: Clock,
                title: "🔄 Recorrentes Sem Controle",
                description: "Você não sabe quais clientes tiveram posts essa semana ou quais estão sem atividade há 15 dias.",
                borderColor: "border-l-google-yellow"
              },
              {
                icon: Target,
                title: "💸 Trabalho Invisível",
                description: "Você trabalha muito, mas o cliente não vê. Na hora de renovar: 'O que vocês fizeram mesmo?'",
                borderColor: "border-l-google-green"
              }
            ].map((problem, i) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl border-2 border-border ${problem.borderColor} border-l-4 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
              >
                <h3 className="text-lg font-semibold mb-3 text-foreground">{problem.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{problem.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12 text-lg max-w-2xl mx-auto"
          >
            <span className="text-google-green font-medium italic">
              "Se você não consegue tirar férias sem que tudo desmorone, sua agência não tem estrutura — tem você."
            </span>
          </motion.p>
        </div>

        <SectionDivider variant="diagonal" fill="fill-gmb-light-green" className="bottom-0" />
      </section>

      {/* ===== SEÇÃO SOLUÇÃO ===== */}
      <section id="como-funciona" className="py-24 px-4 relative section-gmb-light">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <GMBBadge variant="green">
              <Sparkles className="h-4 w-4" />
              A Solução
            </GMBBadge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-display mt-6">
              O GRank CRM Gerencia{" "}
              <span className="gradient-google-text">Todo o Ciclo Operacional</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-4">
              Da primeira conversa com o lead até a execução recorrente mensal.
              <br />Tudo em um só sistema. Tudo sob controle.
            </p>
          </motion.div>

          <div id="demo">
            <InteractiveDemo />
          </div>
        </div>

        <GMBWaveDivider position="bottom" color="white" />
      </section>

      {/* ===== SEÇÃO FUNCIONALIDADES ===== */}
      <section id="funcionalidades" className="py-24 px-4 relative section-white">
        <div className="container mx-auto">
          {/* Prospecção & Venda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-google-blue" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">🎯 PROSPECÇÃO & VENDA</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {prospectionFeatures.map((feature, index) => (
                <GMBFeatureCard 
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </motion.div>

          {/* Execução Operacional - DESTAQUE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 p-8 rounded-3xl section-gmb-light border-2 border-google-green/20"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-google-green/15 flex items-center justify-center">
                  <ListChecks className="h-5 w-5 text-google-green" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">⚙️ EXECUÇÃO OPERACIONAL</h3>
              </div>
              <GMBBadge variant="green">
                <Star className="h-4 w-4" />
                NOSSO DIFERENCIAL
              </GMBBadge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {executionFeatures.map((feature, index) => (
                <GMBFeatureCard 
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  highlight={feature.highlight}
                  delay={index * 0.1}
                />
              ))}
            </div>

            {/* Mini Checklist Visual */}
            <div className="mt-8 flex justify-center">
              <GMBChecklistPreview className="max-w-sm" />
            </div>
          </motion.div>

          {/* Gestão & Inteligência */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-status-purple/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-status-purple" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">📊 GESTÃO & INTELIGÊNCIA</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {managementFeatures.map((feature, index) => (
                <GMBFeatureCard 
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </motion.div>
        </div>

      </section>

      {/* ===== SEÇÃO DIFERENCIAL COMPETITIVO (COMPARISON TABLE) ===== */}
      <section className="py-24 px-4 relative bg-gradient-to-b from-gmb-light-green via-white to-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <GMBBadge variant="green">
              <Star className="h-4 w-4" />
              Comparação
            </GMBBadge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-display mt-6">
              Por Que o GRank é{" "}
              <span className="gradient-google-text">Diferente de Qualquer Outro CRM?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Não somos um CRM genérico. Somos especializados em Google Meu Negócio.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* CRMs Genéricos */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border-2 border-border p-8 shadow-sm"
            >
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">❌</div>
                <h3 className="text-2xl font-bold text-slate-800">Outros CRMs Genéricos</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Feitos para qualquer nicho (imobiliário, seguros, consultoria...)",
                  "Você precisa configurar tudo do zero (40 horas+)",
                  "Não entendem nada de Google Meu Negócio",
                  "Sem checklist de otimização GMB",
                  "Não controlam tarefas operacionais recorrentes",
                  "Contratos genéricos sem cláusulas específicas"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <X className="h-5 w-5 text-google-red flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* GRank CRM */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border-2 border-google-green p-8 shadow-lg shadow-google-green/10 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 bg-gradient-to-r from-google-green to-google-green-dark text-white text-xs font-semibold rounded-full">
                  Especializado em GMB
                </span>
              </div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-slate-800">GRank CRM</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "100% focado em agências de Google Meu Negócio",
                  "Já vem pronto e configurado (15 minutos para começar)",
                  "Construído por quem vende GMB há 4 anos",
                  "Checklist completo de 47 pontos de otimização",
                  "Gestão de tarefas recorrentes automáticas",
                  "Contratos com cláusulas específicas para GMB"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-gmb-light-green rounded-lg hover:bg-google-green/10 transition-colors">
                    <Check className="h-5 w-5 text-google-green flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Conclusão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-8 bg-gmb-light-green rounded-2xl border border-google-green/30"
          >
            <p className="text-xl text-slate-700">
              Não é sobre ter <strong className="text-google-green">"um CRM"</strong>. É sobre ter o sistema que{" "}
              <strong className="text-google-green">entende exatamente o que você faz</strong>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO NOSSA EXPERIÊNCIA (SUBSTITUINDO DEPOIMENTOS) ===== */}
      <section className="py-24 px-4 relative section-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <GMBBadge variant="green">
              <Award className="h-4 w-4" />
              Experiência Real
            </GMBBadge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display mt-6">
              Construído Por Quem Vive{" "}
              <span className="gradient-google-text">Google Meu Negócio</span>{" "}
              Todos os Dias
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Não é teoria de programadores. É experiência real empacotada em sistema.
            </p>
          </motion.div>

          {/* 4 Stats Cards - 2x2 grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: MapPin, value: 500, suffix: "+", label: "Perfis GMB Gerenciados", description: "Na nossa própria agência. Cada funcionalidade nasceu de uma dor real." },
              { icon: Calendar, value: 4, suffix: " anos", label: "Vendendo GMB Diariamente", description: "Mais de 1.500 reuniões de vendas. Sabemos cada objeção, cada dor." },
              { icon: Users, value: 350, suffix: "+", label: "Alunos Formados", description: "Na metodologia Alcateia. Documentamos cada desafio operacional." },
              { icon: CheckCircle2, value: 47, suffix: "", label: "Pontos de Otimização", description: "Checklist testado em centenas de perfis. Nada foi inventado." }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border-2 border-border p-6 text-center hover:border-google-green/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-xl bg-gmb-light-green flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-google-green" />
                </div>
                <div className="text-4xl font-bold text-google-green mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-lg font-semibold text-slate-800 mb-2">{stat.label}</div>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Founder Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gmb-light-green to-white rounded-2xl border border-google-green/30 p-8 md:p-12"
          >
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2 order-2 md:order-1">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">João Lobo</h3>
                <p className="text-google-green font-semibold mb-6">Fundador & Especialista em Google Meu Negócio</p>
                <p className="text-lg text-slate-600 italic leading-relaxed">
                  "Criei o G-Rank porque sentia na pele a dor de gerenciar dezenas de perfis sem um sistema adequado. 
                  Cada funcionalidade aqui resolveu um problema real que enfrentei na operação da minha agência."
                </p>
              </div>
              <div className="flex justify-center order-1 md:order-2">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-google-green to-google-green-dark flex items-center justify-center text-white text-5xl md:text-6xl font-bold border-4 border-white shadow-xl">
                  JL
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <GMBWaveDivider position="bottom" color="gray" />
      </section>

      {/* ===== SEÇÃO PREÇOS ===== */}
      <section id="precos" className="py-12 sm:py-16 md:py-20 lg:py-24 px-3 sm:px-4 relative section-gmb-gradient">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 font-display px-2">
              Quanto Custa Ter{" "}
              <span className="gradient-google-text">Estrutura na Sua Operação?</span>
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base px-2">
              O GRank não é uma despesa. É infraestrutura de crescimento.
              Se você perde 1 contrato por mês por desorganização — o sistema já se paga.
            </p>

            {/* Toggle Anual/Mensal */}
            <div className="inline-flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 rounded-full bg-white border-2 border-google-green/20 shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all btn-press ${
                  !isAnnual 
                    ? 'bg-google-green text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 btn-press ${
                  isAnnual 
                    ? 'bg-google-green text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Anual
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-google-yellow/20 text-google-yellow text-[10px] sm:text-xs font-bold">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Grid de planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative flex flex-col min-h-[520px] ${plan.popular ? 'md:scale-105 z-10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-google-green text-xs font-semibold text-white z-20 shadow-lg">
                    ⭐ Mais Popular
                  </div>
                )}

                <div className={`bg-white rounded-2xl border-2 p-6 flex-1 flex flex-col transition-all duration-300 ${
                  plan.popular 
                    ? 'border-google-green shadow-xl shadow-google-green/10 bg-gradient-to-b from-gmb-light-green/50 to-white' 
                    : 'border-border hover:border-google-green/50 hover:shadow-md'
                }`}>
                  {/* Top colored border */}
                  <div className={`absolute top-0 left-6 right-6 h-1 rounded-b-full ${
                    plan.name === "Starter" ? "bg-google-green" :
                    plan.name === "Pro" ? "bg-google-green" : "bg-google-blue"
                  }`} />

                  <div className="text-center mb-4 pt-2">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-2xl">{plan.emoji}</span>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-bold text-google-green">
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isAnnual && (
                      <p className="text-sm text-google-green mt-1 font-medium">
                        Economia de R${(plan.monthlyPrice - plan.annualPrice) * 12}/ano
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-3 flex-1">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-google-green flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map(limitation => (
                      <li key={limitation} className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground/70">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`w-full mt-auto ${
                      plan.popular 
                        ? 'bg-google-green hover:bg-google-green-dark text-white shadow-lg shadow-google-green/30' 
                        : 'bg-white border-2 border-google-green text-google-green hover:bg-google-green hover:text-white'
                    }`}
                  >
                    <Link to="/register">{plan.cta}</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <GMBWaveDivider position="bottom" color="green" />
      </section>

      {/* ===== SEÇÃO CTA FINAL ===== */}
      <section className="py-24 px-4 relative overflow-hidden bg-google-green">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIiBmaWxsPSIjZmZmIi8+PC9zdmc+')]" />
        </div>
        
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-display text-white">
              Você Vai Continuar{" "}
              <span className="text-google-yellow">Preso na Operação</span>{" "}
              ou Vai{" "}
              <span className="underline decoration-4 decoration-white/50">Escalar com Estrutura?</span>
            </h2>
            
            <p className="text-white/80 mb-6 text-lg">
              Se você ainda está organizando perfis GMB em planilhas e delegando por WhatsApp...
              <br />
              <strong className="text-white">Sua agência está sendo engolida pela falta de sistema.</strong>
            </p>
            
            <p className="text-white italic mb-10 text-lg font-medium">
              "O tempo que você perde sem estrutura é o tempo que seus concorrentes ganham com sistema."
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button 
                size="lg" 
                asChild 
                className="bg-white text-google-green hover:bg-gray-100 border-0 shadow-xl text-lg px-10 py-7 h-auto font-bold"
              >
                <Link to="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  COMEÇAR TESTE GRÁTIS AGORA
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-7 h-auto bg-transparent"
              >
                <a href="#demo">Agendar Demonstração</a>
              </Button>
            </div>

            <p className="text-sm text-white/70 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-white" />
                14 dias grátis
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-white" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-white" />
                Suporte em português
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO FAQ ===== */}
      <section className="py-20 px-4 relative section-white">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Perguntas{" "}
              <span className="gradient-google-text">Frequentes</span>
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <AccordionItem 
                  value={`item-${i}`} 
                  className="bg-white rounded-xl border-2 border-border hover:border-google-green/30 transition-colors px-6"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4 text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 bg-gmb-dark text-white safe-area-inset-bottom">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="sm:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={grankLogoDark} alt="GRank CRM" className="h-7 sm:h-8 w-auto brightness-0 invert" />
                <span className="font-bold text-lg sm:text-xl text-google-green">GRank CRM</span>
              </Link>
              <p className="text-gray-400 mb-4 text-sm sm:text-base">
                Gestão Profissional para Agências de Google Meu Negócio e SEO Local
              </p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-google-red" />
                <span className="text-xs sm:text-sm text-gray-400">
                  Especializado em Google Meu Negócio
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-white">Links Rápidos</h4>
              <ul className="space-y-2">
                {navLinks.map(link => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-xs sm:text-sm text-gray-400 hover:text-google-green transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-white">Contato</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  contato@grank.com.br
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  WhatsApp: (XX) XXXXX-XXXX
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} GRank CRM. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
