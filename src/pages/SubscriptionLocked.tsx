import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, CreditCard, MessageCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import grankLogo from "@/assets/grank-logo.png";

const SubscriptionLocked = () => {
  const { subscription } = useSubscription();
  const { user } = useAuth();

  const getStatusMessage = () => {
    switch (subscription?.status) {
      case 'past_due':
        return {
          title: "Pagamento pendente",
          description: "Identificamos um problema com seu último pagamento. Regularize para continuar acessando."
        };
      case 'cancelled':
        return {
          title: "Assinatura cancelada",
          description: "Sua assinatura foi cancelada. Reative seu plano para voltar a usar o G-Rank."
        };
      case 'expired':
        return {
          title: "Assinatura expirada",
          description: "Sua assinatura expirou. Renove seu plano para continuar acessando."
        };
      default:
        return {
          title: "Assinatura inativa",
          description: "Sua assinatura precisa de atenção para continuar acessando a plataforma."
        };
    }
  };

  const statusMessage = getStatusMessage();

  // WhatsApp support link (replace with actual number)
  const whatsappLink = `https://wa.me/5511999999999?text=${encodeURIComponent(
    `Olá! Preciso de ajuda com minha assinatura do G-Rank. Email: ${user?.email}`
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img src={grankLogo} alt="G-Rank" className="h-8 w-auto" />
          <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            G-Rank
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full text-center"
        >
          {/* Lock Icon */}
          <div className="mb-8 relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
              <Lock className="h-12 w-12 text-red-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center border border-orange-500/50">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {statusMessage.title}
          </h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            {statusMessage.description}
          </p>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <p className="text-sm text-gray-400">
              Para continuar acessando seus <strong className="text-white">leads</strong>, <strong className="text-white">contratos</strong> e <strong className="text-white">relatórios</strong>, regularize seu plano.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-0 shadow-lg shadow-cyan-500/25"
              asChild
            >
              <Link to="/admin/plan">
                <CreditCard className="mr-2 h-5 w-5" />
                Regularizar Pagamento
              </Link>
            </Button>

            <Button 
              size="lg" 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar com Suporte
              </a>
            </Button>
          </div>

          {/* Profile Access Note */}
          <p className="mt-8 text-sm text-gray-500">
            Você ainda pode acessar seu{" "}
            <Link to="/meu-perfil" className="text-cyan-400 hover:text-cyan-300 underline">
              perfil
            </Link>{" "}
            para atualizar informações.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} G-Rank. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default SubscriptionLocked;
