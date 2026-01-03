import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Rocket, ArrowRight, X, Play, BookOpen, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useVisualTour } from '@/hooks/useVisualTour';
import { cn } from '@/lib/utils';

interface WelcomeCardProps {
  onNewClient?: () => void;
  onNewLead?: () => void;
  onDismiss?: () => void;
}

/**
 * WelcomeCard - Primeira impressão para novos usuários
 * Aparece apenas para usuários que nunca viram antes
 */
export function WelcomeCard({ onNewClient, onNewLead, onDismiss }: WelcomeCardProps) {
  const { user } = useAuth();
  const { startTour, tourCompleted } = useVisualTour();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('gbrank-welcome-dismissed') === 'true';
  });

  // Don't show if already dismissed or tour completed
  if (dismissed || tourCompleted) return null;

  const handleDismiss = () => {
    localStorage.setItem('gbrank-welcome-dismissed', 'true');
    setDismissed(true);
    onDismiss?.();
  };

  const handleStartTour = () => {
    startTour();
    handleDismiss();
  };

  // Get user's first name from email if name not available
  const getUserFirstName = () => {
    if (!user) return 'usuário';
    const email = user.email || '';
    const emailName = email.split('@')[0];
    // Capitalize first letter
    return emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
  };
  
  const userName = getUserFirstName();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6"
      >
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-violet-500/10">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>

          <CardContent className="relative z-10 pt-6 pb-6">
            {/* Header with greeting */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-violet-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Bem-vindo ao GBRank, {userName}! 🎉
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sua plataforma completa para gestão de perfis do Google Meu Negócio está pronta.
                </p>
              </div>
            </div>

            {/* Quick actions grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <QuickActionCard
                icon={Play}
                title="Fazer tour guiado"
                description="Conheça todas as funcionalidades"
                onClick={handleStartTour}
                highlight
              />
              <QuickActionCard
                icon={Target}
                title="Adicionar Lead"
                description="Comece pelo funil de vendas"
                onClick={() => {
                  onNewLead?.();
                  handleDismiss();
                }}
              />
              <QuickActionCard
                icon={Users}
                title="Cadastrar Cliente"
                description="Para quem já fechou contrato"
                onClick={() => {
                  onNewClient?.();
                  handleDismiss();
                }}
              />
            </div>

            {/* Secondary info */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Precisa de ajuda? Clique no botão "?" a qualquer momento.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Pular introdução
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  highlight = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-xl transition-all text-left w-full",
        "border hover:shadow-lg",
        highlight
          ? "bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50"
          : "bg-card/50 border-border/30 hover:bg-card hover:border-border/50"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 p-2 rounded-lg transition-colors",
          highlight
            ? "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className={cn(
          "font-medium text-sm mb-0.5 flex items-center gap-1",
          highlight ? "text-primary" : "text-foreground"
        )}>
          {title}
          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </button>
  );
}
