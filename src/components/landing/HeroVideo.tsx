import { motion } from "framer-motion";
import grankDashboardComplete from "@/assets/grank-dashboard-complete.png";

export const HeroVideo = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative mx-auto max-w-6xl"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-2xl opacity-60" />
      
      {/* Main container */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/20 bg-card">
        <img 
          src={grankDashboardComplete} 
          alt="GBRank CRM - Sistema completo de gestão de vendas, otimização GBP e recorrências para agências de Google Meu Negócio"
          className="w-full h-auto"
        />
      </div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute -left-4 top-1/4 bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-border/50 shadow-xl hidden lg:block"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-status-success/20 flex items-center justify-center">
            <span className="text-status-success text-sm">✓</span>
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">Contrato assinado!</div>
            <div className="text-[10px] text-muted-foreground">Há 2 minutos</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8 }}
        className="absolute -right-4 top-1/3 bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-border/50 shadow-xl hidden lg:block"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-sm">📈</span>
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">+R$ 2.500/mês</div>
            <div className="text-[10px] text-muted-foreground">Novo cliente</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1 }}
        className="absolute -bottom-4 left-1/4 bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-border/50 shadow-xl hidden lg:block"
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-secondary text-sm">🎯</span>
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">Lead qualificado</div>
            <div className="text-[10px] text-muted-foreground">Próximo passo: reunião</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
