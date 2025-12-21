import { useSubscription } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionBlockStatus = 'active' | 'blocked' | 'loading';

const BLOCKED_STATUSES = ['past_due', 'cancelled', 'expired'];

export function useSubscriptionStatus() {
  const { subscription, features, isLoading } = useSubscription();
  const { permissions, isLoading: authLoading } = useAuth();

  const isSuperAdmin = permissions?.isSuperAdmin ?? false;
  const loading = isLoading || authLoading;

  const backendStatus = features?.status;
  const allowAccessWithoutSubscription =
    backendStatus === "trial" || backendStatus === "active";

  const blocked = (() => {
    // Super admins are never blocked
    if (isSuperAdmin) return false;

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
