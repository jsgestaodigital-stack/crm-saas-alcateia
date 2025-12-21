import { usePlanFeatures } from "./usePlanFeatures";

/**
 * Hook para verificar features bloqueadas no trial
 * Retorna booleans indicando quais features premium estão bloqueadas
 */
export function useTrialFeatures() {
  const { isInTrial, hasFeature, rawDbFeatures, isLoading } = usePlanFeatures();
  
  // Check if it's a trial account
  const rawFeatures = rawDbFeatures as Record<string, unknown> | undefined;
  const isTrial = isInTrial || rawFeatures?.is_trial === true;
  
  // Features bloqueadas no trial
  const isExportBlocked = isTrial && !hasFeature('exportacao');
  const isManagerReportBlocked = isTrial && !hasFeature('relatoriosAgencia');
  const isDigitalSignatureBlocked = isTrial && !hasFeature('assinatura_digital');
  
  return {
    isLoading,
    isTrial,
    isExportBlocked,
    isManagerReportBlocked,
    isDigitalSignatureBlocked,
    
    // Helper to check any feature
    isFeatureBlocked: (feature: string): boolean => {
      if (!isTrial) return false;
      return !hasFeature(feature);
    },
  };
}
