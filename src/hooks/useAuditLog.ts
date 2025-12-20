import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

interface LogActionParams {
  actionType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logActionMutation = useMutation({
    mutationFn: async (params: LogActionParams) => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('log_action', {
        _action_type: params.actionType,
        _entity_type: params.entityType,
        _entity_id: params.entityId || null,
        _entity_name: params.entityName || null,
        _old_value: (params.oldValue as Json) || null,
        _new_value: (params.newValue as Json) || null,
        _metadata: (params.metadata as Json) || null,
      });

      if (error) {
        console.error('Error logging action:', error);
        return null;
      }

      return data;
    },
  });

  const logAction = async (params: LogActionParams) => {
    return logActionMutation.mutateAsync(params);
  };

  // Convenience methods for common actions
  const logCreate = (entityType: string, entityId: string, entityName: string, data?: Record<string, unknown>) => {
    return logAction({
      actionType: 'create',
      entityType,
      entityId,
      entityName,
      newValue: data,
    });
  };

  const logUpdate = (entityType: string, entityId: string, entityName: string, oldData?: Record<string, unknown>, newData?: Record<string, unknown>) => {
    return logAction({
      actionType: 'update',
      entityType,
      entityId,
      entityName,
      oldValue: oldData,
      newValue: newData,
    });
  };

  const logDelete = (entityType: string, entityId: string, entityName: string, data?: Record<string, unknown>) => {
    return logAction({
      actionType: 'delete',
      entityType,
      entityId,
      entityName,
      oldValue: data,
    });
  };

  const logView = (entityType: string, entityId: string, entityName?: string) => {
    return logAction({
      actionType: 'view',
      entityType,
      entityId,
      entityName,
    });
  };

  const logExport = (entityType: string, metadata?: Record<string, unknown>) => {
    return logAction({
      actionType: 'export',
      entityType,
      metadata,
    });
  };

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logView,
    logExport,
    isLogging: logActionMutation.isPending,
  };
}
