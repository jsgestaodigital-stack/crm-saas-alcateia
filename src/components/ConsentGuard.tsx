import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserConsent } from '@/hooks/useUserConsent';
import { ConsentModal } from '@/components/ConsentModal';

interface ConsentGuardProps {
  children: ReactNode;
}

export function ConsentGuard({ children }: ConsentGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasConsent, isLoading: consentLoading } = useUserConsent();
  const [showModal, setShowModal] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    // Only show modal if user is logged in and hasn't accepted consent
    if (user && !authLoading && !consentLoading) {
      if (!hasConsent && !consentAccepted) {
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    }
  }, [user, authLoading, consentLoading, hasConsent, consentAccepted]);

  const handleConsentAccepted = () => {
    setConsentAccepted(true);
    setShowModal(false);
  };

  // Don't block rendering while loading
  if (authLoading || consentLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ConsentModal open={showModal} onAccepted={handleConsentAccepted} />
    </>
  );
}
