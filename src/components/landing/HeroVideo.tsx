import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useState } from "react";

export const HeroVideo = () => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative mx-auto max-w-5xl"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-2xl opacity-60" />
      
      {/* Main container */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10 bg-card">
        {/* Animated mockup screen */}
        <div className="aspect-video relative bg-gradient-to-br from-surface-1 via-surface-2 to-surface-3">
          {/* Simulated dashboard animation */}
          <div className="absolute inset-0 p-4 md:p-8">
            {/* Header bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/20" />
                <div className="h-4 w-24 rounded bg-foreground/10" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="h-8 w-8 rounded-lg bg-muted" />
              </div>
            </motion.div>

            {/* Main content grid */}
            <div className="grid grid-cols-4 gap-4">
              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className={`h-8 rounded-lg ${i === 1 ? "bg-primary/20 border border-primary/50" : "bg-muted/50"}`}
                  />
                ))}
              </motion.div>

              {/* Main area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="col-span-3 space-y-4"
              >
                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { color: "from-primary/20 to-primary/5", delay: 0.9 },
                    { color: "from-secondary/20 to-secondary/5", delay: 1.0 },
                    { color: "from-accent/20 to-accent/5", delay: 1.1 },
                    { color: "from-status-success/20 to-status-success/5", delay: 1.2 },
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: card.delay, type: "spring" }}
                      className={`h-16 rounded-xl bg-gradient-to-br ${card.color} border border-border/30`}
                    />
                  ))}
                </div>

                {/* Kanban columns */}
                <div className="grid grid-cols-5 gap-2 h-40">
                  {["Pipeline", "Onboarding", "Otimização", "Pronto", "Entregue"].map((col, i) => (
                    <motion.div
                      key={col}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 + i * 0.1 }}
                      className="rounded-xl bg-muted/30 border border-border/30 p-2 space-y-2"
                    >
                      <div className="h-3 w-16 rounded bg-foreground/10" />
                      {Array.from({ length: Math.max(1, 4 - i) }).map((_, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 + j * 0.1 }}
                          className="h-6 rounded-md bg-card border border-border/50"
                        />
                      ))}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Animated cursor */}
          <motion.div
            className="absolute w-4 h-4 pointer-events-none"
            initial={{ x: "50%", y: "50%" }}
            animate={{
              x: ["30%", "60%", "45%", "70%", "30%"],
              y: ["40%", "30%", "60%", "50%", "40%"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.37-.92L6.34 2.85a.5.5 0 0 0-.84.36z"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>
        </div>

        {/* Play/Pause button overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-card transition-colors"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-foreground" />
          ) : (
            <Play className="h-4 w-4 text-foreground ml-0.5" />
          )}
        </button>
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
            <div className="text-xs font-medium">Contrato assinado!</div>
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
            <div className="text-xs font-medium">+R$ 2.500/mês</div>
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
            <div className="text-xs font-medium">Lead qualificado</div>
            <div className="text-[10px] text-muted-foreground">Próximo passo: reunião</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
