import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Forces a Supabase auth refresh whenever the tab returns to the foreground.
 * Prevents 401 errors after the user receives a phone call or switches apps.
 *
 * If refresh fails (token already expired), shows a toast and redirects to
 * /auth?returnTo=<current path> so the user can resume exactly where they were.
 */
export function SessionRefreshOnFocus() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingRef = useRef(false);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      if (isHandlingRef.current) return;

      // Only act if there is an active session to refresh
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      isHandlingRef.current = true;
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          // Don't redirect if already on auth/landing pages
          const skipRoutes = ["/", "/auth", "/landing", "/landing-alcateia", "/register", "/register-alcateia"];
          if (!skipRoutes.includes(location.pathname)) {
            toast.error("Sua sessão expirou. Reconectando...");
            const returnTo = encodeURIComponent(location.pathname + location.search);
            navigate(`/auth?returnTo=${returnTo}`, { replace: true });
          }
        }
      } catch {
        // Network error — let the offline queue handle it
      } finally {
        isHandlingRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [navigate, location.pathname, location.search]);

  return null;
}
