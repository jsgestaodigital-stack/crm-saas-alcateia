import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Types
export interface NavigationLog {
  id: string;
  timestamp: Date;
  from: string;
  to: string;
  reason: 'click' | 'redirect' | 'guard' | 'back' | 'forward' | 'manual';
  component?: string;
}

export interface APILog {
  id: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  status: number | null;
  duration: number;
  error?: string;
  requestBody?: unknown;
  responseBody?: unknown;
}

export interface UIEvent {
  id: string;
  timestamp: Date;
  type: 'click' | 'submit' | 'change' | 'focus' | 'blur' | 'keydown' | 'back';
  target: string;
  component?: string;
  details?: string;
}

export interface JSError {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
}

export interface SessionState {
  isLoggedIn: boolean;
  userId?: string;
  userEmail?: string;
  role?: string;
  agencyId?: string;
  permissions?: Record<string, boolean>;
  lastRefresh?: Date;
}

interface QADebugContextType {
  isEnabled: boolean;
  isDrawerOpen: boolean;
  toggleEnabled: () => void;
  toggleDrawer: () => void;
  
  // Logs
  navigationLogs: NavigationLog[];
  apiLogs: APILog[];
  uiEvents: UIEvent[];
  jsErrors: JSError[];
  sessionState: SessionState;
  
  // Actions
  logNavigation: (log: Omit<NavigationLog, 'id' | 'timestamp'>) => void;
  logAPI: (log: Omit<APILog, 'id' | 'timestamp'>) => void;
  logUIEvent: (log: Omit<UIEvent, 'id' | 'timestamp'>) => void;
  logJSError: (log: Omit<JSError, 'id' | 'timestamp'>) => void;
  
  // Simulations
  simulate401: () => void;
  simulateOffline: () => void;
  clearLocalStorage: () => void;
  resetState: () => void;
  forceRefreshSession: () => void;
  
  // Bug Report
  generateBugReport: () => string;
  
  // Clear logs
  clearLogs: () => void;
}

const QADebugContext = createContext<QADebugContextType | null>(null);

const MAX_LOGS = 100;
const generateId = () => Math.random().toString(36).substring(2, 9);

