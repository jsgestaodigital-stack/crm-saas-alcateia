import { useState } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, Sparkles, Users, Calendar, X } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string; label: string }> = {
  task_due: { icon: Calendar, color: 'text-warning', label: 'Tarefa' },
  task_overdue: { icon: AlertTriangle, color: 'text-destructive', label: 'Atrasada' },
  lead_stale: { icon: Clock, color: 'text-orange-500', label: 'Lead parado' },
  lead_activity: { icon: Users, color: 'text-primary', label: 'Atividade' },
  ai_insight: { icon: Sparkles, color: 'text-purple-500', label: 'IA' },
  team_mention: { icon: Users, color: 'text-blue-500', label: 'Menção' },
  system: { icon: Bell, color: 'text-muted-foreground', label: 'Sistema' },
  reminder: { icon: Clock, color: 'text-primary', label: 'Lembrete' },
};

const priorityColors: Record<Notification['priority'], string> = {
  low: 'border-l-muted-foreground',
  normal: 'border-l-primary',
  high: 'border-l-warning',
  urgent: 'border-l-destructive',
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const recentNotifications = notifications.filter(n => !n.dismissed_at).slice(0, 10);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on type
    if (notification.lead_id) {
      setOpen(false);
      // Could navigate to lead detail
    } else if (notification.task_id) {
      setOpen(false);
      // Could navigate to task
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-surface-2"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 bg-surface-1 border-border/50"
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Notificações</h3>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <Badge variant="destructive">{unreadCount}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => markAllAsRead()}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Ler todas
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {recentNotifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {recentNotifications.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors cursor-pointer hover:bg-surface-2/50 border-l-4",
                      priorityColors[notification.priority],
                      !notification.read_at && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg bg-surface-2", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {notification.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {!notification.read_at && (
                            <Badge variant="secondary" className="text-[10px] h-4">
                              Nova
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border/30">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
          >
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
