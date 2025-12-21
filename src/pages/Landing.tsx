import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  Bell, 
  TrendingUp,
  Shield, 
  Check, 
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Calculator,
  Clock,
  MessageCircle,
  ChevronDown,
  Menu,
  X as CloseIcon,
  CreditCard,
  UserCheck,
  Target,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import grankLogo from "@/assets/grank-logo.png";
import {
  AnimatedCounter,
  FloatingParticles,
  ScrollProgress,
  InteractiveDemo,
  HeroVideo,
  FeatureCard,
  TestimonialCard,
  ComparisonTable,
} from "@/components/landing";

const Landing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Users,
      title: "Funil de Leads Visual",
      description: "Organize seus leads em estágios claros: Novo Lead → Negociação → Contrato → Fechado. Você vê tudo de forma visual e simples.",
    },
    {
      icon: FileText,
      title: "Propostas Automáticas",
      description: "Gere propostas profissionais em 2 cliques. O sistema cria propostas com sua marca, envia por link rastreável e te avisa quando o cliente visualiza.",
    },
    {
      icon: Bell,
      title: "Dashboard com Alertas",
      description: "\"3 clientes sem atividade há 15 dias\" — \"2 contratos vencem esta semana\" — Você age antes do problema acontecer.",
    },
    {
      icon: Shield,
      title: "Contratos Inteligentes",
      description: "Contratos com IA + Assinatura Digital. Escolha o modelo, preencha os dados e o sistema gera um contrato completo.",
    },
    {
      icon: TrendingUp,
      title: "Gestão de Equipe",
      description: "Cada pessoa vê só o que precisa. Defina permissões: Vendedor, Operador, Gestor, Admin. Você delega com segurança.",
    },
    {
      icon: Calculator,
      title: "Comissões Automáticas",
      description: "Fim das planilhas de comissão. O sistema calcula automaticamente com base nas suas regras. Transparente para todo mundo.",
    },
  ];

  const plans = [
    {
      name: "Starter",
      emoji: "🟢",
      tagline: "Feito pro lobo solo",
      monthlyPrice: 67,
      annualPrice: 54,
      features: [
        "Até 15 clientes ativos",
        "Até 200 leads",
        "Até 2 membros da equipe",
        "Funil e tarefas básicas",
        "Relatórios por agência",
        "Dashboard principal",
        "Suporte por e-mail"
      ],
      limitations: [
        "Sem automações",
        "Sem controle de comissão",
        "Sem exportação de dados"
      ],
      cta: "Começar Grátis",
      popular: false
    },
    {
      name: "Pro",
      emoji: "🔵",
      tagline: "Feito pra quem vive disso",
      monthlyPrice: 127,
      annualPrice: 102,
      features: [
        "Até 50 clientes ativos",
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
      features: [
        "Até 150 clientes ativos",
        "Até 5.000 leads",
        "Até 15 membros",
        "Tudo do Pro +",
        "Dashboard financeiro",
        "Exportação de dados",
        "Suporte por WhatsApp",
        "Acesso antecipado a novos recursos"
      ],
      limitations: [],
      cta: "Testar Grátis",
      popular: false
    }
  ];

  const testimonials = [
    {
      quote: "Antes eu perdia 2 horas por dia só organizando informações. Agora, em 15 minutos, sei exatamente o que fazer.",
      author: "Ricardo Santos",
      role: "Agência de São Paulo, 45 clientes",
    },
    {
      quote: "As propostas automáticas mudaram meu jogo. Fecho mais rápido e com valor maior.",
      author: "Mariana Costa",
      role: "Consultora autônoma, Belo Horizonte",
    },
    {
      quote: "Finalmente consigo delegar sem medo. O sistema guia meu time e eu acompanho tudo.",
      author: "Fernanda Lima",
      role: "Gestora de marketing local, Curitiba",
    },
  ];

  const faqs = [
    {
      question: "Preciso ser expert em tecnologia para usar?",
      answer: "Não. O G-Rank foi feito para ser simples. Se você usa WhatsApp, vai usar o G-Rank tranquilamente.",
    },
    {
      question: "Funciona para agências pequenas?",
      answer: "Funciona melhor para quem tem 5+ clientes ativos. Se você está começando, pode não fazer sentido ainda.",
    },
    {
      question: "E se eu não gostar?",
      answer: "Sem problema. Você testa 14 dias grátis e cancela se não fizer sentido. Zero burocracia.",
    },
    {
      question: "Posso importar meus clientes atuais?",
      answer: "Sim. Você consegue importar seus dados de planilhas ou outros sistemas.",
    },
    {
      question: "Tem suporte em português?",
      answer: "Sim. Suporte completo em português, feito por quem entende de Google Meu Negócio.",
    },
    {
      question: "Qual o investimento mensal?",
      answer: "Os valores variam de acordo com o tamanho da sua operação (número de usuários, clientes, funcionalidades). Veja os planos acima ou entre em contato para um plano personalizado.",
    },
  ];

  const navLinks = [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Preços", href: "#precos" },
    { label: "Depoimentos", href: "#depoimentos" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
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
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
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
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground"
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
            className="md:hidden bg-card border-t border-border px-4 py-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-muted-foreground"
            >
              Entrar
            </Link>
          </motion.div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <FloatingParticles />
        
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm mb-8"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">O CRM #1 para Agências de Google Meu Negócio</span>
            </motion.div>
            
            {/* Headline Principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-display">
              <span className="text-foreground">
                Pare de Perder Leads e
              </span>
              <br />
              <span className="text-foreground">
                Contratos por{" "}
              </span>
              <span className="gradient-text">
                Desorganização
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              O único sistema de gestão feito especialmente para agências de Google Meu Negócio.
              <br className="hidden sm:block" />
              Organize seus clientes, gere propostas automáticas e escale sua operação com clareza.
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button 
                size="lg" 
                asChild 
                className="gradient-primary text-primary-foreground border-0 shadow-xl neon-glow text-lg px-8 py-6 h-auto"
              >
                <Link to="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  TESTE GRÁTIS POR 14 DIAS
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="border-border/50 hover:bg-muted text-lg px-8 py-6 h-auto"
              >
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
                Sem compromisso
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                Cancele quando quiser
              </span>
            </p>
          </motion.div>

          {/* Hero Video/Demo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-16"
          >
            <HeroVideo />
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO PROBLEMA ===== */}
      <section className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-display">
              Sua Agência Está Crescendo,{" "}
              <span className="text-status-danger">Mas o Caos Também?</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: "Leads Perdidos",
                description: "Você prospecta no Instagram, anota no bloco de notas e esquece. Oportunidades de R$ 5.000 ou R$ 10.000 evaporam porque não há processo.",
                color: "text-status-danger",
              },
              {
                icon: Clock,
                title: "Propostas Lentas",
                description: "Cada proposta leva horas para ficar pronta. Você copia, cola, ajusta valores... e quando o cliente pede urgência, você perde a venda.",
                color: "text-status-warning",
              },
              {
                icon: Target,
                title: "Sem Controle",
                description: "Você não sabe quantos contratos vencem este mês, qual cliente precisa de atenção ou se sua equipe está alinhada.",
                color: "text-status-info",
              },
            ].map((problem, i) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 ${problem.color}`}>
                  <problem.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12 text-lg text-muted-foreground italic"
          >
            "Se você sente que está sempre apagando incêndio ao invés de construir algo sólido, continue lendo."
          </motion.p>
        </div>
      </section>

      {/* ===== SEÇÃO SOLUÇÃO ===== */}
      <section id="como-funciona" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">A Solução</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-display">
              O G-Rank Organiza Sua Operação{" "}
              <span className="gradient-text">de Ponta a Ponta</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Um sistema completo que cuida de leads, propostas, contratos, equipe e resultados. Tudo em um só lugar.
            </p>
          </motion.div>

          <div id="demo">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO FUNCIONALIDADES ===== */}
      <section id="funcionalidades" className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Tudo Que Sua Agência{" "}
              <span className="gradient-text">Precisa</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas especializadas para otimizar cada etapa do seu negócio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO ANTES VS DEPOIS ===== */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Como Será Seu Dia{" "}
              <span className="gradient-text">Depois do G-Rank</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* ANTES */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-status-danger/20 flex items-center justify-center">
                  <X className="h-4 w-4 text-status-danger" />
                </div>
                <h3 className="text-xl font-bold text-status-danger">ANTES</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Manhã perdida procurando informações",
                  "Propostas que demoram dias",
                  "Contratos esquecidos",
                  "Insônia pensando no que esqueceu",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <X className="h-5 w-5 text-status-danger flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* DEPOIS */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 border-primary/30"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">DEPOIS</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Dashboard mostra o que precisa ser feito",
                  "Proposta pronta em 3 minutos",
                  "Sistema alerta sobre renovações",
                  "Você dorme tranquilo, tudo sob controle",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-foreground">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO COMPARAÇÃO ===== */}
      <section className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-6">
              <Award className="h-4 w-4 text-secondary" />
              <span className="text-sm text-secondary font-medium">Feito por quem faz</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">
              Construído Por Quem Vive{" "}
              <span className="gradient-text">Google Meu Negócio</span>{" "}
              Todos os Dias
            </h2>
            
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
              O G-Rank não foi feito por programadores que não entendem do mercado.
              Foi criado com base em experiência real no campo de batalha.
            </p>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { value: 5, suffix: " anos", label: "vendendo Google Meu Negócio" },
                { value: 1500, suffix: "+", label: "reuniões de vendas reais" },
                { value: 500, suffix: "+", label: "contratos fechados" },
                { value: 350, suffix: "+", label: "alunos formados" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO DEPOIMENTOS ===== */}
      <section id="depoimentos" className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              O Que Dizem{" "}
              <span className="gradient-text">Nossos Clientes</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard
                key={testimonial.author}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO PARA QUEM É ===== */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              O G-Rank é{" "}
              <span className="gradient-text">Para Você Se...</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 border-primary/30"
            >
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                É Para Você Se...
              </h3>
              <ul className="space-y-3">
                {[
                  "Você tem agência de marketing local",
                  "Vende Google Meu Negócio como serviço",
                  "Quer escalar sem perder controle",
                  "Precisa de processos claros e automações",
                  "Quer transmitir mais profissionalismo",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-bold text-muted-foreground mb-4 flex items-center gap-2">
                <X className="h-5 w-5" />
                Não É Para Você Se...
              </h3>
              <ul className="space-y-3">
                {[
                  "Você está começando e tem menos de 5 clientes",
                  "Prefere improvisar do que seguir processos",
                  "Busca \"mágica\" sem trabalho real",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO URGÊNCIA ===== */}
      <section className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
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
              {[
                "Acesso antecipado a novas funcionalidades",
                "Acompanhamento direto com nosso time",
                "Participação ativa nas próximas atualizações",
              ].map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 p-4 glass-card"
                >
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-8 italic">
              Isso não é sobre escassez artificial. É sobre construir com quem está comprometido.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO PREÇOS ===== */}
      <section id="precos" className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Quanto Custa Ter{" "}
              <span className="gradient-text">Estrutura na Sua Operação?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              O G-Rank não é uma despesa. É infraestrutura de crescimento.
              Se você perde 1 contrato por mês por desorganização — o sistema já se paga.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted border border-border">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !isAnnual 
                    ? 'gradient-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  isAnnual 
                    ? 'gradient-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Anual
                <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success text-xs">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative flex flex-col min-h-[520px] ${
                  plan.popular ? 'md:scale-105 z-10' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-primary text-xs font-semibold text-primary-foreground z-20">
                    Mais Popular
                  </div>
                )}

                <div className={`glass-card p-6 flex-1 flex flex-col ${
                  plan.popular ? 'border-primary/50 neon-border' : ''
                }`}>
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
                    {isAnnual && (
                      <p className="text-sm text-status-success mt-1">
                        Economia de R${(plan.monthlyPrice - plan.annualPrice) * 12}/ano
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-3 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <ul className="space-y-2 mb-4 pt-3 border-t border-border">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button 
                    asChild 
                    className={`w-full mt-auto ${
                      plan.popular
                        ? 'gradient-primary text-primary-foreground border-0 neon-glow'
                        : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                    }`}
                  >
                    <Link to={`/register?plan=${plan.name.toLowerCase()}`}>{plan.cta}</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO GARANTIA ===== */}
      <section className="py-20 px-4 relative bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Teste{" "}
              <span className="gradient-text">Sem Riscos</span>{" "}
              Por 14 Dias
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: CreditCard, title: "Sem Cartão de Crédito", description: "Você testa tudo antes de decidir" },
              { icon: X, title: "Sem Compromisso", description: "Cancele quando quiser, zero burocracia" },
              { icon: MessageCircle, title: "Suporte Completo", description: "Nossa equipe te ajuda na configuração" },
            ].map((guarantee, i) => (
              <motion.div
                key={guarantee.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <guarantee.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{guarantee.title}</h3>
                <p className="text-sm text-muted-foreground">{guarantee.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO CTA FINAL ===== */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-display">
              Você Vai Continuar{" "}
              <span className="text-status-danger">Improvisando</span>{" "}
              ou Vai{" "}
              <span className="gradient-text">Profissionalizar</span>{" "}
              Sua Operação?
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10">
              Se você ainda está controlando leads pelo WhatsApp e fazendo propostas no Canva,
              sua agência está sendo engolida pela falta de estrutura.
              <br />
              <strong className="text-foreground">Enquanto você improvisa, seus concorrentes estão se organizando.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button 
                size="lg" 
                asChild 
                className="gradient-primary text-primary-foreground border-0 shadow-xl neon-glow text-lg px-10 py-7 h-auto"
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
                className="border-border/50 hover:bg-muted text-lg px-8 py-7 h-auto"
              >
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
              Perguntas{" "}
              <span className="gradient-text">Frequentes</span>
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
                <AccordionItem value={`item-${i}`} className="glass-card border-0 px-6">
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
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
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
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
    </div>
  );
};

export default Landing;
