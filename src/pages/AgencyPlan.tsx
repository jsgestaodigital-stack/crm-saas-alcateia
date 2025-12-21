import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Crown, 
  Users, 
  Target, 
  Building2, 
  HardDrive, 
  CheckCircle2, 
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAgencyLimits } from "@/hooks/useAgencyLimits";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trial: { label: "Trial", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  expired: { label: "Expirado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  past_due: { label: "Pagamento Pendente", variant: "destructive" },
};

export default function AgencyPlan() {
  const { user, isLoading: authLoading } = useAuth();
  const { subscription, plans, isLoading, getTrialDaysRemaining, isInTrial, isActive } = useSubscription();
  const { limits, usage, getUsagePercentage } = useAgencyLimits();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const plan = subscription?.plan;
  const daysRemaining = getTrialDaysRemaining();
  const statusInfo = statusLabels[subscription?.status || 'trial'];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Meu Plano</h1>
            <p className="text-muted-foreground">Gerencie sua assinatura e recursos</p>
          </div>
        </div>

        {/* Current Plan Card */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{plan?.name || "Sem Plano"}</CardTitle>
                  <CardDescription>{plan?.description}</CardDescription>
                </div>
              </div>
              <Badge variant={statusInfo?.variant}>{statusInfo?.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                R$ {plan?.price_monthly?.toFixed(2) || "0,00"}
              </span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            {/* Trial Info */}
            {isInTrial && daysRemaining !== null && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Período de Teste</p>
                  <p className="text-sm text-muted-foreground">
                    {daysRemaining > 0 
                      ? `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                      : "Expirado"
                    }
                    {subscription?.trial_ends_at && (
                      <> • Expira em {format(new Date(subscription.trial_ends_at), "dd 'de' MMMM", { locale: ptBR })}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Period Info */}
            {subscription?.status === 'active' && subscription?.current_period_end && (
              <div className="text-sm text-muted-foreground">
                Próxima renovação: {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uso do Plano</CardTitle>
            <CardDescription>Consumo atual dos seus recursos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'users', label: 'Usuários', icon: Users, current: usage?.current_users || 0, max: limits?.max_users || 0 },
              { key: 'leads', label: 'Leads', icon: Target, current: usage?.current_leads || 0, max: limits?.max_leads || 0 },
              { key: 'clients', label: 'Clientes', icon: Building2, current: usage?.current_clients || 0, max: limits?.max_clients || 0 },
            ].map(({ key, label, icon: Icon, current, max }) => {
              const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
              const isNear = percentage >= 80;
              const isAt = percentage >= 100;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{label}</span>
                    </div>
                    <span className={cn(
                      "font-medium",
                      isAt && "text-destructive",
                      isNear && !isAt && "text-warning"
                    )}>
                      {current}/{max}
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={cn(
                      "h-2",
                      isAt && "[&>div]:bg-destructive",
                      isNear && !isAt && "[&>div]:bg-warning"
                    )}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recursos do Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'funil_tarefas', label: 'Funil e Tarefas' },
                { key: 'funil_avancado', label: 'Funil Avançado' },
                { key: 'automacoes', label: 'Automações' },
                { key: 'relatorios_agencia', label: 'Relatórios Agência' },
                { key: 'relatorios_cliente', label: 'Relatórios por Cliente' },
                { key: 'dashboard_principal', label: 'Dashboard Principal' },
                { key: 'dashboard_financeiro', label: 'Dashboard Financeiro' },
                { key: 'cobranca_stripe', label: 'Cobrança via Stripe' },
                { key: 'comissoes', label: 'Controle de Comissões' },
                { key: 'logs_auditoria', label: 'Logs e Auditoria' },
                { key: 'exportacao', label: 'Exportação de Dados' },
                { key: 'integracao_alfaleads', label: 'Integração AlfaLeads' },
                { key: 'suporte_email', label: 'Suporte por Email' },
                { key: 'suporte_prioritario', label: 'Suporte Prioritário' },
                { key: 'suporte_whatsapp', label: 'Suporte WhatsApp' },
                { key: 'acesso_antecipado', label: 'Acesso Antecipado' },
              ].map(({ key, label }) => {
                const planFeatures = (plan?.features || {}) as Record<string, boolean | number>;
                const enabled = planFeatures[key] === true;
                return (
                  <div key={key} className="flex items-center gap-2">
                    {enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-status-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                    <span className={cn(!enabled && "text-muted-foreground")}>{label}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Limite de tarefas */}
            {(plan?.features as any)?.limite_tarefas_mes && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="inline h-4 w-4 mr-1 text-primary" />
                  Limite de tarefas: <span className="font-medium text-foreground">{(plan?.features as any)?.limite_tarefas_mes?.toLocaleString('pt-BR')}/mês</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade CTA */}
        {plan?.slug !== 'master' && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quer mais recursos?</h3>
                    <p className="text-sm text-muted-foreground">
                      Faça upgrade e desbloqueie mais clientes, automações e muito mais.
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate("/upgrade")} className="gap-2">
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        {plans && plans.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outros Planos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {plans.filter(p => p.id !== plan?.id).map((p) => (
                  <div 
                    key={p.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/upgrade")}
                  >
                    <div>
                      <h4 className="font-medium">{p.name}</h4>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {p.price_monthly.toFixed(2)}/mês</p>
                      <p className="text-xs text-muted-foreground">
                        {p.max_users} usuários • {p.max_leads} leads
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate("/upgrade")}
              >
                Ver detalhes dos planos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
