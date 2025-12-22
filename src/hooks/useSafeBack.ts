import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Navegação de volta com fallback (quando o usuário entrou direto na rota e não há histórico).
 *
 * - Se existir histórico: volta 1 página.
 * - Senão: navega para um caminho seguro (default: /dashboard).
 */
export function useSafeBack(defaultPath: string = "/dashboard") {
  const navigate = useNavigate();

  return useCallback(
    (arg?: unknown) => {
      const fallback = typeof arg === "string" ? arg : defaultPath;

      if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
        return;
      }

      navigate(fallback);
    },
    [navigate, defaultPath],
  );
}
