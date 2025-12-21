import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: ReactNode;
}

// Routes that are always allowed, even when subscription is blocked
const ALLOWED_ROUTES = ['/meu-perfil', '/auth', '/register', '/locked'];

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { status, isBlocked, isSuperAdmin } = useSubscriptionStatus();
  const location = useLocation();

  // While loading, show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Super admins bypass all checks
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check if current route is in allowed list
  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // If blocked and not on an allowed route, redirect to locked page
  if (isBlocked && !isAllowedRoute) {
    return <Navigate to="/locked" replace />;
  }

  return <>{children}</>;
}
