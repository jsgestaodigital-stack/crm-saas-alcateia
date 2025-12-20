import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Shield, CheckCircle, Clock, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { toast } from 'sonner';

const eventTypeLabels: Record<string, string> = {
  limit_abuse_attempt: 'Tentativa de exceder limite',
  suspicious_login: 'Login suspeito',
  deletion_request: 'Solicitação de exclusão',
  unauthorized_access: 'Acesso não autorizado',
};

const severityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  high: { color: 'destructive', icon: <AlertTriangle className="h-4 w-4" /> },
  medium: { color: 'warning', icon: <Shield className="h-4 w-4" /> },
  low: { color: 'secondary', icon: <Clock className="h-4 w-4" /> },
};

export function SecurityAlertsPanel() {
  const { alerts, isLoading, unresolvedCount, resolveAlert, isResolving } = useSecurityAlerts();

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      toast.success('Alerta resolvido');
    } catch (error) {
      toast.error('Erro ao resolver alerta');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Alertas de Segurança
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unresolvedCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>Nenhum alerta de segurança</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity] || severityConfig.low;
                const details = alert.details as Record<string, unknown> | null;
                
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.resolved_at ? 'bg-muted/50 opacity-60' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${alert.severity === 'high' ? 'text-destructive' : 'text-warning'}`}>
                          {config.icon}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {eventTypeLabels[alert.event_type] || alert.event_type}
                            </span>
                            <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                              {alert.severity === 'high' ? 'Alto' : alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                            </Badge>
                            {alert.resolved_at && (
                              <Badge variant="outline" className="text-green-600">
                                Resolvido
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(alert.detected_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            {alert.agency_id && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Agência
                              </span>
                            )}
                            {alert.user_id && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Usuário
                              </span>
                            )}
                          </div>

                          {details && (
                            <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                              {Object.entries(details).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span>{' '}
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {!alert.resolved_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                          disabled={isResolving}
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
