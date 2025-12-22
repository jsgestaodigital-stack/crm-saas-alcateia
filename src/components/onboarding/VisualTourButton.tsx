import { HelpCircle, Play, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVisualTour } from '@/hooks/useVisualTour';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function VisualTourButton() {
  const { user, derived } = useAuth();
  const { 
    tourCompleted, 
    startTour, 
    resetTour, 
    isLoading 
  } = useVisualTour();

  const canResetTour = derived?.canAdminOrIsAdmin;

  if (!user || isLoading) return null;

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-9 relative hover:bg-primary/10 transition-all',
                  !tourCompleted && 'animate-pulse'
                )}
              >
                <HelpCircle className="h-5 w-5" />
                {!tourCompleted && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Tour guiado do sistema</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-56 glass">
          <DropdownMenuItem onClick={startTour} className="cursor-pointer gap-2">
            <Play className="h-4 w-4" />
            {tourCompleted ? 'Refazer tour guiado' : 'Iniciar tour guiado'}
          </DropdownMenuItem>
          
          {tourCompleted && (
            <DropdownMenuItem disabled className="text-muted-foreground gap-2">
              <Check className="h-4 w-4" />
              Tour concluído ✓
            </DropdownMenuItem>
          )}

          {canResetTour && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={resetTour} 
                className="cursor-pointer text-muted-foreground gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar tour (Admin)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
