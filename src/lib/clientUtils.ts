import { Client, ClientStatus } from "@/types/client";

export function calculateProgress(client: Client): number {
  if (!client.checklist || !Array.isArray(client.checklist) || client.checklist.length === 0) {
    return 0;
  }
  
  const allItems = client.checklist.flatMap(section => {
    // Handle both formats: { items: [...] } and { tasks: [...] }
    const items = (section as any).items || (section as any).tasks || [];
    return Array.isArray(items) ? items : [];
  });
  
  if (allItems.length === 0) return 0;
  
  // Handle both formats: { completed: boolean } and { done: boolean }
  const completedItems = allItems.filter((item: any) => item?.completed || item?.done);
  return Math.round((completedItems.length / allItems.length) * 100);
}

export function getStatusLabel(status: ClientStatus): string {
  switch (status) {
    case "on_track": return "Em dia";
    case "delayed": return "Atrasado";
    case "pending_client": return "Pendente do cliente";
    default: return status;
  }
}

export function getStatusColor(status: ClientStatus): string {
  switch (status) {
    case "on_track": return "bg-status-success/20 text-status-success";
    case "delayed": return "bg-status-danger/20 text-status-danger";
    case "pending_client": return "bg-status-warning/20 text-status-warning";
    default: return "bg-muted text-muted-foreground";
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDaysAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return `${diffDays} dias atrás`;
}

export function getDaysSinceUpdate(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysToDeadline(startDateString: string, deadlineDays: number = 30): number {
  const startDate = new Date(startDateString);
  const deadline = new Date(startDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export type UrgencyLevel = "critical" | "high" | "medium" | "none";

export function getClientUrgency(client: Client): { level: UrgencyLevel; reason: string } {
  // Skip finished/delivered/suspended clients
  if (["finalized", "delivered", "suspended"].includes(client.columnId)) {
    return { level: "none", reason: "" };
  }

  const daysStalled = getDaysSinceUpdate(client.lastUpdate);
  const daysToDeadline = getDaysToDeadline(client.startDate);

  // Critical: deadline <= 3 days OR stalled >= 5 days
  if (daysToDeadline <= 3) {
    return { level: "critical", reason: `Prazo em ${daysToDeadline}d` };
  }
  if (daysStalled >= 5) {
    return { level: "critical", reason: `Parado há ${daysStalled}d` };
  }

  // High: deadline <= 7 days OR stalled >= 3 days
  if (daysToDeadline <= 7) {
    return { level: "high", reason: `${daysToDeadline}d restantes` };
  }
  if (daysStalled >= 3) {
    return { level: "high", reason: `${daysStalled}d sem ação` };
  }

  return { level: "none", reason: "" };
}
