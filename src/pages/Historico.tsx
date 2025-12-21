import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  History, 
  Undo2, 
  Redo2, 
  Clock, 
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUndoRedo, Action } from '@/contexts/UndoRedoContext';
import { useFunnelMode } from '@/contexts/FunnelModeContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const ACTION_TYPE_CONFIG: Record<string, { icon: typeof History; color: string; label: string }> = {
  'CLIENT_MOVE': { icon: RefreshCw, color: 'text-blue-400', label: 'Movimentação' },
  'CLIENT_UPDATE': { icon: CheckCircle, color: 'text-green-400', label: 'Atualização' },
  'CLIENT_CREATE': { icon: CheckCircle, color: 'text-primary', label: 'Criação' },
  'LEAD_MOVE': { icon: RefreshCw, color: 'text-amber-400', label: 'Movimentação' },
  'LEAD_UPDATE': { icon: CheckCircle, color: 'text-amber-400', label: 'Atualização' },
  'LEAD_CREATE': { icon: CheckCircle, color: 'text-amber-400', label: 'Criação' },
  'CHECKLIST_CHECK': { icon: CheckCircle, color: 'text-green-400', label: 'Checklist' },
  'CHECKLIST_UNCHECK': { icon: XCircle, color: 'text-muted-foreground', label: 'Checklist' },
  'default': { icon: History, color: 'text-muted-foreground', label: 'Ação' },
};

export default function HistoricoPage() {
  const navigate = useNavigate();
  const { past, future, undo, redo, clear, canUndo, canRedo } = useUndoRedo();
  const { isSalesMode } = useFunnelMode();
  const [isProcessing, setIsProcessing] = useState(false);

  // Combine past and future for display, marking which is which
  const allActions = [
    ...future.map((a, i) => ({ ...a, isFuture: true, index: i })),
    ...past.slice().reverse().map((a, i) => ({ ...a, isFuture: false, index: i })),
  ];

  const handleUndo = async () => {
    if (isProcessing || !canUndo) return;
    setIsProcessing(true);
    try {
      await undo();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedo = async () => {
    if (isProcessing || !canRedo) return;
    setIsProcessing(true);
    try {
      await redo();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    if (confirm('Limpar todo o histórico de ações? Esta ação não pode ser desfeita.')) {
      clear();
      toast.success('Histórico limpo');
    }
  };

  const getActionConfig = (type: string) => {
    return ACTION_TYPE_CONFIG[type] || ACTION_TYPE_CONFIG['default'];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 h-16 z-40 backdrop-blur-xl border-b flex items-center justify-between px-6",
        isSalesMode 
          ? "bg-background/90 border-amber-500/20" 
          : "bg-background/80 border-border/50"
      )}>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <History className={cn(
              "h-6 w-6",
              isSalesMode ? "text-amber-400" : "text-primary"
            )} />
            <h1 className="text-xl font-bold">Histórico de Ações</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo || isProcessing}
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Desfazer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo || isProcessing}
            className="gap-2"
          >
            <Redo2 className="h-4 w-4" />
            Refazer
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={allActions.length === 0}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 px-6 pb-8 max-w-4xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Undo2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{past.length}</p>
                <p className="text-xs text-muted-foreground">Ações para desfazer</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Redo2 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{future.length}</p>
                <p className="text-xs text-muted-foreground">Ações para refazer</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/30">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{allActions.length}</p>
                <p className="text-xs text-muted-foreground">Total no histórico</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts info */}
        <div className="bg-surface-2/50 rounded-xl p-4 mb-6 border border-border/30">
          <p className="text-sm text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">Z</kbd>
              <span>= Desfazer</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">Shift</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">Z</kbd>
              <span>= Refazer</span>
            </span>
          </p>
        </div>

        {/* Actions List */}
        {allActions.length === 0 ? (
          <div className="text-center py-16">
            <History className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              Nenhuma ação no histórico
            </h2>
            <p className="text-sm text-muted-foreground">
              As ações que você realizar no sistema aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allActions.map((action, idx) => {
              const config = getActionConfig(action.type);
              const Icon = config.icon;
              
              return (
                <div
                  key={action.id}
                  className={cn(
                    "glass-card rounded-xl p-4 transition-all hover:scale-[1.01]",
                    action.isFuture && "opacity-50 border-dashed"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        action.isFuture ? "bg-muted/30" : "bg-surface-2"
                      )}>
                        <Icon className={cn("h-5 w-5", config.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{action.description}</span>
                          {action.isFuture && (
                            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                              DESFEITO
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px]">
                            {config.label}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(action.timestamp), "dd/MM HH:mm:ss", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {action.isFuture ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRedo}
                          disabled={isProcessing}
                          className="text-xs gap-1 hover:text-primary"
                        >
                          <Redo2 className="h-3 w-3" />
                          Refazer
                        </Button>
                      ) : idx === future.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleUndo}
                          disabled={isProcessing}
                          className="text-xs gap-1 hover:text-primary"
                        >
                          <Undo2 className="h-3 w-3" />
                          Desfazer
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
