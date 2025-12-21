import React from "react";
import { usePlanFeatures, PlanFeatureFlags } from "@/hooks/usePlanFeatures";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PlanAccessBlockedProps {
  requiredFeatures: string[];
  minimumPlan?: 'pro' | 'master';
}

const PlanAccessBlocked: React.FC<PlanAccessBlockedProps> = ({ requiredFeatures, minimumPlan }) => {
  const planLabel = minimumPlan === 'master' ? 'Master' : 'Pro ou superior';
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Funcionalidade Premium</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        Esta funcionalidade está disponível apenas no plano <strong>{planLabel}</strong>.
      </p>
      <Button asChild variant="default">
        <Link to="/admin/plan" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Fazer Upgrade
        </Link>
      </Button>
    </div>
  );
};

/**
 * Higher-Order Component para proteger componentes baseado em features do plano
 * 
 * @example
 * export default withPlanAccess(['automacoes', 'comissoes'], MyComponent);
 * 
 * @example
 * export default withPlanAccess(['dashboard_financeiro'], MyComponent, { minimumPlan: 'master' });
 */
export function withPlanAccess<P extends object>(
  requiredFeatures: (keyof PlanFeatureFlags | string)[],
  Component: React.ComponentType<P>,
  options?: { minimumPlan?: 'pro' | 'master' }
): React.FC<P> {
  return function GuardedComponent(props: P) {
    const { hasAllFeatures, isLoading, isProOrHigher, isMasterOnly } = usePlanFeatures();
    
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    // Check minimum plan tier if specified
    if (options?.minimumPlan === 'master' && !isMasterOnly) {
      return <PlanAccessBlocked requiredFeatures={requiredFeatures as string[]} minimumPlan="master" />;
    }
    
    if (options?.minimumPlan === 'pro' && !isProOrHigher) {
      return <PlanAccessBlocked requiredFeatures={requiredFeatures as string[]} minimumPlan="pro" />;
    }
    
    // Check specific features
    if (!hasAllFeatures(requiredFeatures)) {
      return <PlanAccessBlocked requiredFeatures={requiredFeatures as string[]} minimumPlan={options?.minimumPlan} />;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Component wrapper para proteger seções específicas de uma página
 * 
 * @example
 * <PlanFeatureGate features={['automacoes']}>
 *   <AutomationSettings />
 * </PlanFeatureGate>
 */
export const PlanFeatureGate: React.FC<{
  features: (keyof PlanFeatureFlags | string)[];
  minimumPlan?: 'pro' | 'master';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ features, minimumPlan, fallback, children }) => {
  const { hasAllFeatures, isLoading, isProOrHigher, isMasterOnly } = usePlanFeatures();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Check minimum plan tier
  if (minimumPlan === 'master' && !isMasterOnly) {
    return fallback ? <>{fallback}</> : <PlanAccessBlocked requiredFeatures={features as string[]} minimumPlan="master" />;
  }
  
  if (minimumPlan === 'pro' && !isProOrHigher) {
    return fallback ? <>{fallback}</> : <PlanAccessBlocked requiredFeatures={features as string[]} minimumPlan="pro" />;
  }
  
  // Check specific features
  if (!hasAllFeatures(features)) {
    return fallback ? <>{fallback}</> : <PlanAccessBlocked requiredFeatures={features as string[]} minimumPlan={minimumPlan} />;
  }
  
  return <>{children}</>;
};

/**
 * Hook-based check para usar em lógica condicional
 * 
 * @example
 * const canExport = usePlanFeatureCheck(['exportacao']);
 * if (canExport) { ... }
 */
export function usePlanFeatureCheck(features: (keyof PlanFeatureFlags | string)[]): boolean {
  const { hasAllFeatures, isLoading } = usePlanFeatures();
  
  if (isLoading) return false;
  return hasAllFeatures(features);
}
