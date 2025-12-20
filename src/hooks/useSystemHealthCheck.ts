import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  database: 'healthy' | 'degraded' | 'down' | 'unknown';
  auth: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastCheck: Date | null;
  isChecking: boolean;
}

/**
 * Hook for monitoring system health
 * Item 6: Custom hook for reusable logic
 * Item 8: Logging for debugging
 */
export function useSystemHealthCheck(checkInterval = 300000) { // 5 minutes default
  const [health, setHealth] = useState<HealthStatus>({
    database: 'unknown',
    auth: 'unknown',
    lastCheck: null,
    isChecking: false,
  });

  const checkHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, isChecking: true }));
    
    const newHealth: HealthStatus = {
      database: 'unknown',
      auth: 'unknown',
      lastCheck: new Date(),
      isChecking: false,
    };

    // Check database connectivity
    try {
      const start = Date.now();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latency = Date.now() - start;
      
      if (error) {
        console.error('[HealthCheck] Database error:', error.message);
        newHealth.database = 'down';
      } else if (latency > 2000) {
        console.warn('[HealthCheck] Database slow:', latency, 'ms');
        newHealth.database = 'degraded';
      } else {
        newHealth.database = 'healthy';
      }
    } catch (err) {
      console.error('[HealthCheck] Database check failed:', err);
      newHealth.database = 'down';
    }

    // Check auth status
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[HealthCheck] Auth error:', error.message);
        newHealth.auth = 'degraded';
      } else {
        newHealth.auth = 'healthy';
      }
    } catch (err) {
      console.error('[HealthCheck] Auth check failed:', err);
      newHealth.auth = 'down';
    }

    setHealth(newHealth);
    console.log('[HealthCheck] Status:', newHealth);
    
    return newHealth;
  }, []);

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up interval
    const interval = setInterval(checkHealth, checkInterval);

    return () => clearInterval(interval);
  }, [checkHealth, checkInterval]);

  return {
    ...health,
    checkHealth,
    isHealthy: health.database === 'healthy' && health.auth === 'healthy',
  };
}
