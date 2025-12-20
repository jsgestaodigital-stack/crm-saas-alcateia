/**
 * Date and Timezone Utilities
 * Item 13: Timezone handling - Supabase dates are UTC, parse as local
 */

/**
 * Parse UTC date from Supabase to local Date object
 */
export function parseUTCDate(utcString: string): Date {
  // Supabase returns ISO strings in UTC
  return new Date(utcString);
}

/**
 * Format date to local timezone string
 */
export function formatLocalDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? parseUTCDate(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...options,
  });
}

/**
 * Format datetime to local timezone string
 */
export function formatLocalDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? parseUTCDate(date) : date;
  return d.toLocaleString('pt-BR', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Get current datetime in ISO format for Supabase
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get relative time description (e.g., "2 horas atrás")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseUTCDate(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Agora mesmo';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay === 1) return 'Ontem';
  if (diffDay < 7) return `${diffDay} dias atrás`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} semanas atrás`;
  return formatLocalDate(d);
}

/**
 * Check if date is today (in local timezone)
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseUTCDate(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get days between two dates
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseUTCDate(start) : start;
  const endDate = typeof end === 'string' ? parseUTCDate(end) : end;
  const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get days remaining until a deadline (30 days from start)
 */
export function getDaysRemaining(startDate: string, deadlineDays = 30): number {
  const start = parseUTCDate(startDate);
  const deadline = new Date(start.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? parseUTCDate(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Format date for display in cards/lists
 */
export function formatCardDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseUTCDate(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}
