import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
}

/**
 * Hook for automatic data refresh at specified intervals
 * Item 6: Custom hook for reusable logic
 */
export function useAutoRefresh({
  interval = 60000, // default: 1 minute
  enabled = true,
  onRefresh,
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      await onRefresh();
      lastRefreshRef.current = new Date();
    } catch (error) {
      console.error('[useAutoRefresh] Refresh failed:', error);
    }
  }, [onRefresh]);

  const startRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(refresh, interval);
  }, [interval, refresh]);

  const stopRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const forceRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (enabled) {
      startRefresh();
    } else {
      stopRefresh();
    }

    return () => {
      stopRefresh();
    };
  }, [enabled, startRefresh, stopRefresh]);

  return {
    lastRefresh: lastRefreshRef.current,
    forceRefresh,
    startRefresh,
    stopRefresh,
  };
}
