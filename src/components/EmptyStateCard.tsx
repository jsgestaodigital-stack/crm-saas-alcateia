import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  Repeat, 
  Plus, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateType = 'clients' | 'leads' | 'recurring' | 'tasks' | 'calendar';

interface EmptyStateCardProps {
  type: EmptyStateType;
  onAction?: () => void;
  className?: string;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, {
  icon: React.ElementType;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  tips: string[];
  color: string;
}> = {
  clients: {
    icon: Users,
    emoji: '📋',
    title: 'Nenhum cliente cadastrado ainda',
    description: 'Adicione seu primeiro cliente para começar a gerenciar as otimizações do perfil do Google.',
    actionLabel: 'Adicionar Cliente',
    tips: [
      'Clientes são empresas com contrato fechado',
      'Use o Kanban para acompanhar o progresso',
      'Marque tarefas do checklist conforme avança'
    ],
    color: 'primary'
  },
  leads: {
    icon: Target,
    emoji: '🎯',
    title: 'Nenhuma oportunidade no funil',
    description: 'Comece adicionando leads para acompanhar seu pipeline de vendas.',
    actionLabel: 'Adicionar Lead',
    tips: [
      'Leads são oportunidades em negociação',
      'Use a temperatura para priorizar contatos',
      'Converta leads em clientes ao fechar'
    ],
    color: 'amber'
  },
  recurring: {
    icon: Repeat,
    emoji: '🔄',
    title: 'Nenhum cliente recorrente',
    description: 'Clientes finalizados podem ser convertidos para recorrência mensal.',
    actionLabel: 'Configurar Recorrência',
    tips: [
      'Recorrência é para manutenção mensal',
      'Tarefas são geradas automaticamente',
      'Acompanhe a saúde de cada perfil'
    ],
    color: 'violet'
  },
  tasks: {
    icon: TrendingUp,
    emoji: '✅',
    title: 'Nenhuma tarefa pendente',
    description: 'Parabéns! Você está em dia com todas as suas tarefas.',
    actionLabel: 'Ver Dashboard',
    tips: [
      'Tarefas vêm do checklist de clientes',
      'Priorize por data de vencimento',
      'Use filtros para encontrar tarefas'
    ],
    color: 'green'
  },
  calendar: {
    icon: Calendar,
    emoji: '📅',
    title: 'Agenda vazia',
    description: 'Nenhum compromisso agendado para este período.',
    actionLabel: 'Adicionar Evento',
    tips: [
      'Agende reuniões com clientes e leads',
      'Defina lembretes importantes',
      'Visualize sua semana de forma clara'
    ],
    color: 'blue'
  }
};

export function EmptyStateCard({ type, onAction, className }: EmptyStateCardProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  const colorClasses = {
    primary: 'from-primary/10 to-primary/5 border-primary/20',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
    green: 'from-green-500/10 to-green-500/5 border-green-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20'
  };

  const buttonClasses = {
    primary: 'bg-primary hover:bg-primary/90',
    amber: 'bg-amber-500 hover:bg-amber-600 text-black',
    violet: 'bg-violet-500 hover:bg-violet-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6",
        "rounded-2xl border bg-gradient-to-b",
        colorClasses[config.color as keyof typeof colorClasses],
        className
      )}
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 animate-ping opacity-20">
          <Icon className="h-16 w-16" />
        </div>
        <div className="relative p-4 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/30 shadow-lg">
          <span className="text-4xl">{config.emoji}</span>
        </div>
      </motion.div>

      {/* Title and description */}
      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
        {config.title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        {config.description}
      </p>

      {/* CTA Button */}
      {onAction && (
        <Button
          onClick={onAction}
          size="lg"
          className={cn(
            "gap-2 mb-8 shadow-lg",
            buttonClasses[config.color as keyof typeof buttonClasses]
          )}
        >
          <Plus className="h-4 w-4" />
          {config.actionLabel}
        </Button>
      )}

      {/* Tips section */}
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Dicas rápidas
        </p>
        <ul className="space-y-2">
          {config.tips.map((tip, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
              {tip}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
