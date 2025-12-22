import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparisonItems = [
  { gbrank: "100% focado em Google Meu Negócio", others: "Feitos para qualquer nicho" },
  { gbrank: "Pronto para usar em 15 minutos", others: "Você precisa configurar tudo do zero" },
  { gbrank: "Construído por quem vende há 4 anos", others: "Não entendem Google Meu Negócio" },
  { gbrank: "Checklist de 47 pontos de otimização", others: "Sem checklist de otimização" },
  { gbrank: "Gestão de tarefas automáticas", others: "Não controlam tarefas recorrentes" },
  { gbrank: "Contratos com cláusulas específicas", others: "Contratos genéricos" },
];

export const ComparisonTable = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Side by side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* GBRank Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="px-4 py-1.5 bg-google-green text-white text-xs font-bold rounded-full shadow-lg">
              Especializado
            </span>
          </div>
          
          <div className="bg-white border-2 border-google-green/30 rounded-2xl p-5 pt-8 shadow-lg shadow-google-green/10 h-full">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-foreground">GBRank CRM</h3>
            </div>
            
            {/* Items */}
            <div className="space-y-3">
              {comparisonItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 bg-google-green/10 rounded-xl px-4 py-3"
                >
                  <Check className="h-5 w-5 text-google-green shrink-0" />
                  <span className="text-sm text-foreground">{item.gbrank}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Others Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 pt-8 h-full">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">❌</div>
              <h3 className="text-xl font-bold text-muted-foreground">Outros CRMs</h3>
            </div>
            
            {/* Items */}
            <div className="space-y-3">
              {comparisonItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3"
                >
                  <X className="h-5 w-5 text-red-400 shrink-0" />
                  <span className="text-sm text-muted-foreground">{item.others}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  );
};
