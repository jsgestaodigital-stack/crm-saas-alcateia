import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: ReactNode;
}

// Routes that are always allowed, even when subscription is blocked
const ALLOWED_ROUTES = ['/meu-perfil', '/auth', '/register', '/locked', '/admin/plan', '/upgrade'];

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { status, isBlocked, isSuperAdmin } = useSubscriptionStatus();
  const { permissions, isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Super admins bypass ALL checks immediately - even during loading
  // Check both the hook result and direct permissions
  if (isSuperAdmin || permissions?.isSuperAdmin) {
    return <>{children}</>;
  }

  // While loading auth or subscription, show loading state
  // But ONLY if we haven't confirmed the user is NOT a super admin
  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Check if current route is in allowed list
  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // If blocked and not on an allowed route, redirect to locked page
  if (isBlocked && !isAllowedRoute) {
    return <Navigate to="/locked" replace />;
  }

  // If NOT blocked, never allow staying on /locked (evita ficar preso após um falso redirecionamento)
  if (!isBlocked && location.pathname.startsWith('/locked')) {
    return <Navigate to="/dashboard" replace />;
  }
}
