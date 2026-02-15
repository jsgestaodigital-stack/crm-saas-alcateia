import { useState } from "react";
import { Plus, UserPlus, Target, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFunnelMode } from "@/contexts/FunnelModeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onNewLead: () => void;
  onNewClient: () => void;
  onNewRecurring: () => void;
}

export function FloatingActionButton({ onNewLead, onNewClient, onNewRecurring }: FloatingActionButtonProps) {
  const { isSalesMode, isRecurringMode } = useFunnelMode();
  const [isHovered, setIsHovered] = useState(false);

  const config = isSalesMode
    ? { icon: Target, label: "Novo Lead", onClick: onNewLead, color: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30" }
    : isRecurringMode
    ? { icon: RefreshCw, label: "Novo Recorrente", onClick: onNewRecurring, color: "bg-violet-500 hover:bg-violet-600 text-white shadow-violet-500/30" }
    : { icon: UserPlus, label: "Novo Cliente", onClick: onNewClient, color: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30" };

  const Icon = config.icon;

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={config.onClick}
        className={cn(
          "h-14 rounded-full shadow-lg transition-all duration-300",
          config.color,
          isHovered ? "px-5 gap-2" : "w-14 px-0"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {config.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
