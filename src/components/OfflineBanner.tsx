import { useEffect, useState } from "react";
import { WifiOff, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { getPendingCount, retrySyncPending } from "@/lib/offlineQueue";

/**
 * Discreet top banner shown when the browser is offline OR when there are
 * pending mutations queued for retry. Auto-syncs when the network returns.
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refreshPending = () => setPending(getPendingCount());
    refreshPending();

    const handleOnline = async () => {
      setIsOnline(true);
      const result = await retrySyncPending();
      refreshPending();
      if (result.synced > 0) {
        toast.success(
          `Reconectado — ${result.synced} ${result.synced === 1 ? "alteração sincronizada" : "alterações sincronizadas"}.`,
        );
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue:changed", refreshPending);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue:changed", refreshPending);
    };
  }, []);

  if (isOnline && pending === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] w-full bg-amber-500/95 text-amber-950 backdrop-blur-sm border-b border-amber-600/40 px-3 py-2 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 flex-shrink-0" aria-hidden />
          <span className="font-medium">
            Sem conexão — alterações serão salvas ao reconectar.
          </span>
        </>
      ) : (
        <>
          <CloudUpload className="h-4 w-4 flex-shrink-0 animate-pulse" aria-hidden />
          <span className="font-medium">
            Sincronizando {pending} {pending === 1 ? "alteração" : "alterações"}…
          </span>
        </>
      )}
    </div>
  );
}
