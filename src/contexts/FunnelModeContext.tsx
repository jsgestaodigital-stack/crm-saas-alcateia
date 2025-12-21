import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type FunnelMode = 'delivery' | 'sales' | 'recurring';

interface FunnelModeContextType {
  mode: FunnelMode;
  setMode: (mode: FunnelMode) => void;
  toggleMode: () => void;
  isSalesMode: boolean;
  isDeliveryMode: boolean;
  isRecurringMode: boolean;
  canAccessSales: boolean;
  canAccessDelivery: boolean;
  canAccessRecurring: boolean;
}

const FunnelModeContext = createContext<FunnelModeContextType | undefined>(undefined);

export function FunnelModeProvider({ children }: { children: ReactNode }) {
  const { derived, isLoading } = useAuth();
  
  // Determine accessible modes based on permissions
  const canAccessSales = derived?.canSalesOrAdmin ?? false;
  const canAccessDelivery = derived?.canOpsOrAdmin ?? false;
  const canAccessRecurring = derived?.canRecurringOrAdmin ?? false;

  // Default mode based on permissions
  const getDefaultMode = (): FunnelMode => {
    const saved = localStorage.getItem('rankeia-funnel-mode') as FunnelMode | null;
    
    // If user has saved preference and can access it, use it
    if (saved === 'sales' && canAccessSales) return 'sales';
    if (saved === 'delivery' && canAccessDelivery) return 'delivery';
    if (saved === 'recurring' && canAccessRecurring) return 'recurring';
    
    // Otherwise default to first available
    if (canAccessDelivery) return 'delivery';
    if (canAccessSales) return 'sales';
    if (canAccessRecurring) return 'recurring';
    
    return 'delivery'; // Fallback
  };

  const [mode, setModeState] = useState<FunnelMode>('delivery');

  // Update mode when permissions load
  useEffect(() => {
    if (!isLoading) {
      setModeState(getDefaultMode());
    }
  }, [isLoading, canAccessSales, canAccessDelivery, canAccessRecurring]);

  useEffect(() => {
    localStorage.setItem('rankeia-funnel-mode', mode);
    
    // Update body class for global theming
    document.body.classList.remove('mode-sales', 'mode-delivery', 'mode-recurring');
    document.body.classList.add(`mode-${mode}`);
  }, [mode]);

  const setMode = useCallback((newMode: FunnelMode) => {
    // Only allow switching to modes the user has access to
    if (newMode === 'sales' && !canAccessSales) return;
    if (newMode === 'delivery' && !canAccessDelivery) return;
    if (newMode === 'recurring' && !canAccessRecurring) return;
    
    // When switching modes, reset view to kanban
    // We dispatch a custom event that the Dashboard can listen to
    if (newMode !== mode) {
      window.dispatchEvent(new CustomEvent('funnel-mode-changed', { detail: { newMode } }));
    }
    
    setModeState(newMode);
  }, [mode, canAccessSales, canAccessDelivery, canAccessRecurring]);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      // Cycle through available modes
      const modes: FunnelMode[] = [];
      if (canAccessDelivery) modes.push('delivery');
      if (canAccessSales) modes.push('sales');
      if (canAccessRecurring) modes.push('recurring');
      
      if (modes.length <= 1) return prev;
      
      const currentIndex = modes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % modes.length;
      return modes[nextIndex];
    });
  }, [canAccessSales, canAccessDelivery, canAccessRecurring]);

  return (
    <FunnelModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isSalesMode: mode === 'sales',
        isDeliveryMode: mode === 'delivery',
        isRecurringMode: mode === 'recurring',
        canAccessSales,
        canAccessDelivery,
        canAccessRecurring,
      }}
    >
      {children}
    </FunnelModeContext.Provider>
  );
}

export function useFunnelMode() {
  const context = useContext(FunnelModeContext);
  if (!context) {
    throw new Error('useFunnelMode must be used within a FunnelModeProvider');
  }
  return context;
}
