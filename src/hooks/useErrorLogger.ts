import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ErrorLogData {
  error_type: string;
  error_message: string;
  error_stack?: string;
  component?: string;
  route?: string;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warn' | 'error' | 'critical';
}

// Debounce to avoid spam
const errorCache = new Map<string, number>();
const DEBOUNCE_MS = 5000; // Same error only logged every 5 seconds

function getErrorKey(error: ErrorLogData): string {
  return `${error.error_type}:${error.error_message.substring(0, 100)}`;
}

function shouldLogError(error: ErrorLogData): boolean {
  const key = getErrorKey(error);
  const lastLogged = errorCache.get(key);
  const now = Date.now();
  
  if (lastLogged && now - lastLogged < DEBOUNCE_MS) {
    return false;
  }
  
  errorCache.set(key, now);
  return true;
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

export function useErrorLogger() {
  const { user, currentAgencyId } = useAuth();
  const isSetup = useRef(false);

  const logError = useCallback(async (errorData: ErrorLogData) => {
    // Debounce check
    if (!shouldLogError(errorData)) {
      return;
    }

    try {
      await supabase.functions.invoke('log-error', {
        body: {
          ...errorData,
          route: window.location.pathname,
          browser: getBrowserInfo(),
          device: getDeviceInfo(),
          agency_id: currentAgencyId || null,
          user_id: user?.id || null,
          user_email: user?.email || null,
        },
      });
    } catch (err) {
      // Silent fail - don't break the app for logging issues
      console.warn('[ErrorLogger] Failed to log error:', err);
    }
  }, [user, currentAgencyId]);

  useEffect(() => {
    if (isSetup.current) return;
    isSetup.current = true;

    // Global error handler
    const handleError = (event: ErrorEvent) => {
      logError({
        error_type: 'uncaught_error',
        error_message: event.message || 'Unknown error',
        error_stack: event.error?.stack,
        component: 'global',
        severity: 'error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    // Unhandled promise rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logError({
        error_type: 'unhandled_rejection',
        error_message: reason?.message || String(reason) || 'Unknown rejection',
        error_stack: reason?.stack,
        component: 'global',
        severity: 'error',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [logError]);

  return { logError };
}

// Manual error logger for specific components
export function logComponentError(
  component: string,
  error: Error | string,
  metadata?: Record<string, unknown>
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  supabase.functions.invoke('log-error', {
    body: {
      error_type: 'component_error',
      error_message: errorMessage,
      error_stack: errorStack,
      component,
      route: window.location.pathname,
      browser: getBrowserInfo(),
      device: getDeviceInfo(),
      metadata,
      severity: 'error',
    },
  }).catch(() => {
    // Silent fail
  });
}
