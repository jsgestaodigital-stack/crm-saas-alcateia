import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, FileText, Bell, TrendingUp, Shield, Check, ArrowRight, Sparkles, Zap, 
  Calculator, Clock, MessageCircle, Menu, X as CloseIcon, 
  UserCheck, Target, Award, MapPin, Star, Crown, Gift,
  CheckCircle2, ListChecks, Rocket, Calendar, BarChart3, Infinity, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import grankLogoDark from "@/assets/grank-logo-dark.png";
import grankLogoLight from "@/assets/grank-logo-light.png";
import alcateiaLogo from "@/assets/alcateia-logo.png";
import joaoLoboPhoto from "@/assets/joao-lobo.jpg";
import wolfHero from "@/assets/alcateia-wolf-hero.png";
import wolfPack from "@/assets/alcateia-wolf-pack.png";
import wolfAbstract from "@/assets/alcateia-wolf-abstract.png";
import { 
  AnimatedCounter, ScrollProgress, InteractiveDemo,
  GMBStatsCard, GMBBadge, GMBFeatureCard
} from "@/components/landing";
import { AlcateiaQuiz } from "@/components/alcateia/AlcateiaQuiz";
import { usePageMeta } from "@/hooks/usePageMeta";

const QUIZ_COMPLETED_KEY = "alcateia_quiz_completed";

