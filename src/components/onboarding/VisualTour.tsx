import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Joyride, { Styles } from 'react-joyride';
import { useVisualTour } from '@/hooks/useVisualTour';
import { useAuth } from '@/contexts/AuthContext';

// Custom styles for the tour
const tourStyles: Partial<Styles> = {
  options: {
    arrowColor: 'hsl(var(--popover))',
    backgroundColor: 'hsl(var(--popover))',
    overlayColor: 'rgba(0, 0, 0, 0.75)',
    primaryColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--popover-foreground))',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
    fontSize: 14,
    lineHeight: 1.6,
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    borderRadius: 8,
    color: 'hsl(var(--primary-foreground))',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 20px',
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
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
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
const ALLOWED_ROUTES = ['/dashboard'];

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

  // Don't render if not on allowed route
  if (!isAllowedRoute) return null;

  // Don't render if no user
  if (!user) return null;

  // Don't auto-start if already completed
  if (tourCompleted) return null;

  // Auto-start tour on first visit (only once per session)
  useEffect(() => {
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
      user && 
      !hasAutoStarted.current &&
      isAllowedRoute &&
      !tourCompleted
    ) {
      console.log('[VisualTour] Auto-starting tour...');
      hasAutoStarted.current = true;
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldAutoStart, user, startTour, isAllowedRoute, tourCompleted]);

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
      callback={handleJoyrideCallback}
      styles={tourStyles}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        open: 'Abrir',
        skip: 'Pular tour',
      }}
      floaterProps={{
        disableAnimation: true,
        hideArrow: false,
      }}
    />
  );
}
