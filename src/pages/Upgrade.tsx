import { useNavigate } from "react-router-dom"; import { useSafeBack } from "@/hooks/useSafeBack";
import { motion } from "framer-motion";
import { 
  Crown, 
  CheckCircle2, 
  ArrowLeft,
  ArrowRight,
  Zap,
  Users,
  Target,
  Building2,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAgencyLimits } from "@/hooks/useAgencyLimits";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { cn } from "@/lib/utils";

const planBenefits: Record<string, { icon: React.ElementType; label: string }[]> = {
  pro: [
    { icon: Users, label: "Até 50 clientes ativos (3x mais)" },
    { icon: Target, label: "Até 500 leads" },
    { icon: Zap, label: "Automações por status" },
    { icon: Sparkles, label: "Relatórios detalhados por cliente" },
    { icon: TrendingUp, label: "Controle de comissões da equipe" },
  ],
  master: [
    { icon: Users, label: "Até 150 clientes ativos (10x mais)" },
    { icon: Target, label: "Até 2.000 leads" },
    { icon: Zap, label: "10.000 tarefas/mês" },
    { icon: Building2, label: "Dashboard financeiro por cliente" },
    { icon: Sparkles, label: "Integração com AlfaLeads" },
    { icon: TrendingUp, label: "Exportação completa de dados" },
  ],
};

export default function Upgrade() {
  const { user, isLoading: authLoading } = useAuth();
  const { subscription, plans, isLoading } = useSubscription();
  const { limits, usage, getUsagePercentage } = useAgencyLimits();
  const { planSlug, isStarter, isPro } = usePlanFeatures();
  const navigate = useNavigate(); const goBack = useSafeBack();

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

  const currentPlan = subscription?.plan;
  const availablePlans = plans?.filter(p => {
    if (isStarter) return p.slug === 'pro' || p.slug === 'master';
    if (isPro) return p.slug === 'master';
    return false;
  }) || [];

  // Percentuais de uso para alertar
  const clientUsage = usage?.current_clients && limits?.max_clients 
    ? Math.round((usage.current_clients / limits.max_clients) * 100) 
    : 0;
  const leadUsage = usage?.current_leads && limits?.max_leads 
    ? Math.round((usage.current_leads / limits.max_leads) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Fazer Upgrade</h1>
            <p className="text-muted-foreground">Desbloqueie mais recursos para sua agência</p>
          </div>
        </div>

        {/* Current Usage Alert */}
        {(clientUsage >= 70 || leadUsage >= 70) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-warning/10 border border-warning/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-warning">Você está chegando ao limite!</p>
                <p className="text-sm text-muted-foreground">
                  {clientUsage >= 70 && `${usage?.current_clients}/${limits?.max_clients} clientes utilizados. `}
                  {leadUsage >= 70 && `${usage?.current_leads}/${limits?.max_leads} leads utilizados.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Plan */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Crown className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardDescription>Plano Atual</CardDescription>
                  <CardTitle className="text-lg">{currentPlan?.name || "Starter"}</CardTitle>
                </div>
              </div>
              <Badge variant="outline">
                R$ {currentPlan?.price_monthly?.toFixed(2) || "67,00"}/mês
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Clientes</p>
                <p className="font-medium">{usage?.current_clients || 0}/{limits?.max_clients || 15}</p>
                <Progress value={clientUsage} className="h-1.5 mt-1" />
              </div>
              <div>
                <p className="text-muted-foreground">Leads</p>
                <p className="font-medium">{usage?.current_leads || 0}/{limits?.max_leads || 100}</p>
                <Progress value={leadUsage} className="h-1.5 mt-1" />
              </div>
              <div>
                <p className="text-muted-foreground">Membros</p>
                <p className="font-medium">{usage?.current_users || 1}/{limits?.max_users || 2}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Upgrades */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Escolha seu novo plano</h2>
          
          {availablePlans.map((plan, index) => {
            const benefits = planBenefits[plan.slug] || [];
            const isRecommended = (isStarter && plan.slug === 'pro') || (isPro && plan.slug === 'master');
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all",
                  isRecommended 
                    ? "border-primary/50 shadow-lg shadow-primary/10" 
                    : "border-border/50 hover:border-primary/30"
                )}>
                  {isRecommended && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-bl-lg">
                      Recomendado
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          plan.slug === 'master' ? "bg-purple-500/10" : "bg-blue-500/10"
                        )}>
                          <Crown className={cn(
                            "h-6 w-6",
                            plan.slug === 'master' ? "text-purple-500" : "text-blue-500"
                          )} />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {plan.slug === 'pro' && "🔵"} 
                            {plan.slug === 'master' && "🟣"} 
                            {plan.name}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">R$ {plan.price_monthly.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">/mês</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* What you get */}
                    <div>
                      <p className="text-sm font-medium mb-3 text-muted-foreground">O que você ganha:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {benefits.map(({ icon: Icon, label }, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Comparison */}
                    <div className="pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs">Clientes</p>
                        <p className="font-bold text-lg">{plan.max_clients}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs">Leads</p>
                        <p className="font-bold text-lg">{plan.max_leads}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs">Membros</p>
                        <p className="font-bold text-lg">{plan.max_users}</p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full gap-2" 
                      size="lg"
                      variant={isRecommended ? "default" : "outline"}
                    >
                      <Zap className="h-4 w-4" />
                      Fazer Upgrade para {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      Alteração imediata • Sem carência • Cancele quando quiser
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Already on highest plan */}
        {availablePlans.length === 0 && (
          <Card className="text-center p-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Você já está no plano Master!</h3>
            <p className="text-muted-foreground mb-4">
              Aproveite todos os recursos disponíveis na plataforma.
            </p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </Card>
        )}

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dúvidas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Posso fazer downgrade depois?</p>
              <p className="text-sm text-muted-foreground">
                Sim, você pode alterar seu plano a qualquer momento. Alterações são aplicadas no próximo ciclo de cobrança.
              </p>
            </div>
            <div>
              <p className="font-medium">O que acontece com meus dados ao fazer upgrade?</p>
              <p className="text-sm text-muted-foreground">
                Todos os seus dados são mantidos. Você só ganha acesso a mais recursos e limites maiores.
              </p>
            </div>
            <div>
              <p className="font-medium">Como funciona a cobrança?</p>
              <p className="text-sm text-muted-foreground">
                A diferença de valor é calculada proporcionalmente ao período restante do seu plano atual.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