const LandingAlcateia = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(true);

  // Set custom meta tags for Alcateia page (WhatsApp/Instagram preview)
  usePageMeta({
    title: "🐺 Oportunidade Exclusiva Alcateia — Membros Fundadores GRank CRM",
    description: "Acesso vitalício exclusivo para alunos da Alcateia. Faça parte da construção do melhor CRM de Google Meu Negócio. Sem mensalidade, para sempre.",
    ogTitle: "🐺 Exclusivo Alcateia — Membros Fundadores GRank CRM",
    ogDescription: "Você foi convidado para fazer parte da construção do GRank CRM. Acesso vitalício, sem mensalidade. Oferta exclusiva para alunos Alcateia.",
    ogType: "website",
  });

  // Check if quiz was already completed (persist for session)
  useEffect(() => {
    const quizCompleted = sessionStorage.getItem(QUIZ_COMPLETED_KEY);
    if (quizCompleted === "true") {
      setShowQuiz(false);
    }
  }, []);

  // Force light mode on landing page
  useEffect(() => {
    document.documentElement.classList.add('light');
    return () => {
      document.documentElement.classList.remove('light');
    };
  }, []);

  const handleQuizComplete = () => {
    sessionStorage.setItem(QUIZ_COMPLETED_KEY, "true");
    setShowQuiz(false);
  };

  const exclusiveFeatures = [
    {
      icon: Infinity,
      title: "Acesso Vitalício",
      description: "Quem entrar agora, fica para sempre. Sem mensalidade, sem renovação. Seu acesso é permanente."
    },
    {
      icon: Crown,
      title: "Status Fundador",
      description: "Você faz parte do grupo que ajudou a construir o GBRank CRM. Seu feedback molda o produto."
    },
    {
      icon: Rocket,
      title: "Funcionalidades Antecipadas",
      description: "Teste antes de todo mundo. Novos recursos chegam primeiro para a Alcateia."
    },
    {
      icon: Gift,
      title: "Suporte Direto",
      description: "Acesso ao grupo exclusivo no WhatsApp com suporte prioritário e direto comigo."
    }
  ];

  const executionFeatures = [
    {
      icon: ListChecks,
      title: "Checklist de 47 Pontos",
      description: "O mesmo checklist que usamos na agência. Da categoria principal às fotos de fachada.",
      highlight: true
    },
    {
      icon: Calendar,
      title: "Gestão de Tarefas Recorrentes",
      description: "Controle de posts semanais, calendário visual, status de publicação completo."
    },
    {
      icon: UserCheck,
      title: "Controle Gestor vs Operador",
      description: "Permissões claras. Gestor supervisiona, operador executa. Sem confusão."
    },
    {
      icon: Target,
      title: "Funil de Vendas Completo",
      description: "Pipeline visual para acompanhar cada lead do primeiro contato até o fechamento."
    }
  ];

  const navLinks = [
    { label: "O Que É", href: "#oque" },
    { label: "Por Que Agora", href: "#porque" },
    { label: "Funcionalidades", href: "#funcionalidades" }
  ];

  return (
    <>
      {/* Quiz Gate */}
      {showQuiz && <AlcateiaQuiz onComplete={handleQuizComplete} />}
      
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgress />
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/alcateia" className="flex items-center gap-2">
            <img src={alcateiaLogo} alt="Alcateia" className="h-7 sm:h-8 w-auto" />
            <span className="font-bold text-lg sm:text-xl text-amber-600">×</span>
            <img src={grankLogoDark} alt="GBRank CRM" className="h-6 sm:h-7 w-auto" />
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map(link => (
              <a 
                key={link.label} 
                href={link.href} 
                className="text-sm text-muted-foreground hover:text-amber-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" asChild className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted text-sm">
              <Link to="/auth">Já tenho conta</Link>
            </Button>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-lg shadow-amber-600/30 text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10">
              <a href="#cta">
                <Crown className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                <span className="hidden xs:inline">Garantir Acesso</span>
                <span className="xs:hidden">Entrar</span>
              </a>
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
                className="block py-3 text-foreground hover:text-amber-600 transition-colors touch-target"
              >
                {link.label}
              </a>
            ))}
            <Link 
              to="/auth" 
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-muted-foreground touch-target"
            >
              Já tenho conta
            </Link>
          </motion.div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative flex items-center justify-center pt-20 sm:pt-24 pb-12 px-3 sm:px-4 overflow-hidden bg-gradient-to-b from-amber-50 to-white">
        {/* Wolf Hero Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src={wolfHero} 
            alt="" 
            className="w-full h-full object-cover opacity-15 sm:opacity-20"
            style={{ 
              maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)'
            }}
          />
        </div>

        <div className="container mx-auto text-center relative z-10 px-2 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Exclusive Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-amber-600/10 border-2 border-amber-600/50 mb-4 sm:mb-6 backdrop-blur-sm"
            >
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-sm sm:text-base text-amber-700 font-bold">
                🐺 EXCLUSIVO PARA ALUNOS ALCATEIA
              </span>
            </motion.div>
            
            {/* Headline Principal */}
            <h1 className="text-[26px] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-5 leading-[1.15] font-display px-1">
              <span className="text-slate-900 drop-shadow-sm">Você Faz Parte da</span>
              <br />
              <span className="text-amber-600 drop-shadow-sm">Construção do GBRank CRM</span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-2xl mx-auto mb-5 sm:mb-6 leading-relaxed px-2">
              Juntos, estamos criando o <strong className="text-slate-900">melhor CRM de Google Meu Negócio</strong> do mercado. 
              Quem entrar agora, ganha <strong className="text-amber-600">acesso vitalício</strong>.
            </p>

            {/* CTA Principal */}
            <div className="flex justify-center mb-4">
              <Button 
                size="lg" 
                asChild 
                className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-xl shadow-amber-600/30 text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 h-auto min-h-[44px] sm:min-h-[52px] w-full sm:w-auto max-w-xs sm:max-w-none"
              >
                <Link to="/register-alcateia">
                  <Crown className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                  GARANTIR MEU ACESSO VITALÍCIO
                </Link>
              </Button>
            </div>
            
            <p className="text-[10px] sm:text-sm text-slate-600 flex items-center justify-center gap-3 sm:gap-4 flex-wrap px-2">
              <span className="flex items-center gap-1">
                <Check className="h-3 sm:h-4 w-3 sm:w-4 text-amber-600" />
                Acesso imediato
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 sm:h-4 w-3 sm:w-4 text-amber-600" />
                Sem mensalidade
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 sm:h-4 w-3 sm:w-4 text-amber-600" />
                Vitalício
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO EXCLUSIVIDADE ===== */}
      <section id="oque" className="py-6 sm:py-10 px-3 sm:px-4 relative bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8"
          >
            <GMBBadge variant="yellow">
              <Crown className="h-4 w-4" />
              Benefícios Exclusivos
            </GMBBadge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-display mt-4">
              Por Que Isso é{" "}
              <span className="text-amber-600">Especial?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Você não está apenas ganhando acesso a um CRM. Você está entrando em um projeto exclusivo.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {exclusiveFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border-2 border-amber-200 p-6 hover:border-amber-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO POR QUE AGORA ===== */}
      <section id="porque" className="py-10 sm:py-16 px-3 sm:px-4 relative overflow-hidden">
        {/* Wolf Pack Background - Full section */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src={wolfPack} 
            alt="" 
            className="w-full h-full object-cover opacity-25 sm:opacity-35"
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/95 via-amber-50/85 to-white/95" />
        </div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 font-display">
              Estamos em <span className="text-amber-600">Período de Teste</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              E é por isso que essa oportunidade existe.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl border-2 border-amber-200 p-6 sm:p-8 shadow-lg"
          >
            <div className="space-y-4 text-muted-foreground">
              <p className="text-sm sm:text-base leading-relaxed">
                O GBRank CRM nasceu da minha própria necessidade atendendo <strong className="text-foreground">mais de 500 empresas</strong> na minha agência.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                Agora, estou abrindo para vocês da <strong className="text-amber-600">Alcateia</strong> participarem desse período de construção. 
                Vocês vão usar, dar feedback, e juntos vamos criar o sistema perfeito.
              </p>
              <p className="text-sm sm:text-base leading-relaxed">
                Em troca, quem participar agora <strong className="text-foreground">não vai pagar mensalidade. Nunca.</strong>
              </p>
              <div className="pt-4 border-t border-amber-100">
                <p className="text-amber-700 font-semibold italic">
                  "Quando o GBRank CRM for lançado oficialmente, vocês já vão estar dentro — de graça, para sempre."
                </p>
                <p className="text-sm text-muted-foreground mt-2">— João Lobo</p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { value: "500+", label: "Empresas Atendidas" },
              { value: "4 anos", label: "Experiência" },
              { value: "350+", label: "Alunos Alcateia" },
              { value: "47", label: "Pontos Checklist" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-amber-200 p-3 sm:p-4 text-center"
              >
                <div className="text-xl sm:text-2xl font-bold text-amber-600">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO DEMO ===== */}
      <section className="py-6 sm:py-8 px-3 sm:px-4 relative bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <GMBBadge variant="green">
              <Sparkles className="h-4 w-4" />
              Veja na Prática
            </GMBBadge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 font-display mt-4">
              O Que Você Vai{" "}
              <span className="text-google-green">Ter Acesso</span>
            </h2>
          </motion.div>

          <InteractiveDemo />
        </div>
      </section>

      {/* ===== SEÇÃO FUNCIONALIDADES ===== */}
      <section id="funcionalidades" className="py-6 sm:py-8 px-3 sm:px-4 relative bg-gradient-to-b from-amber-50/30 to-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 font-display">
              Tudo Que Você Precisa Para{" "}
              <span className="text-amber-600">Escalar</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
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
        </div>
      </section>

      {/* ===== SEÇÃO JOÃO LOBO ===== */}
      <section className="py-6 sm:py-8 px-3 sm:px-4 relative bg-white">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border-2 border-amber-200 p-6 sm:p-8"
          >
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 order-2 md:order-1 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">João Lobo</h3>
                <p className="text-amber-600 font-semibold text-sm mb-4">Fundador Alcateia & GBRank CRM</p>
                <p className="text-sm sm:text-base text-muted-foreground italic leading-relaxed">
                  "Parabéns por ter dedicado sua quinta-feira à tarde para estar na nossa live! 
                  Por isso, você está sendo presenteado com acesso vitalício ao GBRank CRM. É a minha forma de agradecer quem está junto comigo desde o início."
                </p>
              </div>
              <div className="flex justify-center order-1 md:order-2">
                <img 
                  src={joaoLoboPhoto}
                  alt="João Lobo - Fundador" 
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-amber-400 shadow-xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO CTA FINAL ===== */}
      <section id="cta" className="py-10 sm:py-14 px-3 sm:px-4 relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-700">
        {/* Wolf Abstract Background - More visible */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] pointer-events-none opacity-25 sm:opacity-35">
          <img 
            src={wolfAbstract} 
            alt="" 
            className="w-full h-full object-contain"
            style={{
              filter: 'brightness(1.5) contrast(1.1)'
            }}
          />
        </div>
        
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-700/50 via-transparent to-amber-600/30" />
        
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Crown className="h-4 w-4 text-white" />
              <span className="text-white font-semibold text-sm">Vagas Limitadas</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 font-display text-white">
              Garanta Seu Acesso <span className="text-amber-200">Vitalício</span> Agora
            </h2>
            
            <p className="text-white/90 mb-6 text-sm sm:text-base max-w-xl mx-auto">
              Você participou da live e está recebendo essa oportunidade exclusiva.
              <strong className="text-white"> Aproveite — depois não haverá outra chance.</strong>
            </p>

            <div className="flex justify-center mb-4">
              <Button 
                size="lg" 
                asChild 
                className="bg-white text-amber-700 hover:bg-amber-50 border-0 shadow-xl text-sm sm:text-lg px-6 sm:px-10 py-4 sm:py-5 h-auto font-bold w-full sm:w-auto max-w-xs"
              >
                <Link to="/register-alcateia">
                  <Infinity className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                  QUERO MEU ACESSO VITALÍCIO
                </Link>
              </Button>
            </div>

            <p className="text-xs text-white/70 flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-white" />
                Acesso imediato
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-white" />
                Sem mensalidade
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-white" />
                Status fundador
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-6 sm:py-8 px-3 sm:px-4 bg-slate-900 text-white safe-area-inset-bottom">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={alcateiaLogo} alt="Alcateia" className="h-8 w-auto" />
            <span className="text-amber-400 font-bold">×</span>
            <img src={grankLogoLight} alt="GBRank CRM" className="h-7 w-auto" />
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Programa exclusivo para alunos da comunidade Alcateia
          </p>
          <div className="border-t border-gray-700 pt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} GBRank CRM × Alcateia. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default LandingAlcateia;
