import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  FileText, 
  Bell, 
  TrendingUp,
  Check,
  Clock,
  ArrowRight
} from "lucide-react";

const demoSteps = [
  {
    id: "leads",
    title: "Funil de Leads",
    icon: Users,
    description: "Visualize todos os leads em um kanban intuitivo",
    mockup: (
      <div className="grid grid-cols-4 gap-2 p-3">
        {["Novo", "Negociação", "Proposta", "Fechado"].map((stage, i) => (
          <div key={stage} className="space-y-2">
            <div className="text-[10px] font-medium text-muted-foreground">{stage}</div>
            {Array.from({ length: 4 - i }, (_, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + j * 0.05 }}
                className="h-8 rounded-md bg-gradient-to-r from-primary/20 to-secondary/20 border border-border/50"
              />
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "proposals",
    title: "Propostas Automáticas",
    icon: FileText,
    description: "Gere propostas profissionais em segundos",
    mockup: (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="h-3 w-32 rounded bg-foreground/20" />
            <div className="h-2 w-20 rounded bg-muted-foreground/20 mt-1" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="h-6 w-6 rounded-full bg-status-success flex items-center justify-center"
          >
            <Check className="h-3 w-3 text-primary-foreground" />
          </motion.div>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-3/4 rounded bg-muted" />
          <div className="h-2 w-1/2 rounded bg-muted" />
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.3, duration: 1 }}
          className="h-1 rounded-full bg-gradient-to-r from-primary to-secondary"
        />
      </div>
    ),
  },
  {
    id: "alerts",
    title: "Alertas Inteligentes",
    icon: Bell,
    description: "Nunca perca um prazo ou renovação",
    mockup: (
      <div className="p-3 space-y-2">
        {[
          { text: "3 clientes sem atividade há 15 dias", type: "warning", icon: Clock },
          { text: "2 contratos vencem esta semana", type: "danger", icon: FileText },
          { text: "5 leads aguardando resposta", type: "info", icon: Users },
        ].map((alert, i) => (
          <motion.div
            key={alert.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className={`flex items-center gap-2 p-2 rounded-lg border ${
              alert.type === "warning" 
                ? "bg-status-warning/10 border-status-warning/30" 
                : alert.type === "danger"
                ? "bg-status-danger/10 border-status-danger/30"
                : "bg-status-info/10 border-status-info/30"
            }`}
          >
            <alert.icon className={`h-4 w-4 ${
              alert.type === "warning" 
                ? "text-status-warning" 
                : alert.type === "danger"
                ? "text-status-danger"
                : "text-status-info"
            }`} />
            <span className="text-[10px] text-foreground">{alert.text}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard com IA",
    icon: TrendingUp,
    description: "Insights automáticos sobre sua operação",
    mockup: (
      <div className="p-3 grid grid-cols-2 gap-2">
        {[
          { label: "Faturamento", value: "R$ 45.8k", change: "+12%" },
          { label: "Clientes", value: "127", change: "+8" },
          { label: "Conversão", value: "34%", change: "+5%" },
          { label: "Churn", value: "2.1%", change: "-0.5%" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-2 rounded-lg bg-card border border-border/50"
          >
            <div className="text-[9px] text-muted-foreground">{stat.label}</div>
            <div className="text-sm font-bold text-foreground">{stat.value}</div>
            <div className={`text-[9px] ${stat.change.startsWith("+") ? "text-status-success" : "text-status-danger"}`}>
              {stat.change}
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
];

export const InteractiveDemo = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-center">
      {/* Controls */}
      <div className="space-y-4">
        {demoSteps.map((step, i) => (
          <motion.div
            key={step.id}
            onMouseEnter={() => setActiveStep(i)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeStep === i
                ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10"
                : "bg-card/50 border-border/50 hover:border-primary/30"
            }`}
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                activeStep === i ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className={`font-semibold transition-colors ${
                  activeStep === i ? "text-primary" : "text-foreground"
                }`}>
                  {step.title}
                </div>
                <div className="text-sm text-muted-foreground">{step.description}</div>
              </div>
              {activeStep === i && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <ArrowRight className="h-5 w-5 text-primary" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-3xl opacity-50" />
        <motion.div
          className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Window bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface-1/50">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-status-danger" />
              <div className="h-3 w-3 rounded-full bg-status-warning" />
              <div className="h-3 w-3 rounded-full bg-status-success" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-muted-foreground">GBRank CRM</span>
            </div>
          </div>

          {/* Content */}
          <div className="h-64">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {demoSteps[activeStep].mockup}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
