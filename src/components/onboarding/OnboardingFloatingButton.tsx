import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist';

interface OnboardingFloatingButtonProps {
  onClick: () => void;
}

export function OnboardingFloatingButton({ onClick }: OnboardingFloatingButtonProps) {
  const { completedCount, totalSteps, progressPercentage, shouldShow, isDismissed } = useOnboardingChecklist();
  const [isHovered, setIsHovered] = useState(false);

  // Only show if dismissed but not completed
  if (!isDismissed || shouldShow) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: '-100%' }}
            animate={{ opacity: 1, y: 0, x: '-100%' }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-2 mr-2 px-3 py-2 bg-popover rounded-lg shadow-lg border whitespace-nowrap"
          >
            <p className="text-sm font-medium">Retomar onboarding</p>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalSteps} passos ({progressPercentage}%)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg hover-lift relative',
          'bg-gradient-to-br from-primary to-violet-600 hover:from-primary/90 hover:to-violet-500',
          'text-white'
        )}
      >
        <Rocket className="h-6 w-6" />
        
        {/* Progress indicator */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeDasharray={`${progressPercentage * 2.89} 289`}
            strokeLinecap="round"
          />
        </svg>
      </Button>
    </motion.div>
  );
}
