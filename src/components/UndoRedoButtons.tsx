import { Undo2, Redo2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUndoRedo } from '@/contexts/UndoRedoContext';
import { useUndoRedoKeyboard } from '@/hooks/useUndoRedoKeyboard';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UndoRedoButtonsProps {
  showHistoryButton?: boolean;
  compact?: boolean;
}

export function UndoRedoButtons({ showHistoryButton = true, compact = false }: UndoRedoButtonsProps) {
  const { canUndo, canRedo, past, future } = useUndoRedo();
  const { undo, redo } = useUndoRedoKeyboard();
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "flex items-center gap-1 rounded-lg p-1",
        !compact && "bg-surface-2/50 border border-border/30"
      )}>
        {/* Undo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              className={cn(
                "h-8 w-8 transition-all",
                canUndo 
                  ? "hover:bg-primary/10 hover:text-primary" 
                  : "opacity-40 cursor-not-allowed"
              )}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="glass">
            <div className="flex flex-col">
              <span className="font-medium">Desfazer</span>
              <span className="text-xs text-muted-foreground">Ctrl+Z</span>
              {past.length > 0 && (
                <span className="text-xs text-muted-foreground mt-1">
                  {past.length} {past.length === 1 ? 'ação' : 'ações'} no histórico
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Redo Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              className={cn(
                "h-8 w-8 transition-all",
                canRedo 
                  ? "hover:bg-primary/10 hover:text-primary" 
                  : "opacity-40 cursor-not-allowed"
              )}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="glass">
            <div className="flex flex-col">
              <span className="font-medium">Refazer</span>
              <span className="text-xs text-muted-foreground">Ctrl+Shift+Z</span>
              {future.length > 0 && (
                <span className="text-xs text-muted-foreground mt-1">
                  {future.length} {future.length === 1 ? 'ação' : 'ações'} para refazer
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* History Button */}
        {showHistoryButton && (
          <>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/historico')}
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all relative"
                >
                  <History className="h-4 w-4" />
                  {(past.length + future.length) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
                      {past.length + future.length > 9 ? '9+' : past.length + future.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="glass">
                <div className="flex flex-col">
                  <span className="font-medium">Histórico de Ações</span>
                  <span className="text-xs text-muted-foreground">Ver todas as ações</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
