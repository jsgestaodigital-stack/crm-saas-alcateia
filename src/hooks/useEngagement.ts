import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export type EngagementCategory = 'navigation' | 'crud' | 'feature';

export interface EngagementEvent {
  type: string;
  category: EngagementCategory;
  weight: number;
}

// Event definitions with weights
export const ENGAGEMENT_EVENTS = {
  // Navigation events (weight 1)
  page_view: { category: 'navigation', weight: 1 },
  dashboard_view: { category: 'navigation', weight: 1 },
  sidebar_click: { category: 'navigation', weight: 1 },
  
  // CRUD events (weight 3-5)
  client_created: { category: 'crud', weight: 5 },
  client_updated: { category: 'crud', weight: 3 },
  client_deleted: { category: 'crud', weight: 2 },
  lead_created: { category: 'crud', weight: 5 },
  lead_updated: { category: 'crud', weight: 3 },
  lead_moved: { category: 'crud', weight: 2 },
  task_created: { category: 'crud', weight: 4 },
  task_completed: { category: 'crud', weight: 5 },
  proposal_created: { category: 'crud', weight: 5 },
  contract_created: { category: 'crud', weight: 5 },
  contract_sent: { category: 'crud', weight: 3 },
  
  // Feature events (weight 2-8)
  report_generated: { category: 'feature', weight: 4 },
  report_exported: { category: 'feature', weight: 3 },
  ai_agent_used: { category: 'feature', weight: 5 },
  raio_x_analyzed: { category: 'feature', weight: 6 },
  seo_analyzed: { category: 'feature', weight: 6 },
  team_member_invited: { category: 'feature', weight: 8 },
  settings_changed: { category: 'feature', weight: 2 },
  tour_completed: { category: 'feature', weight: 10 },
  voice_command_used: { category: 'feature', weight: 4 },
} as const;

export type EngagementEventType = keyof typeof ENGAGEMENT_EVENTS;

export interface EngagementRanking {
  user_id: string;
  agency_id: string;
  user_name: string;
  agency_name: string;
  total_score: number;
  total_events: number;
  active_days: number;
  navigation_score: number;
  crud_score: number;
  feature_score: number;
  avg_daily_score: number;
  last_activity: string;
  days_since_last_activity: number;
  engagement_level: 'champion' | 'power_user' | 'active' | 'exploring' | 'inactive';
}

export function useEngagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logEventMutation = useMutation({
    mutationFn: async ({ eventType, metadata }: { eventType: EngagementEventType; metadata?: Record<string, unknown> }) => {
      const eventConfig = ENGAGEMENT_EVENTS[eventType];
      
      const { data, error } = await supabase.rpc('log_engagement_event', {
        _event_type: eventType,
        _event_category: eventConfig.category,
        _weight: eventConfig.weight,
        _metadata: (metadata || {}) as Json
      });
      
      if (error) throw error;
      return data;
    },
  });

  const logEvent = (eventType: EngagementEventType, metadata?: Record<string, unknown>) => {
    if (user?.id) {
      logEventMutation.mutate({ eventType, metadata });
    }
  };

  return {
    logEvent,
    isLogging: logEventMutation.isPending,
  };
}

export function useEngagementRankings(daysBack: number = 30, limit: number = 50) {
  return useQuery({
    queryKey: ['engagement-rankings', daysBack, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_engagement_rankings', {
        _days_back: daysBack,
        _limit: limit
      });
      
      if (error) throw error;
      return data as EngagementRanking[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
