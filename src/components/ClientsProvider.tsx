import { useEffect } from "react";
import { useClientsRealtime } from "@/hooks/useClients";
import { useClientStore } from "@/stores/clientStore";

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const setClients = useClientStore((state) => state.setClients);
  const setDeletedClients = useClientStore((state) => state.setDeletedClients);
  const setLoading = useClientStore((state) => state.setLoading);

  // Initialize realtime subscription
  useClientsRealtime(setClients, setDeletedClients, setLoading);

  return <>{children}</>;
}
