import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  agency_id: string;
  user_id: string;
  type: 'task_due' | 'task_overdue' | 'lead_stale' | 'lead_activity' | 'ai_insight' | 'team_mention' | 'system' | 'reminder';
  channel: 'in_app' | 'email' | 'push' | 'sms';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  lead_id: string | null;
  task_id: string | null;
  client_id: string | null;
  read_at: string | null;
  sent_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  agency_id: string;
  task_due_enabled: boolean;
  task_overdue_enabled: boolean;
  lead_stale_enabled: boolean;
  lead_activity_enabled: boolean;
  ai_insight_enabled: boolean;
  team_mention_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  email_digest_frequency: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const typedData = (data || []) as unknown as Notification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.read_at).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification:', payload);
          const newNotification = payload.new as unknown as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for high priority
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            toast.info(newNotification.title, {
              description: newNotification.message || undefined,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as unknown as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updated.id ? updated : n)
          );
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.read_at).length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Erro ao marcar como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('Todas as notificações marcadas como lidas');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Erro ao marcar notificações');
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const wasUnread = notifications.find(n => n.id === notificationId && !n.read_at);
        return wasUnread ? prev - 1 : prev;
      });
    } catch (err) {
      console.error('Error dismissing notification:', err);
      toast.error('Erro ao arquivar notificação');
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refetch: fetchNotifications,
  };
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPreferences(data as unknown as NotificationPreferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return false;

    try {
      if (preferences) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Trigger sets agency_id via the database trigger
        const { error } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id, agency_id: preferences?.agency_id || '', ...updates } as any);

        if (error) throw error;
      }

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Preferências atualizadas');
      return true;
    } catch (err) {
      console.error('Error updating preferences:', err);
      toast.error('Erro ao atualizar preferências');
      return false;
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
