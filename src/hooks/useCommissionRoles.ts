import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommissionRole {
  id: string;
  label: string;
  active: boolean;
  sort_order: number;
}

export function useCommissionRoles() {
  const [roles, setRoles] = useState<CommissionRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('commission_roles')
          .select('*')
          .eq('active', true)
          .order('sort_order');

        if (error) throw error;
        setRoles((data as CommissionRole[]) || []);
      } catch (error) {
        console.error('Error fetching commission roles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const getRoleById = (id: string | null): CommissionRole | undefined => {
    return roles.find(r => r.id === id);
  };

  const getRoleByLabel = (label: string): CommissionRole | undefined => {
    return roles.find(r => r.label.toLowerCase() === label.toLowerCase());
  };

  return { roles, loading, getRoleById, getRoleByLabel };
}
