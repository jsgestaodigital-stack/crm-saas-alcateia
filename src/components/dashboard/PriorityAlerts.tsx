import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, UserX, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface PriorityAlertsProps {
  clientsCount?: number;
  overdueClients?: number;
  staleLeads?: number;
  trialDaysLeft?: number;
}

export function PriorityAlerts({
  clientsCount = 0,
  overdueClients = 0,
  staleLeads = 0,
  trialDaysLeft,
}: PriorityAlertsProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];

    if (overdueClients > 0) {
      list.push({
        id: 'overdue',
        level: 'critical',
        title: `${overdueClients} cliente${overdueClients > 1 ? 's' : ''} atrasado${overdueClients > 1 ? 's' : ''}`,
        description: 'Clientes com checklist parado há mais de 7 dias',
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    if (staleLeads > 0) {
      list.push({
        id: 'stale-leads',
        level: 'warning',
        title: `${staleLeads} lead${staleLeads > 1 ? 's' : ''} sem interação`,
        description: 'Leads sem atividade há mais de 5 dias',
        icon: <UserX className="h-4 w-4" />,
      });
    }

    if (trialDaysLeft !== undefined && trialDaysLeft <= 7) {
      list.push({
        id: 'trial',
        level: trialDaysLeft <= 3 ? 'critical' : 'warning',
        title: `Trial expira em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}`,
        description: 'Faça upgrade para manter acesso completo',
        icon: <Clock className="h-4 w-4" />,
      });
    }

    if (clientsCount === 0) {
      list.push({
        id: 'no-clients',
        level: 'info',
        title: 'Nenhum cliente cadastrado',
        description: 'Adicione seu primeiro cliente para começar',
        icon: <TrendingDown className="h-4 w-4" />,
      });
    }

    return list;
  }, [clientsCount, overdueClients, staleLeads, trialDaysLeft]);

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  const levelStyles = {
    critical: 'border-destructive/40 bg-destructive/10 text-destructive',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    info: 'border-primary/40 bg-primary/10 text-primary',
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => (
        <Card key={alert.id} className={cn('border', levelStyles[alert.level])}>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <div className="shrink-0">{alert.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-xs opacity-80 truncate">{alert.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100"
              onClick={() => setDismissed(prev => [...prev, alert.id])}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
