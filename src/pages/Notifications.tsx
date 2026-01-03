import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isValidDate } from "@/lib/dateUtils";
import {
  ArrowLeft,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Filter,
  Search,
  Settings,
  Calendar,
  Users,
  Sparkles,
  X,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useNotificationPreferences, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string; label: string }> = {
  task_due: { icon: Calendar, color: 'text-warning', label: 'Tarefa próxima' },
  task_overdue: { icon: AlertTriangle, color: 'text-destructive', label: 'Tarefa atrasada' },
  lead_stale: { icon: Clock, color: 'text-orange-500', label: 'Lead parado' },
  lead_activity: { icon: Users, color: 'text-primary', label: 'Atividade de lead' },
  ai_insight: { icon: Sparkles, color: 'text-purple-500', label: 'Insight IA' },
  team_mention: { icon: Users, color: 'text-blue-500', label: 'Menção' },
  system: { icon: Bell, color: 'text-muted-foreground', label: 'Sistema' },
  reminder: { icon: Clock, color: 'text-primary', label: 'Lembrete' },
};

const priorityColors: Record<Notification['priority'], string> = {
  low: 'border-l-muted-foreground bg-muted/20',
  normal: 'border-l-primary bg-primary/5',
  high: 'border-l-warning bg-warning/10',
  urgent: 'border-l-destructive bg-destructive/10',
};

function NotificationPreferencesDialog() {
  const { preferences, updatePreferences, loading } = useNotificationPreferences();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Preferências
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preferências de Notificação</DialogTitle>
          <DialogDescription>
            Configure quais notificações você deseja receber.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Tipos de Notificação</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="task_due">Tarefas próximas do vencimento</Label>
                <Switch
                  id="task_due"
                  checked={preferences?.task_due_enabled ?? true}
                  onCheckedChange={(checked) => updatePreferences({ task_due_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="task_overdue">Tarefas atrasadas</Label>
                <Switch
                  id="task_overdue"
                  checked={preferences?.task_overdue_enabled ?? true}
                  onCheckedChange={(checked) => updatePreferences({ task_overdue_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="lead_stale">Leads sem atividade</Label>
                <Switch
                  id="lead_stale"
                  checked={preferences?.lead_stale_enabled ?? true}
                  onCheckedChange={(checked) => updatePreferences({ lead_stale_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="lead_activity">Atividades de leads</Label>
                <Switch
                  id="lead_activity"
                  checked={preferences?.lead_activity_enabled ?? true}
                  onCheckedChange={(checked) => updatePreferences({ lead_activity_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ai_insight">Insights de IA</Label>
                <Switch
                  id="ai_insight"
                  checked={preferences?.ai_insight_enabled ?? true}
                  onCheckedChange={(checked) => updatePreferences({ ai_insight_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="team_mention">Menções da equipe</Label>
                <Switch
                  id="team_mention"
                  checked={preferences?.team_mention_enabled ?? true}
                  onCheckedChange={(checked) => updatePreferences({ team_mention_enabled: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Canais</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Receber por email</Label>
                <Switch
                  id="email"
                  checked={preferences?.email_enabled ?? true}
                  onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Resumo por Email</h4>
            <Select
              value={preferences?.email_digest_frequency ?? 'daily'}
              onValueChange={(value) => updatePreferences({ email_digest_frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Desativado</SelectItem>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Notifications() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, dismissNotification, refetch } = useNotifications();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const filteredNotifications = notifications.filter((n) => {
    // Tab filter
    if (activeTab === "unread" && n.read_at) return false;
    if (activeTab === "archived" && !n.dismissed_at) return false;
    if (activeTab !== "archived" && n.dismissed_at) return false;

    // Type filter
    if (typeFilter !== "all" && n.type !== typeFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(query) ||
        (n.message?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount} não lidas
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhe alertas, tarefas e atualizações
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationPreferencesDialog />
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-4xl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar notificações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="task_due">Tarefas próximas</SelectItem>
              <SelectItem value="task_overdue">Tarefas atrasadas</SelectItem>
              <SelectItem value="lead_stale">Leads parados</SelectItem>
              <SelectItem value="lead_activity">Atividades</SelectItem>
              <SelectItem value="ai_insight">Insights IA</SelectItem>
              <SelectItem value="team_mention">Menções</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              Todas ({notifications.filter(n => !n.dismissed_at).length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não lidas ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Arquivadas ({notifications.filter(n => n.dismissed_at).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === "unread"
                      ? "Nenhuma notificação não lida"
                      : activeTab === "archived"
                      ? "Nenhuma notificação arquivada"
                      : "Nenhuma notificação encontrada"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "transition-all border-l-4 hover:shadow-md cursor-pointer",
                      priorityColors[notification.priority],
                      !notification.read_at && "ring-1 ring-primary/20"
                    )}
                    onClick={() => !notification.read_at && markAsRead(notification.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg bg-surface-2 shrink-0", config.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">{notification.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {config.label}
                              </Badge>
                              {!notification.read_at && (
                                <Badge variant="secondary" className="text-xs">
                                  Nova
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notification.dismissed_at && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification.id);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {isValidDate(notification.created_at)
                                ? formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })
                                : 'recentemente'}
                            </span>
                            {notification.priority !== 'normal' && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  notification.priority === 'high' && "border-warning text-warning",
                                  notification.priority === 'urgent' && "border-destructive text-destructive"
                                )}
                              >
                                {notification.priority === 'high' ? 'Alta prioridade' : 'Urgente'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
