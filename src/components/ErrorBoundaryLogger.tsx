import { useErrorLogger } from '@/hooks/useErrorLogger';

/**
 * Global error logger component - mounts the error logger hook
 * Invisible component that captures uncaught errors and unhandled rejections
 */
export function ErrorBoundaryLogger() {
  useErrorLogger();
  return null;
}
