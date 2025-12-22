import { useSubscription } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionBlockStatus = 'active' | 'blocked' | 'loading';

const BLOCKED_STATUSES = ['past_due', 'cancelled', 'expired'];

export function useSubscriptionStatus() {
  const { subscription, features, isLoading } = useSubscription();
  const { permissions, isLoading: authLoading, isAdmin, userRole } = useAuth();

  // Super admin check - multiple fallbacks to ensure it's detected
  const isSuperAdmin = permissions?.isSuperAdmin ?? false;
  
  // Also check if user has admin role as additional safeguard
  const hasAdminPrivileges = isSuperAdmin || (isAdmin && userRole === 'admin');
  
  const loading = isLoading || authLoading;

  const backendStatus = features?.status;
  const allowAccessWithoutSubscription =
    backendStatus === "trial" || backendStatus === "active";

  const blocked = (() => {
    // Super admins are NEVER blocked - primary check
    if (isSuperAdmin) return false;
    
    // Admin with admin role also bypasses (fallback safety)
    if (hasAdminPrivileges && permissions?.canAdmin) return false;

    // While still loading auth, don't block
    if (authLoading) return false;

    // Defensive: if subscription row is missing but backend says trial/active, allow
    if (!subscription) {
      if (allowAccessWithoutSubscription) return false;
      return !isLoading;
    }

    // Trial is allowed
    if (subscription.status === "trial") return false;

    // Block only known inactive statuses
    return BLOCKED_STATUSES.includes(subscription.status);
  })();

  return {
    status: loading ? "loading" : blocked ? "blocked" : "active",
    isBlocked: blocked,
    isLoading: loading,
    subscription,
    isSuperAdmin,
  };
}
