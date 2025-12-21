import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  Brain, 
  Shield, 
  Check, 
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import grankLogo from "@/assets/grank-logo.png";

const Landing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const features = [
    {
      icon: Users,
      title: "CRM Especializado",
      description: "Pipeline visual otimizado para agências de Google Meu Negócio com kanban e automações."
    },
    {
      icon: FileText,
      title: "Contratos Digitais Inteligentes",
      description: "Gere, envie e colete assinaturas digitais com validade jurídica em poucos cliques."
    },
    {
      icon: Brain,
      title: "Relatórios com IA",
      description: "Análises automáticas de performance, SEO local e sugestões de melhoria com inteligência artificial."
    },
    {
      icon: Shield,
      title: "Gestão de Equipe e Permissões",
      description: "Controle de acesso granular para vendedores, operadores e gestores da sua agência."
    }
  ];

  const plans = [
    {
      name: "Starter",
      description: "Para agências iniciantes",
      monthlyPrice: 97,
      annualPrice: 77,
      features: [
        "Até 3 usuários",
        "50 leads/mês",
        "20 clientes ativos",
        "Contratos digitais",
        "Suporte por email"
      ],
      cta: "Começar Grátis",
      popular: false
    },
    {
      name: "Pro",
      description: "Para agências em crescimento",
      monthlyPrice: 197,
      annualPrice: 157,
      features: [
        "Até 10 usuários",
        "200 leads/mês",
        "100 clientes ativos",
        "Relatórios com IA",
        "Suporte prioritário",
        "API de integração"
      ],
      cta: "Testar Grátis",
      popular: true
    },
    {
      name: "Elite",
      description: "Para grandes operações",
      monthlyPrice: 397,
      annualPrice: 317,
      features: [
        "Usuários ilimitados",
        "Leads ilimitados",
        "Clientes ilimitados",
        "White-label disponível",
        "Gerente de sucesso dedicado",
        "Treinamento personalizado"
      ],
      cta: "Falar com Vendas",
      popular: false
    }
  ];

  const partners = [
    "Agência Alpha", "Digital Pro", "Local Masters", "GMB Experts", "Rank Agency"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-x-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={grankLogo} alt="G-Rank" className="h-8 w-auto" />
            <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              G-Rank
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-gray-300 hover:text-white hover:bg-white/10">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0 shadow-lg shadow-cyan-500/25">
              <Link to="/register">
                Testar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-magenta-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-gray-300">O CRM #1 para Agências de Google Meu Negócio</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Escale sua Agência de
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Google Meu Negócio
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              CRM completo com contratos digitais, relatórios com IA e gestão de equipe. 
              Tudo que você precisa para vender mais e entregar melhor.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0 shadow-xl shadow-cyan-500/30 text-lg px-8 py-6">
                <Link to="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  Testar Grátis por 14 Dias
                </Link>
              </Button>
              <p className="text-sm text-gray-500">Sem cartão de crédito • Cancele quando quiser</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Tudo que sua agência precisa
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Ferramentas especializadas para otimizar cada etapa do seu negócio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto">
          <p className="text-center text-gray-500 mb-8 text-sm uppercase tracking-wider">
            Confiado por agências em todo o Brasil
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <motion.div
                key={partner}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-gray-600 font-semibold text-lg hover:text-gray-400 transition-colors cursor-default"
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Planos que crescem com você
              </span>
            </h2>
            <p className="text-gray-400 mb-8">
              Escolha o plano ideal para o tamanho da sua operação
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white/5 border border-white/10">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !isAnnual 
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  isAnnual 
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Anual
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-cyan-500/20 to-emerald-500/10 border-2 border-cyan-500/50 scale-105'
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-xs font-semibold text-white">
                    Mais Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-gray-400">R$</span>
                    <span className="text-4xl font-bold text-white">
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-emerald-400 mt-1">
                      Economia de R${(plan.monthlyPrice - plan.annualPrice) * 12}/ano
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  asChild 
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-cyan-500/20 border border-white/10 backdrop-blur-sm"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Pronto para escalar sua agência?
            </h2>
            <p className="text-gray-400 mb-8">
              Junte-se a centenas de agências que já transformaram sua operação com o G-Rank
            </p>
            <Button size="lg" asChild className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0 shadow-xl shadow-cyan-500/30">
              <Link to="/register">
                Começar Agora — É Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10 bg-gray-950">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={grankLogo} alt="G-Rank" className="h-8 w-auto" />
                <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  G-Rank
                </span>
              </Link>
              <p className="text-sm text-gray-500">
                O CRM completo para agências de Google Meu Negócio.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Começar Grátis</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Entrar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Suporte</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} G-Rank. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
