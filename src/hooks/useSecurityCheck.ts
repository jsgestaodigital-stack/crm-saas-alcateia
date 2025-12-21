import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  is_blocked: boolean;
  email_attempts: number;
  ip_attempts: number;
  max_attempts: number;
  remaining_lockout_seconds: number;
  lockout_minutes: number;
}

interface UserStatusResult {
  user_id: string;
  email: string;
  email_confirmed: boolean;
  blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
}

interface LoginHistoryItem {
  id: string;
  ip_address: unknown;
  user_agent: string | null;
  location: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

interface ActiveSession {
  id: string;
  ip_address: unknown;
  user_agent: string | null;
  device_info: string | null;
  last_activity: string;
  created_at: string;
}

export function useSecurityCheck() {
  const [isLoading, setIsLoading] = useState(false);

  const checkRateLimit = useCallback(async (email: string): Promise<RateLimitResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'check_rate_limit', email }
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return null;
      }

      return data as RateLimitResult;
    } catch (err) {
      console.error('Rate limit check error:', err);
      return null;
    }
  }, []);

  const recordFailedLogin = useCallback(async (email: string): Promise<void> => {
    try {
      await supabase.functions.invoke('security-check', {
        body: { action: 'record_failed_login', email }
      });
    } catch (err) {
      console.error('Record failed login error:', err);
    }
  }, []);

  const checkUserStatus = useCallback(async (): Promise<UserStatusResult | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'check_user_status' }
      });

      if (error) {
        console.error('User status check error:', error);
        return null;
      }

      return data as UserStatusResult;
    } catch (err) {
      console.error('User status check error:', err);
      return null;
    }
  }, []);

  const logLoginSuccess = useCallback(async (location?: string): Promise<void> => {
    try {
      await supabase.functions.invoke('security-check', {
        body: { action: 'log_login_success', location }
      });
    } catch (err) {
      console.error('Log login success error:', err);
    }
  }, []);

  const invalidateAllSessions = useCallback(async (userId?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'invalidate_sessions', user_id: userId }
      });

      if (error) {
        console.error('Invalidate sessions error:', error);
        return false;
      }

      return data?.success || false;
    } catch (err) {
      console.error('Invalidate sessions error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const blockUser = useCallback(async (userId: string, reason?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'block_user', user_id: userId, reason }
      });

      if (error) {
        console.error('Block user error:', error);
        return false;
      }

      return data?.success || false;
    } catch (err) {
      console.error('Block user error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unblockUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'unblock_user', user_id: userId }
      });

      if (error) {
        console.error('Unblock user error:', error);
        return false;
      }

      return data?.success || false;
    } catch (err) {
      console.error('Unblock user error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLoginHistory = useCallback(async (limit: number = 20): Promise<LoginHistoryItem[]> => {
    try {
      const { data, error } = await supabase.rpc('get_login_history', { _limit: limit });

      if (error) {
        console.error('Get login history error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Get login history error:', err);
      return [];
    }
  }, []);

  const getActiveSessions = useCallback(async (): Promise<ActiveSession[]> => {
    try {
      const { data, error } = await supabase.rpc('get_active_sessions');

      if (error) {
        console.error('Get active sessions error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Get active sessions error:', err);
      return [];
    }
  }, []);

  const changePassword = useCallback(async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        return { success: false, error: error.message };
      }

      // Log password change and invalidate sessions
      await supabase.rpc('log_password_change');

      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: 'Erro ao alterar senha' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    checkRateLimit,
    recordFailedLogin,
    checkUserStatus,
    logLoginSuccess,
    invalidateAllSessions,
    blockUser,
    unblockUser,
    getLoginHistory,
    getActiveSessions,
    changePassword
  };
}
