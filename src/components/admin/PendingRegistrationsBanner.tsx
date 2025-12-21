import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Users, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PendingRegistrationsBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkSuperAdminAndFetchPending = async () => {
      // Check if user is super admin
      const { data: permissions } = await supabase
        .from('user_permissions')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .single();

      if (!permissions?.is_super_admin) {
        setIsSuperAdmin(false);
        return;
      }

      setIsSuperAdmin(true);

      // Fetch pending registrations count
      const { data, error } = await supabase.rpc('get_pending_registrations');
      if (!error && data) {
        const pending = data.filter((r: any) => r.status === 'pending');
        setPendingCount(pending.length);
      }
    };

    checkSuperAdminAndFetchPending();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('pending-registrations-banner')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_registrations',
        },
        () => {
          checkSuperAdminAndFetchPending();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!isSuperAdmin || pendingCount === 0 || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                <AlertTriangle className="h-6 w-6" />
              </motion.div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-bold">
                  {pendingCount} {pendingCount === 1 ? 'nova solicitação' : 'novas solicitações'} de cadastro aguardando aprovação!
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => navigate('/super-admin')}
              >
                Revisar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/20 text-white"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Animated bottom border */}
        <motion.div
          className="h-1 bg-white/30"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 30, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
