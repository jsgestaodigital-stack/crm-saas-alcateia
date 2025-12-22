import { useSubscription } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionBlockStatus = "active" | "blocked" | "loading";

const BLOCKED_STATUSES = ["past_due", "cancelled", "expired"] as const;

type KnownStatus = (typeof BLOCKED_STATUSES)[number] | "trial" | "active";

export function useSubscriptionStatus() {
  const { subscription, features, isLoading } = useSubscription();
  const {
    permissions,
    isLoading: authLoading,
    isAdmin,
    userRole,
    user,
    currentAgencyId,
  } = useAuth();

  // Enquanto a agência atual ainda não foi definida, NÃO podemos bloquear (evita redirecionamento errado para /locked)
  const missingAgency = !!user && !currentAgencyId;

  // Super admin check
  const isSuperAdmin = permissions?.isSuperAdmin ?? false;

  // Fallback extra (segurança): admin com canAdmin não deve ser bloqueado
  const hasAdminPrivileges = isSuperAdmin || (isAdmin && userRole === "admin");

  const loading = isLoading || authLoading || missingAgency;

  // Status “fonte da verdade”: preferir o status vindo de features (RPC), depois o status da assinatura
  const effectiveStatus = (features?.status ?? subscription?.status ?? null) as KnownStatus | null;

  const blocked = (() => {
    if (isSuperAdmin) return false;
    if (hasAdminPrivileges && permissions?.canAdmin) return false;

    // Nunca bloquear durante carregamento / enquanto agência não foi resolvida
    if (loading) return false;

    // Se o backend disser que está ok, sempre liberar
    if (effectiveStatus === "trial" || effectiveStatus === "active") return false;

    // Bloquear apenas status explicitamente inválidos
    if (effectiveStatus && (BLOCKED_STATUSES as readonly string[]).includes(effectiveStatus)) {
      return true;
    }

    // Se não temos status confiável, não bloqueia (evita falsos positivos)
    return false;
  })();

  return {
    status: loading ? "loading" : blocked ? "blocked" : "active",
    isBlocked: blocked,
    isLoading: loading,
    subscription,
    isSuperAdmin,
  };
}

