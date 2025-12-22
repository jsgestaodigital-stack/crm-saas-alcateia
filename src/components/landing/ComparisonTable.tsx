import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparisons = [
  { feature: "Configuração inicial", others: "Você precisa configurar tudo", gbrank: "Já vem pronto para GMB" },
  { feature: "Propostas", others: "PDF manual", gbrank: "Geração automática + rastreamento" },
  { feature: "Contratos", others: "Sem contratos integrados", gbrank: "Contratos com IA inclusos" },
  { feature: "Dashboard", others: "Genérico", gbrank: "Alertas específicos para sua operação" },
  { feature: "Comissões", others: "Planilhas", gbrank: "Cálculo automático" },
  { feature: "Suporte", others: "Genérico", gbrank: "Especializado em GMB" },
];

export const ComparisonTable = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-status-danger/5 via-transparent to-status-success/5" />
      
      <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-border/50 bg-muted/30">
          <div className="text-sm font-medium text-muted-foreground">Funcionalidade</div>
          <div className="text-center">
            <span className="text-sm font-medium text-status-danger">Outros CRMs</span>
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-primary">GBRank</span>
          </div>
        </div>

        {/* Rows */}
        {comparisons.map((row, i) => (
          <motion.div
            key={row.feature}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`grid grid-cols-3 gap-4 p-4 ${i < comparisons.length - 1 ? "border-b border-border/30" : ""}`}
          >
            <div className="text-sm text-foreground font-medium">{row.feature}</div>
            <div className="flex items-center justify-center gap-2">
              <X className="h-4 w-4 text-status-danger/70" />
              <span className="text-xs text-muted-foreground hidden md:block">{row.others}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-status-success" />
              <span className="text-xs text-foreground hidden md:block">{row.gbrank}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
