import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Target,
  Layers,
  CheckSquare,
  UserPlus,
  BarChart3,
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Rocket,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useOnboardingChecklist, ONBOARDING_STEPS } from '@/hooks/useOnboardingChecklist';
import { useFunnelMode } from '@/contexts/FunnelModeContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Target,
  Layers,
  CheckSquare,
  UserPlus,
  BarChart3,
  Sparkles,
};

interface OnboardingChecklistProps {
  onNewClient?: () => void;
  onNewLead?: () => void;
}

export function OnboardingChecklist({ onNewClient, onNewLead }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const { setMode } = useFunnelMode();
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    steps,
    completedSteps,
    completedCount,
    totalSteps,
    progressPercentage,
    isStepCompleted,
    markStepDone,
    unmarkStep,
    toggleStep,
    dismissChecklist,
    shouldShow,
    isLoading,
    isCompleted,
  } = useOnboardingChecklist();

  // Handle step actions
  const handleStepClick = (stepId: string, isCompleted: boolean) => {
    // If already completed, unmark it
    if (isCompleted) {
      unmarkStep(stepId);
      return;
    }

    // Otherwise, mark as done and navigate if needed
    switch (stepId) {
      case 'create_client':
        setMode('delivery');
        onNewClient?.();
        markStepDone(stepId);
        break;
      case 'import_leads':
        setMode('sales');
        onNewLead?.();
        markStepDone(stepId);
        break;
      case 'configure_pipeline':
        setMode('sales');
        markStepDone(stepId);
        break;
      case 'assign_task':
        markStepDone(stepId);
        break;
      case 'invite_member':
        navigate('/equipe');
        markStepDone(stepId);
        break;
      case 'view_dashboard':
        navigate('/relatorio-gestor');
        markStepDone(stepId);
        break;
      case 'explore_agents':
        markStepDone(stepId);
        break;
      default:
        markStepDone(stepId);
    }
  };

  if (isLoading || !shouldShow) {
    return null;
  }

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="mb-6"
      >
        <Card className="border-status-success/30 bg-status-success/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-3">
              <PartyPopper className="h-8 w-8 text-status-success" />
              <div>
                <p className="text-lg font-semibold text-status-success">
                  Parabéns! Onboarding completo!
                </p>
                <p className="text-sm text-muted-foreground">
                  Você está pronto para aproveitar todos os recursos do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Primeiros passos
                  <span className="text-sm font-normal text-muted-foreground">
                    {completedCount}/{totalSteps}
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete as etapas para configurar sua agência
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissChecklist}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progresso</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                <div className="grid gap-2">
                  {steps.map((step, index) => {
                    const isCompleted = isStepCompleted(step.id);
                    const Icon = iconMap[step.icon] || CheckSquare;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() => handleStepClick(step.id, isCompleted)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                            isCompleted
                              ? 'bg-status-success/10 hover:bg-status-success/20 cursor-pointer'
                              : 'hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30'
                          )}
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                              isCompleted
                                ? 'bg-status-success text-white'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {isCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm font-medium truncate',
                                isCompleted && 'text-status-success line-through'
                              )}
                            >
                              {step.label}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {step.description}
                            </p>
                          </div>
                          {isCompleted ? (
                            <span className="text-xs text-status-success/70 font-medium hover:text-destructive">
                              ↩ Desfazer
                            </span>
                          ) : (
                            <span className="text-xs text-primary font-medium">
                              Iniciar →
                            </span>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
