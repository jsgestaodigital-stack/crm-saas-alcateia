import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CURRENT_POLICY_VERSION = '1.0';
const POLICY_TYPE = 'privacy_policy';

interface UserConsent {
  id: string;
  user_id: string;
  policy_version: string;
  policy_type: string;
  ip_address: string | null;
  accepted_at: string;
  revoked_at: string | null;
}

export function useUserConsent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  // Fetch IP address
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress(null));
  }, []);

  // Check if user has active consent
  const { data: hasConsent, isLoading } = useQuery({
    queryKey: ['user-consent', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('user_consents')
        .select('id, policy_version')
        .eq('user_id', user.id)
        .eq('policy_type', POLICY_TYPE)
        .is('revoked_at', null)
        .gte('policy_version', CURRENT_POLICY_VERSION)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking consent:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
  });

  // Accept consent mutation
  const acceptConsentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_consents')
        .insert({
          user_id: user.id,
          policy_version: CURRENT_POLICY_VERSION,
          policy_type: POLICY_TYPE,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consent', user?.id] });
    },
  });

  // Revoke consent mutation
  const revokeConsentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_consents')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('policy_type', POLICY_TYPE)
        .is('revoked_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consent', user?.id] });
    },
  });

  return {
    hasConsent: hasConsent ?? false,
    isLoading,
    currentPolicyVersion: CURRENT_POLICY_VERSION,
    acceptConsent: acceptConsentMutation.mutateAsync,
    revokeConsent: revokeConsentMutation.mutateAsync,
    isAccepting: acceptConsentMutation.isPending,
    isRevoking: revokeConsentMutation.isPending,
  };
}
