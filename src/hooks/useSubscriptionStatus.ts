import { useSubscription } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionBlockStatus = 'active' | 'blocked' | 'loading';

const BLOCKED_STATUSES = ['past_due', 'cancelled', 'expired'];

export function useSubscriptionStatus() {
  const { subscription, isLoading } = useSubscription();
  const { permissions, isLoading: authLoading } = useAuth();

  const isBlocked = (): boolean => {
    // Super admins are never blocked
    if (permissions?.isSuperAdmin) {
      return false;
    }

    // If no subscription, consider blocked (unless still loading)
    if (!subscription) {
      return !isLoading;
    }

    // Check if subscription status is in blocked list
    return BLOCKED_STATUSES.includes(subscription.status);
  };

  const getStatus = (): SubscriptionBlockStatus => {
    if (isLoading || authLoading) {
      return 'loading';
    }

    return isBlocked() ? 'blocked' : 'active';
  };

  return {
    status: getStatus(),
    isBlocked: isBlocked(),
    isLoading: isLoading || authLoading,
    subscription,
    isSuperAdmin: permissions?.isSuperAdmin ?? false
  };
}
