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

  // Read saved mode from localStorage immediately (synchronous)
  const getSavedMode = (): FunnelMode => {
    const saved = localStorage.getItem('rankeia-funnel-mode') as FunnelMode | null;
    if (saved && ['delivery', 'sales', 'recurring'].includes(saved)) {
      return saved;
    }
    return 'delivery';
  };

  // Initialize with saved value immediately to prevent flicker
  const [mode, setModeState] = useState<FunnelMode>(getSavedMode);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Validate mode against permissions once they load
  useEffect(() => {
    if (isLoading || hasInitialized) return;
    
    const saved = localStorage.getItem('rankeia-funnel-mode') as FunnelMode | null;
    
    // If saved mode is valid for user's permissions, keep it
    if (saved === 'sales' && canAccessSales) {
      setModeState('sales');
      setHasInitialized(true);
      return;
    }
    if (saved === 'delivery' && canAccessDelivery) {
      setModeState('delivery');
      setHasInitialized(true);
      return;
    }
    if (saved === 'recurring' && canAccessRecurring) {
      setModeState('recurring');
      setHasInitialized(true);
      return;
    }
    
    // Saved mode not accessible, default to first available
    if (canAccessDelivery) {
      setModeState('delivery');
    } else if (canAccessSales) {
      setModeState('sales');
    } else if (canAccessRecurring) {
      setModeState('recurring');
    }
    
    setHasInitialized(true);
  }, [isLoading, hasInitialized, canAccessSales, canAccessDelivery, canAccessRecurring]);

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