export function QADebugProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isEnabled, setIsEnabled] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('qa') === '1' || localStorage.getItem('qa_debug') === '1';
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [navigationLogs, setNavigationLogs] = useState<NavigationLog[]>([]);
  const { user, userRole, session, refreshPermissions, signOut } = useAuth();
  const [apiLogs, setApiLogs] = useState<APILog[]>([]);
  const [uiEvents, setUIEvents] = useState<UIEvent[]>([]);
  const [jsErrors, setJSErrors] = useState<JSError[]>([]);
  
  const previousPath = useRef(location.pathname);
  const isOfflineSimulated = useRef(false);

  // Session state derived from auth
  const sessionState: SessionState = {
    isLoggedIn: !!user,
    userId: user?.id,
    userEmail: user?.email,
    role: userRole ?? undefined,
    agencyId: undefined, // Would need to be fetched from profile
    permissions: undefined,
    lastRefresh: new Date(),
  };

  // Toggle functions
  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        localStorage.setItem('qa_debug', '1');
      } else {
        localStorage.removeItem('qa_debug');
      }
      return newValue;
    });
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  // Logging functions
  const logNavigation = useCallback((log: Omit<NavigationLog, 'id' | 'timestamp'>) => {
    if (!isEnabled) return;
    setNavigationLogs(prev => [
      { ...log, id: generateId(), timestamp: new Date() },
      ...prev.slice(0, MAX_LOGS - 1)
    ]);
  }, [isEnabled]);

  const logAPI = useCallback((log: Omit<APILog, 'id' | 'timestamp'>) => {
    if (!isEnabled) return;
    setApiLogs(prev => [
      { ...log, id: generateId(), timestamp: new Date() },
      ...prev.slice(0, MAX_LOGS - 1)
    ]);
  }, [isEnabled]);

  const logUIEvent = useCallback((log: Omit<UIEvent, 'id' | 'timestamp'>) => {
    if (!isEnabled) return;
    setUIEvents(prev => [
      { ...log, id: generateId(), timestamp: new Date() },
      ...prev.slice(0, MAX_LOGS - 1)
    ]);
  }, [isEnabled]);

  const logJSError = useCallback((log: Omit<JSError, 'id' | 'timestamp'>) => {
    if (!isEnabled) return;
    setJSErrors(prev => [
      { ...log, id: generateId(), timestamp: new Date() },
      ...prev.slice(0, MAX_LOGS - 1)
    ]);
  }, [isEnabled]);

  // Simulation functions
  const simulate401 = useCallback(() => {
    logAPI({
      endpoint: '/simulated/401',
      method: 'GET',
      status: 401,
      duration: 0,
      error: 'Simulated 401 Unauthorized'
    });
    signOut();
    navigate('/auth');
  }, [logAPI, navigate, signOut]);

  const simulateOffline = useCallback(() => {
    isOfflineSimulated.current = !isOfflineSimulated.current;
    if (isOfflineSimulated.current) {
      logUIEvent({
        type: 'click',
        target: 'QA Console',
        details: 'Simulating offline mode'
      });
    } else {
      logUIEvent({
        type: 'click',
        target: 'QA Console',
        details: 'Stopped simulating offline mode'
      });
    }
  }, [logUIEvent]);

  const clearLocalStorage = useCallback(() => {
    const keysToKeep = ['qa_debug'];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    logUIEvent({
      type: 'click',
      target: 'QA Console',
      details: `Cleared ${keysToRemove.length} localStorage items`
    });
  }, [logUIEvent]);

  const resetState = useCallback(() => {
    setNavigationLogs([]);
    setApiLogs([]);
    setUIEvents([]);
    setJSErrors([]);
    logUIEvent({
      type: 'click',
      target: 'QA Console',
      details: 'Reset all QA state'
    });
  }, [logUIEvent]);

  const forceRefreshSession = useCallback(async () => {
    logUIEvent({
      type: 'click',
      target: 'QA Console',
      details: 'Force refreshing session'
    });
    await refreshPermissions?.();
  }, [logUIEvent, refreshPermissions]);

  const clearLogs = useCallback(() => {
    setNavigationLogs([]);
    setApiLogs([]);
    setUIEvents([]);
    setJSErrors([]);
  }, []);

  // Bug report generator
  const generateBugReport = useCallback(() => {
    const sanitize = (obj: unknown): unknown => {
      if (typeof obj !== 'object' || obj === null) return obj;
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        // Remove sensitive fields
        if (['password', 'token', 'secret', 'api_key', 'authorization'].includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitize(value);
        }
      }
      return sanitized;
    };

    const report = {
      timestamp: new Date().toISOString(),
      route: location.pathname,
      session: {
        isLoggedIn: sessionState.isLoggedIn,
        userId: sessionState.userId ? sessionState.userId.substring(0, 8) + '...' : null,
        role: sessionState.role,
      },
      recentNavigation: navigationLogs.slice(0, 5).map(n => ({
        from: n.from,
        to: n.to,
        reason: n.reason,
        time: n.timestamp.toISOString()
      })),
      recentAPIErrors: apiLogs.filter(a => a.status && a.status >= 400).slice(0, 5).map(a => ({
        endpoint: a.endpoint,
        status: a.status,
        error: a.error,
        time: a.timestamp.toISOString()
      })),
      jsErrors: jsErrors.slice(0, 3).map(e => ({
        message: e.message,
        source: e.source,
        stack: e.stack?.split('\n').slice(0, 3).join('\n'),
        time: e.timestamp.toISOString()
      })),
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      localStorage: Object.keys(localStorage).length + ' items',
    };

    return `=== BUG REPORT ===\n${JSON.stringify(sanitize(report), null, 2)}`;
  }, [location.pathname, sessionState, navigationLogs, apiLogs, jsErrors]);

  // Track navigation changes
  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      logNavigation({
        from: previousPath.current,
        to: location.pathname,
        reason: 'manual'
      });
      previousPath.current = location.pathname;
    }
  }, [location.pathname, logNavigation]);

  // Keyboard shortcut (Ctrl+Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (!isEnabled) {
          setIsEnabled(true);
          localStorage.setItem('qa_debug', '1');
        }
        setIsDrawerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);

  // Global error handler
  useEffect(() => {
    if (!isEnabled) return;

    const handleError = (event: ErrorEvent) => {
      logJSError({
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logJSError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isEnabled, logJSError]);

  // Intercept fetch for API logging
  useEffect(() => {
    if (!isEnabled) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || 'GET').toUpperCase();

      // Simulate offline
      if (isOfflineSimulated.current) {
        logAPI({
          endpoint: url,
          method,
          status: null,
          duration: 0,
          error: 'Simulated offline - network request blocked'
        });
        throw new Error('Simulated offline mode');
      }

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        logAPI({
          endpoint: url,
          method,
          status: response.status,
          duration,
          error: response.ok ? undefined : `HTTP ${response.status}`
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        logAPI({
          endpoint: url,
          method,
          status: null,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isEnabled, logAPI]);

  const value: QADebugContextType = {
    isEnabled,
    isDrawerOpen,
    toggleEnabled,
    toggleDrawer,
    navigationLogs,
    apiLogs,
    uiEvents,
    jsErrors,
    sessionState,
    logNavigation,
    logAPI,
    logUIEvent,
    logJSError,
    simulate401,
    simulateOffline,
    clearLocalStorage,
    resetState,
    forceRefreshSession,
    generateBugReport,
    clearLogs,
  };

  return (
    <QADebugContext.Provider value={value}>
      {children}
    </QADebugContext.Provider>
  );
}

export function useQADebug() {
  const context = useContext(QADebugContext);
  if (!context) {
    throw new Error('useQADebug must be used within QADebugProvider');
  }
  return context;
}
