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
import joaoLoboPhoto from "@/assets/joao-lobo.jpg";
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
      description: "Organize leads em estágios claros com kanban. Histórico completo, temperatura de interesse e próximas ações programadas."
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
      title: "Checklist de 47 Pontos",
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
      name: "Lobinho",
      emoji: "🐺",
      tagline: "Para quem está começando",
      monthlyPrice: 67,
      annualPrice: 54,
      color: "google-green",
      features: [
        "1 usuário (admin)",
        "Até 200 leads",
        "Até 30 clientes em otimização",
        "Até 30 clientes recorrentes",
        "Checklist completo de otimização",
        "Funil visual de leads",
        "Propostas + Contratos digitais",
        "Agentes IA (SEO, Suspensões, Raio-X)",
        "Dashboard e relatórios",
        "Suporte por e-mail"
      ],
      limitations: [],
      cta: "Começar Agora",
      popular: false
    },
    {
      name: "Lobão",
      emoji: "🐺🔥",
      tagline: "Para equipes que querem crescer",
      monthlyPrice: 97,
      annualPrice: 78,
      color: "google-green",
      features: [
        "3 usuários (1 admin + 2 equipe)",
        "Até 1.000 leads",
        "Até 300 clientes em otimização",
        "Até 300 clientes recorrentes",
        "Tudo do Lobinho +",
        "Controle de comissões",
        "Logs e auditoria completos",
        "Suporte prioritário",
        "Suporte por WhatsApp",
        "Acesso antecipado a novidades"
      ],
      limitations: [],
      cta: "Escolher Lobão",
      popular: true
    }
  ];

  // Removed testimonials - we don't have real clients yet

  const faqs = [
    {
      question: "Preciso ser expert em tecnologia para usar?",
      answer: "Não. O GBRank CRM foi feito para ser simples. Se você usa WhatsApp, vai usar o GBRank CRM tranquilamente."
    },
    {
      question: "Funciona especificamente para Google Meu Negócio?",
      answer: "Sim! O GBRank foi construído especificamente para agências que trabalham com Google Meu Negócio, SEO local e otimização de perfis Google."
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
            <img src={grankLogoDark} alt="GBRank CRM" className="h-7 sm:h-8 w-auto" />
            <span className="font-bold text-lg sm:text-xl text-google-green">GBRank CRM</span>
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
      <section className="relative flex items-center justify-center pt-20 sm:pt-24 pb-4 px-3 sm:px-4 section-gmb-hero overflow-hidden">
        {/* Background gradients - hidden on mobile */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-google-green/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-google-blue/8 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto text-center relative z-10 px-2 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Google Badge - Compact */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-google-green/10 border border-google-green/30 mb-3 sm:mb-5"
            >
              <span className="text-[10px] sm:text-sm text-google-green font-semibold">
                🗺️ CRM #1 para Google Meu Negócio
              </span>
            </motion.div>
            
            {/* Headline Principal - Mobile Optimized */}
            <h1 className="text-[22px] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-[1.2] font-display px-1">
              <span className="text-foreground">Escale sua Agência de</span>
              <br />
              <span className="gradient-google-text">Google Meu Negócio</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-5 leading-relaxed px-2">
              Da prospecção à execução recorrente. O único sistema que gerencia <strong className="text-foreground">todo o ciclo operacional</strong> de perfis Google.
            </p>

            {/* CTA Principal - Only Testar Grátis */}
            <div className="flex justify-center mb-3 sm:mb-4 px-2">
              <Button 
                size="lg" 
                asChild 
                className="bg-google-green hover:bg-google-green-dark text-white border-0 shadow-xl shadow-google-green/30 btn-pulse btn-press text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 h-auto min-h-[44px] sm:min-h-[52px] w-full sm:w-auto max-w-xs sm:max-w-none"
              >
                <Link to="/register">
                  <Zap className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                  TESTAR GRÁTIS POR 14 DIAS
                </Link>
              </Button>
            </div>
            
            <p className="text-[10px] sm:text-sm text-muted-foreground flex items-center justify-center gap-3 sm:gap-4 flex-wrap px-2">
              <span className="flex items-center gap-1">
                <Check className="h-3 sm:h-4 w-3 sm:w-4 text-google-green" />
                14 dias grátis
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 sm:h-4 w-3 sm:w-4 text-google-green" />
                Sem cartão
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO BENEFÍCIOS ===== */}
      <section className="py-4 sm:py-6 px-3 sm:px-4 relative section-gmb-light">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 max-w-5xl mx-auto">
            <GMBStatsCard 
              icon={MapPin} 
              value="Feito pra GMB" 
              label="Único CRM 100% focado em Google Meu Negócio"
              color="green" 
              delay={0}
            />
            <GMBStatsCard 
              icon={ListChecks} 
              value="47 Pontos" 
              label="Checklist completo de otimização de perfis" 
              color="blue" 
              delay={0.1}
            />
            <GMBStatsCard 
              icon={Rocket} 
              value="Tudo em 1" 
              label="Leads, execução, recorrência e comissões" 
              color="red" 
              delay={0.2}
            />
            <GMBStatsCard 
              icon={UserCheck} 
              value="Controle" 
              label="Veja em tempo real o que sua equipe está fazendo" 
              color="yellow" 
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO PROBLEMA ===== */}
      <section className="py-6 sm:py-8 px-3 sm:px-4 relative section-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 font-display px-2">
              Você Está <span className="text-google-red">Preso na Operação?</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
              Identifique se esses sintomas estão te impedindo de escalar sua agência:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
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
            className="text-center mt-4 sm:mt-6 text-sm sm:text-base max-w-xl mx-auto px-4"
          >
            <span className="text-google-green font-medium italic">
              "Escalar sem um sistema especializado é multiplicar problemas."
            </span>
          </motion.p>
        </div>
      </section>

      {/* ===== SEÇÃO SOLUÇÃO ===== */}
      <section id="como-funciona" className="py-6 sm:py-8 px-3 sm:px-4 relative section-gmb-light">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8"
          >
            <GMBBadge variant="green">
              <Sparkles className="h-4 w-4" />
              A Solução
            </GMBBadge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-display mt-4">
              O GBRank CRM Gerencia{" "}
              <span className="gradient-google-text">Todo o Ciclo Operacional</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-3">
              Da primeira conversa com o lead até a execução recorrente mensal.
              <br />Tudo em um só sistema. Tudo sob controle.
            </p>
          </motion.div>

          <div id="demo">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO FUNCIONALIDADES ===== */}
      <section id="funcionalidades" className="py-6 sm:py-8 px-3 sm:px-4 relative section-white">
        <div className="container mx-auto">
          {/* Prospecção & Venda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-google-blue/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-google-blue" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">🎯 PROSPECÇÃO & VENDA</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
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
            className="mb-6 p-4 sm:p-6 rounded-2xl section-gmb-light border border-google-green/20"
          >
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-google-green/15 flex items-center justify-center">
                  <ListChecks className="h-4 w-4 text-google-green" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">⚙️ EXECUÇÃO OPERACIONAL</h3>
              </div>
              <GMBBadge variant="green">
                <Star className="h-3 w-3" />
                DIFERENCIAL
              </GMBBadge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
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

            <div className="mt-4 flex justify-center">
              <GMBChecklistPreview className="max-w-xs" />
            </div>
          </motion.div>

          {/* Gestão & Inteligência */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-status-purple/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-status-purple" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">📊 GESTÃO & INTELIGÊNCIA</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
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

      {/* ===== SEÇÃO DIFERENCIAL COMPETITIVO ===== */}
      <section className="py-6 sm:py-8 px-3 sm:px-4 relative bg-gradient-to-b from-gmb-light-green to-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5 sm:mb-6"
          >
            <GMBBadge variant="green">
              <Star className="h-3 w-3" />
              Comparação
            </GMBBadge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-display mt-3">
              Por Que o GBRank é{" "}
              <span className="gradient-google-text">Diferente?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Somos especializados em Google Meu Negócio.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-3 sm:gap-4 mb-4">
            {/* GBRank CRM - PRIMEIRO */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-2xl border-2 border-google-green p-4 md:p-6 shadow-lg shadow-google-green/10 relative order-1"
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-gradient-to-r from-google-green to-google-green-dark text-white text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap">
                  Especializado
                </span>
              </div>
              <div className="text-center mb-4 md:mb-6 pt-2">
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">✅</div>
                <h3 className="text-base md:text-xl font-bold text-slate-800">GBRank CRM</h3>
              </div>
              <ul className="space-y-2 md:space-y-3">
                {[
                  "100% focado em Google Meu Negócio",
                  "Pronto para usar em 15 minutos",
                  "Construído por quem vende há 4 anos",
                  "Checklist de 47 pontos de otimização",
                  "Gestão de tarefas automáticas",
                  "Contratos com cláusulas específicas"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 bg-gmb-light-green rounded-lg">
                    <Check className="h-4 w-4 text-google-green flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CRMs Genéricos - SEGUNDO */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-2xl border-2 border-border p-4 md:p-6 shadow-sm order-2"
            >
              <div className="text-center mb-4 md:mb-6">
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">❌</div>
                <h3 className="text-base md:text-xl font-bold text-slate-800">Outros CRMs</h3>
              </div>
              <ul className="space-y-2 md:space-y-3">
                {[
                  "Feitos para qualquer nicho",
                  "Você precisa configurar tudo do zero",
                  "Não entendem Google Meu Negócio",
                  "Sem checklist de otimização",
                  "Não controlam tarefas recorrentes",
                  "Contratos genéricos"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                    <X className="h-4 w-4 text-google-red flex-shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Conclusão - Menor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-3 sm:p-4 bg-gmb-light-green rounded-lg border border-google-green/30"
          >
            <p className="text-sm md:text-base text-slate-700">
              Não é sobre ter <strong className="text-google-green">"um CRM"</strong>. É sobre ter o sistema <strong className="text-google-green">feito para sua operação</strong>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO NOSSA EXPERIÊNCIA ===== */}
      <section className="py-6 sm:py-8 px-3 sm:px-4 relative section-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5 sm:mb-6"
          >
            <GMBBadge variant="green">
              <Award className="h-3 w-3" />
              Experiência Real
            </GMBBadge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-display mt-3">
              Construído Por Quem Vive{" "}
              <span className="gradient-google-text">Google Meu Negócio</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Experiência real empacotada em sistema.
            </p>
          </motion.div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {[
              { icon: MapPin, value: 500, suffix: "+", label: "Perfis Gerenciados", description: "Na nossa própria agência." },
              { icon: Calendar, value: 4, suffix: " anos", label: "Experiência", description: "Vendendo Google Meu Negócio." },
              { icon: Users, value: 350, suffix: "+", label: "Alunos Formados", description: "Na metodologia Alcateia." },
              { icon: CheckCircle2, value: 47, suffix: "", label: "Pontos de Otimização", description: "Checklist testado." }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border-2 border-border p-3 md:p-5 text-center hover:border-google-green/50 transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gmb-light-green flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-google-green" />
                </div>
                <div className="text-xl md:text-3xl font-bold text-google-green mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs md:text-sm font-semibold text-slate-800">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Founder Card - Com foto real */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gmb-light-green to-white rounded-xl md:rounded-2xl border border-google-green/30 p-5 md:p-8"
          >
            <div className="grid md:grid-cols-3 gap-5 md:gap-8 items-center">
              <div className="md:col-span-2 order-2 md:order-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">João Lobo</h3>
                <p className="text-google-green font-semibold text-sm mb-3 md:mb-4">Fundador & Especialista em Google Meu Negócio</p>
                <p className="text-sm md:text-base text-slate-600 italic leading-relaxed">
                  "Criei o GBRank porque sentia na pele a dor de gerenciar dezenas de perfis sem um sistema adequado. 
                  Cada funcionalidade aqui resolveu um problema real da minha operação."
                </p>
              </div>
              <div className="flex justify-center order-1 md:order-2">
                <img 
                  src={joaoLoboPhoto}
                  alt="João Lobo - Fundador GBRank CRM" 
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-google-green shadow-xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO PREÇOS ===== */}
      <section id="precos" className="py-6 sm:py-8 px-3 sm:px-4 relative section-gmb-gradient">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4 sm:mb-6"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 font-display px-2">
              Quanto Custa Ter{" "}
              <span className="gradient-google-text">Estrutura?</span>
            </h2>
            <p className="text-muted-foreground mb-3 sm:mb-4 max-w-xl mx-auto text-xs sm:text-sm px-2">
              1 contrato fechado já paga o ano todo do sistema.
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
      </section>

      {/* ===== SEÇÃO CTA FINAL ===== */}
      <section className="py-8 sm:py-10 px-3 sm:px-4 relative overflow-hidden bg-google-green">
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
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 font-display text-white">
              Vai Continuar <span className="text-white/90">Preso na Operação</span> ou <span className="text-google-yellow font-extrabold" style={{ textShadow: '0 2px 12px rgba(255,255,0,0.4)' }}>Escalar?</span>
            </h2>
            
            <p className="text-white/80 mb-4 text-sm sm:text-base">
              <strong className="text-white">Sua agência precisa de sistema, não de mais trabalho.</strong>
            </p>

            <div className="flex justify-center mb-4">
              <Button 
                size="lg" 
                asChild 
                className="bg-white text-google-green hover:bg-gray-100 border-0 shadow-xl text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-5 h-auto font-bold w-full sm:w-auto max-w-xs"
              >
                <Link to="/register">
                  <Zap className="mr-2 h-4 w-4" />
                  TESTAR GRÁTIS AGORA
                </Link>
              </Button>
            </div>

            <p className="text-xs text-white/70 flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-white" />
                14 dias grátis
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-white" />
                Sem cartão
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO FAQ ===== */}
      <section className="py-6 sm:py-8 px-3 sm:px-4 relative section-white">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-display">
              Perguntas <span className="gradient-google-text">Frequentes</span>
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-2">
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
                  className="bg-white rounded-lg border border-border hover:border-google-green/30 transition-colors px-4"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-3 text-foreground text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-3 text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-6 sm:py-8 px-3 sm:px-4 bg-gmb-dark text-white safe-area-inset-bottom">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="sm:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={grankLogoDark} alt="GBRank CRM" className="h-7 sm:h-8 w-auto brightness-0 invert" />
                <span className="font-bold text-lg sm:text-xl text-google-green">GBRank CRM</span>
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
                  contato@gbrank.com.br
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  WhatsApp: (XX) XXXXX-XXXX
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} GBRank CRM. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
