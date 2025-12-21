import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, FileText, Bell, TrendingUp, Shield, Check, X, ArrowRight, Sparkles, Zap, Calculator, Clock, MessageCircle, ChevronDown, Menu, X as CloseIcon, CreditCard, UserCheck, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import grankLogo from "@/assets/grank-logo.png";
import { AnimatedCounter, FloatingParticles, ScrollProgress, InteractiveDemo, HeroVideo, FeatureCard, ComparisonTable, SectionDivider } from "@/components/landing";
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
  const features = [{
    icon: Users,
    title: "Funil de Leads Visual",
    description: "Organize seus leads em estágios claros: Novo Lead → Negociação → Contrato → Fechado. Você vê tudo de forma visual e simples."
  }, {
    icon: FileText,
    title: "Propostas Automáticas",
    description: "Gere propostas profissionais em 2 cliques. O sistema cria propostas com sua marca, envia por link rastreável e te avisa quando o cliente visualiza."
  }, {
    icon: Bell,
    title: "Dashboard com Alertas",
    description: "\"3 clientes sem atividade há 15 dias\" — \"2 contratos vencem esta semana\" — Você age antes do problema acontecer."
  }, {
    icon: Shield,
    title: "Contratos Inteligentes",
    description: "Contratos com IA + Assinatura Digital. Escolha o modelo, preencha os dados e o sistema gera um contrato completo."
  }, {
    icon: TrendingUp,
    title: "Gestão de Equipe",
    description: "Cada pessoa vê só o que precisa. Defina permissões: Vendedor, Operador, Gestor, Admin. Você delega com segurança."
  }, {
    icon: Calculator,
    title: "Comissões Automáticas",
    description: "Fim das planilhas de comissão. O sistema calcula automaticamente com base nas suas regras. Transparente para todo mundo."
  }];
  const plans = [{
    name: "Starter",
    emoji: "🟢",
    tagline: "Feito pro lobo solo",
    monthlyPrice: 67,
    annualPrice: 54,
    features: ["Até 15 clientes ativos", "Até 200 leads", "Até 2 membros da equipe", "Funil e tarefas básicas", "Relatórios por agência", "Dashboard principal", "Suporte por e-mail"],
    limitations: ["Sem automações", "Sem controle de comissão", "Sem exportação de dados"],
    cta: "Começar Grátis",
    popular: false
  }, {
    name: "Pro",
    emoji: "🔵",
    tagline: "Feito pra quem vive disso",
    monthlyPrice: 127,
    annualPrice: 102,
    features: ["Até 50 clientes ativos", "Até 1.000 leads", "Até 5 membros", "Funil e tarefas avançadas", "Automações por status", "Relatórios por cliente", "Controle de comissões", "Logs e auditoria", "Suporte prioritário"],
    limitations: [],
    cta: "Testar Grátis",
    popular: true
  }, {
    name: "Master",
    emoji: "🟣",
    tagline: "Feito pro lobo alfa de matilha",
    monthlyPrice: 197,
    annualPrice: 158,
    features: ["Até 150 clientes ativos", "Até 5.000 leads", "Até 15 membros", "Tudo do Pro +", "Dashboard financeiro", "Exportação de dados", "Suporte por WhatsApp", "Acesso antecipado a novos recursos"],
    limitations: [],
    cta: "Testar Grátis",
    popular: false
  }];
  const testimonials = [{
    quote: "Antes eu passava 2 horas por dia organizando tarefas da equipe. Agora o sistema faz isso automaticamente. Eu só acompanho.",
    author: "Ricardo Santos",
    role: "Agência de São Paulo, 45 clientes ativos"
  }, {
    quote: "O checklist de otimização mudou tudo. Agora qualquer pessoa consegue entregar com qualidade. Eu finalmente consigo delegar.",
    author: "Mariana Costa",
    role: "Consultora de Belo Horizonte, 28 clientes"
  }, {
    quote: "Na hora de renovar contrato, eu mostro o relatório automático com tudo que foi feito. O cliente nem questiona.",
    author: "Fernanda Lima",
    role: "Gestora de Marketing Local, Curitiba"
  }];
  const faqs = [{
    question: "Preciso ser expert em tecnologia para usar?",
    answer: "Não. O G-Rank foi feito para ser simples. Se você usa WhatsApp, vai usar o G-Rank tranquilamente."
  }, {
    question: "Funciona para agências pequenas?",
    answer: "Funciona melhor para quem tem 5+ clientes ativos. Se você está começando, pode não fazer sentido ainda."
  }, {
    question: "E se eu não gostar?",
    answer: "Sem problema. Você testa 14 dias grátis e cancela se não fizer sentido. Zero burocracia."
  }, {
    question: "Posso importar meus clientes atuais?",
    answer: "Sim. Você consegue importar seus dados de planilhas ou outros sistemas."
  }, {
    question: "Tem suporte em português?",
    answer: "Sim. Suporte completo em português, feito por quem entende de Google Meu Negócio."
  }, {
    question: "Qual o investimento mensal?",
    answer: "Os valores variam de acordo com o tamanho da sua operação (número de usuários, clientes, funcionalidades). Veja os planos acima ou entre em contato para um plano personalizado."
  }];
  const navLinks = [{
    label: "Como Funciona",
    href: "#como-funciona"
  }, {
    label: "Funcionalidades",
    href: "#funcionalidades"
  }, {
    label: "Preços",
    href: "#precos"
  }];
  return <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgress />
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={grankLogo} alt="G-Rank" className="h-8 w-auto" />
            <span className="font-bold text-xl gradient-text">G-Rank</span>
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => <a key={link.label} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </a>)}
          </nav>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="gradient-primary text-primary-foreground border-0 neon-glow">
              <Link to="/register">
                Testar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-foreground">
              {mobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -10
      }} className="md:hidden bg-card border-t border-border px-4 py-4">
            {navLinks.map(link => <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block py-3 text-foreground hover:text-primary transition-colors">
                {link.label}
              </a>)}
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-muted-foreground">
              Entrar
            </Link>
          </motion.div>}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="min-h-screen relative flex items-center justify-center pt-24 pb-32 px-4 section-white overflow-hidden">
        <FloatingParticles />
        
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-teal/8 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }}>
            {/* Badge */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.2
          }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">A Plataforma Operacional Completa para Google Meu Negócio</span>
            </motion.div>
            
            {/* Headline Principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-display">
              <span className="text-foreground">
                Pare de Fazer Tudo Sozinho.
              </span>
              <br />
              <span className="gradient-title-text">
                Delegue, Controle e Escale
              </span>
              <br />
              <span className="text-foreground">
                sua Agência de GMB.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Da prospecção à execução recorrente. Da proposta ao checklist de otimização.
              <br className="hidden sm:block" />
              O único sistema que gerencia <strong className="text-foreground">todo o ciclo operacional</strong> da sua agência em um só lugar.
              <br className="hidden sm:block" />
              <span className="text-primary font-medium">Não é só um CRM. É a plataforma que te liberta da operação.</span>
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button size="lg" asChild className="gradient-primary text-primary-foreground border-0 shadow-xl btn-pulse btn-press text-lg px-8 py-6 h-auto min-h-[56px]">
                <Link to="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  TESTE GRÁTIS POR 14 DIAS
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-border hover:bg-muted hover:border-primary/30 text-lg px-8 py-6 h-auto min-h-[56px] btn-press">
                <a href="#demo">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Agendar Demonstração
                </a>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                Configure em 15 minutos
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                Cancele quando quiser
              </span>
            </p>
          </motion.div>

          {/* Hero Video/Demo */}
          <motion.div initial={{
          opacity: 0,
          y: 50
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5,
          duration: 0.8
        }} className="mt-16">
            <HeroVideo />
          </motion.div>
        </div>

        {/* Wave divider to next section */}
        <SectionDivider variant="wave" fill="fill-[#F9FAFB]" className="bottom-0" />
      </section>

      {/* ===== SEÇÃO PROBLEMA ===== */}
      <section className="py-24 px-4 relative section-gray pattern-dots">
        <div className="container mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-display">
              Você Está{" "}
              <span className="text-status-danger">Preso na Operação?</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Identifique se esses sintomas estão te impedindo de escalar:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[{
            icon: Users,
            title: "😰 Você Faz Tudo Sozinho",
            description: "Prospecta, vende, otimiza perfis, cria posts, responde avaliações... E quando tenta delegar, vira bagunça porque não tem processo claro.",
            color: "border-status-danger/30"
          }, {
            icon: FileText,
            title: "📝 Otimização Sem Padrão",
            description: "Cada operador faz do seu jeito. Um esquece categorias, outro pula atributos. Você não tem como garantir que o trabalho saiu completo.",
            color: "border-status-info/30"
          }, {
            icon: Clock,
            title: "🔄 Recorrentes Sem Controle",
            description: "Você não sabe quais clientes tiveram posts essa semana, quais precisam de avaliações respondidas ou quais estão sem atividade há 15 dias.",
            color: "border-status-warning/30"
          }, {
            icon: Target,
            title: "💸 Trabalho Invisível",
            description: "Você trabalha muito, mas o cliente não vê. Na hora de renovar, ele pergunta: \"O que vocês fizeram mesmo?\"",
            color: "border-status-purple/30"
          }].map((problem, i) => <motion.div key={problem.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: i * 0.1
          }} className={`bg-white rounded-2xl border-2 ${problem.color} p-6 card-3d shadow-sm`}>
                <h3 className="text-lg font-semibold mb-3">{problem.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{problem.description}</p>
              </motion.div>)}
          </div>

          <motion.p initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} viewport={{
          once: true
        }} className="text-center mt-12 text-lg max-w-2xl mx-auto">
            <span className="text-primary font-medium italic">
              "Se você não consegue tirar férias sem que tudo desmorone, sua agência não tem estrutura — tem você."
            </span>
          </motion.p>
        </div>

        {/* Diagonal divider */}
        <SectionDivider variant="diagonal" fill="fill-white" className="bottom-0" />
      </section>

      {/* ===== SEÇÃO SOLUÇÃO ===== */}
      <section id="como-funciona" className="py-24 px-4 relative section-white shadow-inset-light">
        <div className="container mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">A Solução</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-display">
              O G-Rank Gerencia{" "}
              <span className="gradient-title-text">Todo o Ciclo Operacional</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-4">
              Da primeira conversa com o lead até a execução recorrente mensal.
              <br />Tudo em um só sistema. Tudo sob controle.
            </p>
            <p className="text-foreground max-w-2xl mx-auto">
              Não é só sobre vender mais. É sobre <strong>estruturar a operação</strong> para que você possa delegar com segurança, acompanhar com clareza e escalar sem colapsar.
            </p>
          </motion.div>

          <div id="demo">
            <InteractiveDemo />
          </div>
        </div>

        {/* Wave divider */}
        <SectionDivider variant="curve" fill="fill-[#F2F5F7]" className="bottom-0" />
      </section>

      {/* ===== SEÇÃO FUNCIONALIDADES ===== */}
      <section id="funcionalidades" className="py-24 px-4 relative section-gray-alt">
        <div className="container mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Tudo Que Sua Agência{" "}
              <span className="gradient-title-text">Precisa</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas especializadas para otimizar cada etapa do seu negócio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} delay={index * 0.1} />)}
          </div>
        </div>

        {/* Arrow divider */}
        <SectionDivider variant="arrow" fill="fill-white" className="bottom-0" />
      </section>

      {/* ===== SEÇÃO ANTES VS DEPOIS ===== */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Como Será Seu Dia{" "}
              <span className="gradient-text">Depois do G-Rank</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* ANTES */}
            <motion.div initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} className="glass-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-status-danger/20 flex items-center justify-center">
                  <X className="h-4 w-4 text-status-danger" />
                </div>
                <h3 className="text-xl font-bold text-status-danger">ANTES</h3>
              </div>
              <ul className="space-y-4">
                {["Manhã perdida procurando informações", "Propostas que demoram dias", "Contratos esquecidos", "Insônia pensando no que esqueceu"].map(item => <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <X className="h-5 w-5 text-status-danger flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
            </motion.div>

            {/* DEPOIS */}
            <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} className="glass-card p-8 border-primary/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">DEPOIS</h3>
              </div>
              <ul className="space-y-4">
                {["Manhã produtiva com tarefas organizadas", "Propostas geradas em minutos", "Contratos rastreados automaticamente", "Tranquilidade sabendo que nada foi esquecido"].map(item => <li key={item} className="flex items-start gap-3 text-foreground">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO COMPARAÇÃO ===== */}
      <section className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Por Que o G-Rank é{" "}
              <span className="gradient-text">Diferente</span>
            </h2>
          </motion.div>

          <ComparisonTable />
        </div>
      </section>

      {/* ===== SEÇÃO AUTORIDADE ===== */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-6">
              <Award className="h-4 w-4 text-secondary" />
              <span className="text-sm text-secondary font-medium">Feito por quem faz</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">
              Construído Por Quem Vive{" "}
              <span className="gradient-text">Google Meu Negócio</span>{" "}
              no Campo de Batalha
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[{
              value: 500,
              suffix: "+",
              label: "Clientes gerenciados na nossa própria agência"
            }, {
              value: 4,
              suffix: " anos",
              label: "De experiência em SEO local e Google Perfil"
            }, {
              value: 1500,
              suffix: "+",
              label: "Reuniões de vendas e otimizações documentadas"
            }].map((stat, i) => <motion.div key={stat.label} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: i * 0.1
            }} className="glass-card p-6">
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>)}
            </div>
            
            
          </motion.div>
        </div>
      </section>


      {/* ===== SEÇÃO PARA QUEM É ===== */}
      <section className="py-20 px-4 relative bg-gradient-to-b from-primary/5 via-background to-muted/20">
        {/* Decorative top transition */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-muted/30 to-transparent -translate-y-full pointer-events-none" />
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              O G-Rank é{" "}
              <span className="gradient-text">Para Você Se...</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} className="glass-card p-6 border-primary/30">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                É Para Você Se...
              </h3>
              <ul className="space-y-3">
                {["Você vende Google Meu Negócio (ou quer vender)", "Tem 5+ clientes ativos (ou quer ter)", "Quer delegar a operação sem perder controle", "Precisa de processos claros para a equipe seguir", "Quer mostrar valor de forma organizada aos clientes", "Busca previsibilidade na receita recorrente", "Deseja escalar sem virar refém da operação"].map(item => <li key={item} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>)}
              </ul>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} className="glass-card p-6">
              <h3 className="text-xl font-bold text-muted-foreground mb-4 flex items-center gap-2">
                <X className="h-5 w-5" />
                Não É Para Você Se...
              </h3>
              <ul className="space-y-3">
                {["Você está começando do zero (menos de 3 clientes)", "Prefere trabalhar sozinho e não quer time", "Não acredita em processos estruturados", "Busca \"resultado mágico\" sem execução real", "Não está disposto a investir em infraestrutura"].map(item => <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>)}
              </ul>
            </motion.div>
          </div>
          
          <motion.p initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} viewport={{
          once: true
        }} className="text-center mt-10 text-lg">
            <span className="text-primary font-medium">
              "Se você quer crescer com estrutura, o G-Rank é o próximo passo."
            </span>
          </motion.p>
        </div>
      </section>

      {/* ===== SEÇÃO URGÊNCIA ===== */}
      <section className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-status-warning/10 border border-status-warning/30 mb-6">
              <Sparkles className="h-4 w-4 text-status-warning" />
              <span className="text-sm text-status-warning font-medium">Vagas Limitadas</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">
              Estamos Selecionando as{" "}
              <span className="gradient-text">Primeiras 100 Agências</span>
            </h2>
            
            <p className="text-muted-foreground mb-8 text-lg">
              Queremos construir o melhor CRM do mercado de marketing local. E isso só acontece com as pessoas certas dando feedback real.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 text-left">
              {["Acesso antecipado a novas funcionalidades", "Acompanhamento direto com nosso time", "Participação ativa nas próximas atualizações"].map((benefit, i) => <motion.div key={benefit} initial={{
              opacity: 0,
              y: 10
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: i * 0.1
            }} className="flex items-start gap-2 p-4 glass-card">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{benefit}</span>
                </motion.div>)}
            </div>
            
            <p className="text-sm text-muted-foreground mt-8 italic">
              Isso não é sobre escassez artificial. É sobre construir com quem está comprometido.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO PREÇOS ===== */}
      <section id="precos" className="py-24 px-4 relative section-white">
        <div className="container mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Quanto Custa Ter{" "}
              <span className="gradient-title-text">Estrutura na Sua Operação?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              O G-Rank não é uma despesa. É infraestrutura de crescimento.
              Se você perde 1 contrato por mês por desorganização — o sistema já se paga.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-muted border border-border">
              <button onClick={() => setIsAnnual(false)} className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all btn-press ${!isAnnual ? 'gradient-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                Mensal
              </button>
              <button onClick={() => setIsAnnual(true)} className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 btn-press ${isAnnual ? 'gradient-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                Anual
                <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success text-xs">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => <motion.div key={plan.name} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.4,
            delay: index * 0.1
          }} className={`relative flex flex-col min-h-[520px] ${plan.popular ? 'md:scale-105 z-10' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full gradient-primary text-xs font-semibold text-primary-foreground z-20 badge-pulse">
                    Mais Popular
                  </div>}

                <div className={`bg-white rounded-2xl border p-6 flex-1 flex flex-col transition-all duration-300 ${plan.popular ? 'border-primary shadow-lg card-hover-glow' : 'border-border hover:border-primary/30 hover:shadow-md'}`}>
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-2xl">{plan.emoji}</span>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-bold">
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {isAnnual && <p className="text-sm text-status-success mt-1">
                        Economia de R${(plan.monthlyPrice - plan.annualPrice) * 12}/ano
                      </p>}
                  </div>

                  <ul className="space-y-2 mb-3 flex-1">
                    {plan.features.map(feature => <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>)}
                  </ul>

                  {plan.limitations.length > 0 && <ul className="space-y-2 mb-4 pt-3 border-t border-border">
                      {plan.limitations.map(limitation => <li key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {limitation}
                        </li>)}
                    </ul>}

                  <Button asChild className={`w-full mt-auto btn-press min-h-[48px] ${plan.popular ? 'gradient-primary text-primary-foreground border-0 btn-pulse' : 'bg-muted hover:bg-primary hover:text-primary-foreground text-foreground border border-border'}`}>
                    <Link to={`/register?plan=${plan.name.toLowerCase()}`}>{plan.cta}</Link>
                  </Button>
                </div>
              </motion.div>)}
          </div>
        </div>

        {/* Curve divider */}
        <SectionDivider variant="curve" fill="fill-[#ECFDF5]" className="bottom-0" />
      </section>

      {/* ===== SEÇÃO GARANTIA ===== */}
      <section className="py-24 px-4 relative section-emerald-light">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display text-foreground">
              Teste{" "}
              <span className="gradient-title-text">Sem Riscos</span>{" "}
              Por 14 Dias
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[{
            icon: CreditCard,
            title: "Sem Cartão de Crédito",
            description: "Você testa tudo antes de decidir"
          }, {
            icon: X,
            title: "Sem Compromisso",
            description: "Cancele quando quiser, zero burocracia"
          }, {
            icon: MessageCircle,
            title: "Suporte Completo",
            description: "Nossa equipe te ajuda na configuração"
          }].map((guarantee, i) => <motion.div key={guarantee.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: i * 0.1
          }} className="bg-white rounded-2xl border border-primary/20 p-6 text-center card-3d shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <guarantee.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{guarantee.title}</h3>
                <p className="text-sm text-muted-foreground">{guarantee.description}</p>
              </motion.div>)}
          </div>
        </div>

        {/* Wave divider */}
        <SectionDivider variant="wave" fill="fill-white" className="bottom-0" />
      </section>

      {/* ===== SEÇÃO CTA FINAL ===== */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-display">
              Você Vai Continuar{" "}
              <span className="text-status-danger">Preso na Operação</span>{" "}
              ou Vai{" "}
              <span className="gradient-text">Escalar com Estrutura?</span>
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Se você ainda está organizando clientes em planilhas, delegando por WhatsApp e controlando tarefas na memória...
              <br />
              <strong className="text-foreground">Sua agência está sendo engolida pela falta de sistema.</strong>
            </p>
            
            <p className="text-muted-foreground mb-6">
              Enquanto você improvisa, seus concorrentes estão se estruturando.
              <br />
              Enquanto você trabalha 12 horas, eles estão delegando.
              <br />
              Enquanto você explica tudo 3 vezes, o G-Rank está treinando o time operacional.
            </p>
            
            <p className="text-primary font-medium italic mb-10 text-lg">
              "O tempo que você perde sem estrutura é o tempo que seus concorrentes ganham com sistema."
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button size="lg" asChild className="gradient-primary text-primary-foreground border-0 shadow-xl neon-glow text-lg px-10 py-7 h-auto">
                <Link to="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  COMEÇAR TESTE GRÁTIS AGORA
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-border/50 hover:bg-muted text-lg px-8 py-7 h-auto">
                <a href="#demo">
                  Agendar Demonstração
                </a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                14 dias grátis
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                Cancele quando quiser
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO FAQ ===== */}
      <section className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Perguntas{" "}
              <span className="gradient-text">Frequentes</span>
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => <motion.div key={faq.question} initial={{
            opacity: 0,
            y: 10
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: i * 0.05
          }}>
                <AccordionItem value={`item-${i}`} className="glass-card border-0 px-6">
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>)}
          </Accordion>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-16 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={grankLogo} alt="G-Rank" className="h-8 w-auto" />
                <span className="font-bold text-xl gradient-text">G-Rank CRM</span>
              </Link>
              <p className="text-muted-foreground mb-4">
                Gestão Profissional para Agências de Marketing Local
              </p>
              <p className="text-sm text-muted-foreground">
                Construído por quem vive o jogo do GMB no campo.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2">
                {navLinks.map(link => <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  </li>)}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>📧 contato@grank.com.br</li>
                <li>📱 WhatsApp: (XX) XXXXX-XXXX</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} G-Rank CRM. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;