import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Navegação de volta com fallback seguro.
 * 
 * Rastreia o histórico de navegação interno do app para evitar:
 * - Voltar para a landing page "/" quando logado
 * - Voltar para páginas externas
 * - Comportamento inconsistente em deep links
 *
 * - Se existir histórico interno: volta 1 página.
 * - Senão: navega para um caminho seguro (default: /dashboard).
 */
export function useSafeBack(defaultPath: string = "/dashboard") {
  const navigate = useNavigate();
  const location = useLocation();
  const historyStack = useRef<string[]>([]);

  // Track internal navigation
  useEffect(() => {
    // Only track authenticated routes (not landing, auth, register)
    const publicRoutes = ['/', '/auth', '/register', '/landing', '/alcateia'];
    if (!publicRoutes.includes(location.pathname)) {
      historyStack.current.push(location.pathname);
      // Keep only last 20 entries
      if (historyStack.current.length > 20) {
        historyStack.current.shift();
      }
    }
  }, [location.pathname]);

  return useCallback(
    (arg?: unknown) => {
      const fallback = typeof arg === "string" ? arg : defaultPath;

      // If we have internal history (more than current page), go back
      if (historyStack.current.length > 1) {
        // Remove current page from stack
        historyStack.current.pop();
        navigate(-1);
        return;
      }

      // No internal history - navigate to fallback
      navigate(fallback);
    },
    [navigate, defaultPath],
  );
}
