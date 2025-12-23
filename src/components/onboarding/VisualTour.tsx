import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Joyride, { Styles, CallBackProps } from 'react-joyride';
import { useVisualTour, TOUR_STEPS } from '@/hooks/useVisualTour';
import { useAuth } from '@/contexts/AuthContext';

// Custom styles for the tour
const tourStyles: Partial<Styles> = {
  options: {
    arrowColor: 'hsl(var(--popover))',
    backgroundColor: 'hsl(var(--popover))',
    overlayColor: 'rgba(0, 0, 0, 0.8)',
    primaryColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--popover-foreground))',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    maxWidth: 420,
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
  },
  tooltipContent: {
    fontSize: 15,
    lineHeight: 1.7,
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    borderRadius: 8,
    color: 'hsl(var(--primary-foreground))',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px 24px',
  },
  buttonBack: {
    color: 'hsl(var(--muted-foreground))',
    fontSize: 14,
    marginRight: 10,
  },
  buttonSkip: {
    color: 'hsl(var(--muted-foreground))',
    fontSize: 13,
  },
  buttonClose: {
    color: 'hsl(var(--muted-foreground))',
  },
  spotlight: {
    borderRadius: 12,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
  },
  beacon: {
    display: 'none',
  },
  beaconInner: {
    display: 'none',
  },
  beaconOuter: {
    display: 'none',
  },
};

// Routes where tour SHOULD run (only dashboard has all required elements)
const ALLOWED_ROUTES = ['/', '/dashboard'];

// Steps that require opening collapsible sections
const STEPS_REQUIRING_COMERCIAL = ['section-commercial', 'proposals', 'contracts', 'raiox'];
const STEPS_REQUIRING_FERRAMENTAS = ['section-tools', 'agent-seo', 'agent-suspensions', 'agent-reports', 'questions'];

// Helper to open collapsible sections
const openCollapsibleSection = (tourId: string) => {
  const section = document.querySelector(`[data-tour="${tourId}"]`);
  if (section) {
    const parent = section.closest('[data-state]');
    if (parent?.getAttribute('data-state') === 'closed') {
      (section as HTMLElement).click();
    }
  }
};

interface VisualTourProps {
  autoStart?: boolean;
}

export function VisualTour({ autoStart = false }: VisualTourProps) {
  const location = useLocation();
  const { user } = useAuth();
  const hasAutoStarted = useRef(false);
  const {
    steps,
    isRunning,
    stepIndex,
    shouldAutoStart,
    tourCompleted,
    startTour,
    handleJoyrideCallback,
  } = useVisualTour();

  // Only run tour on dashboard where all elements exist
  const isAllowedRoute = ALLOWED_ROUTES.includes(location.pathname);

  // Open collapsible sections before showing their steps
  const prepareStep = useCallback((stepId: string) => {
    // Open both sections for any commercial or tool step
    if (STEPS_REQUIRING_COMERCIAL.includes(stepId)) {
      openCollapsibleSection('section-comercial');
    }
    
    if (STEPS_REQUIRING_FERRAMENTAS.includes(stepId)) {
      openCollapsibleSection('section-ferramentas');
    }
  }, []);

  // Enhanced callback that prepares steps before showing them
  const enhancedCallback = useCallback((data: CallBackProps) => {
    const { type, index, action } = data;
    
    // When about to show a step, prepare it
    if ((type === 'step:before' || type === 'step:after') && index < TOUR_STEPS.length) {
      const nextIndex = type === 'step:after' ? index + 1 : index;
      if (nextIndex < TOUR_STEPS.length) {
        const stepId = TOUR_STEPS[nextIndex].id;
        
        // Open necessary sections
        if (STEPS_REQUIRING_COMERCIAL.includes(stepId)) {
          openCollapsibleSection('section-comercial');
        }
        if (STEPS_REQUIRING_FERRAMENTAS.includes(stepId)) {
          openCollapsibleSection('section-ferramentas');
        }
      }
    }
    
    // Call the original handler
    handleJoyrideCallback(data);
  }, [handleJoyrideCallback]);

  // Auto-start tour on first visit (only once per session)
  useEffect(() => {
    if (!isAllowedRoute || !user) return;

    console.log('[VisualTour] Mount state:', { 
      autoStart, 
      shouldAutoStart, 
      user: !!user, 
      hasAutoStarted: hasAutoStarted.current,
      isAllowedRoute,
      tourCompleted 
    });
    
    if (
      autoStart && 
      shouldAutoStart && 
      !hasAutoStarted.current &&
      !tourCompleted
    ) {
      console.log('[VisualTour] Auto-starting tour...');
      hasAutoStarted.current = true;
      
      // Open both sections before starting
      const timer = setTimeout(() => {
        // Open Comercial section
        const comercialSection = document.querySelector('[data-tour="section-comercial"]');
        if (comercialSection) {
          (comercialSection as HTMLElement).click();
        }
        
        // Open Ferramentas section
        setTimeout(() => {
          const ferramentasSection = document.querySelector('[data-tour="section-ferramentas"]');
          if (ferramentasSection) {
            (ferramentasSection as HTMLElement).click();
          }
          
          // Start tour after sections are open
          setTimeout(() => {
            startTour();
          }, 300);
        }, 100);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldAutoStart, user, startTour, isAllowedRoute, tourCompleted]);

  // Don't render if not on allowed route or no user
  if (!isAllowedRoute || !user) return null;

  console.log('[VisualTour] Render state:', { isRunning, stepIndex, stepsLength: steps.length });

  return (
    <Joyride
      steps={steps}
      run={isRunning && isAllowedRoute}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      hideCloseButton={false}
      scrollToFirstStep
      spotlightClicks={false}
      disableOverlayClose={false}
      disableCloseOnEsc={false}
      disableScrolling={false}
      callback={enhancedCallback}
      styles={tourStyles}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        open: 'Abrir',
        skip: 'Pular tour',
      }}
      floaterProps={{
        disableAnimation: false,
        hideArrow: false,
      }}
    />
  );
}
