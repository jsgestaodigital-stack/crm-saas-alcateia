import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Play, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 relative',
            !tourCompleted && 'animate-pulse'
          )}
        >
          <HelpCircle className="h-5 w-5" />
          {!tourCompleted && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={startTour} className="cursor-pointer">
          <Play className="h-4 w-4 mr-2" />
          {tourCompleted ? 'Refazer tour' : 'Iniciar tour guiado'}
        </DropdownMenuItem>
        
        {tourCompleted && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            <Check className="h-4 w-4 mr-2" />
            Tour concluído
          </DropdownMenuItem>
        )}

        {canResetTour && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={resetTour} 
              className="cursor-pointer text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar tour (Admin)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
