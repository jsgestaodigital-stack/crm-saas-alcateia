import { useEffect } from 'react';
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

interface VisualTourProps {
  autoStart?: boolean;
}

export function VisualTour({ autoStart = false }: VisualTourProps) {
  const location = useLocation();
  const { user } = useAuth();
  const {
    steps,
    isRunning,
    stepIndex,
    shouldAutoStart,
    startTour,
    handleJoyrideCallback,
  } = useVisualTour();

  // Never run tour on auth screen.
  if (location.pathname === '/auth') return null;

  // Auto-start tour on first visit (disabled by default)
  useEffect(() => {
    if (autoStart && shouldAutoStart && user) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldAutoStart, user, startTour]);

  if (!user) return null;

  return (
    <Joyride
      steps={steps}
      run={isRunning}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      hideCloseButton={false}
      scrollToFirstStep
      spotlightClicks={false}
      disableOverlayClose
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
        disableAnimation: false,
      }}
    />
  );
}
