import { AlertTriangle, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

export function SubscriptionBanner() {
  const { subscription, isInTrial, isTrialExpired, getTrialDaysRemaining, isActive } = useSubscription();
  const navigate = useNavigate();

  if (!subscription) return null;

  const daysRemaining = getTrialDaysRemaining();
  const expired = isTrialExpired();

  // Trial expirando em breve (menos de 5 dias)
  if (isInTrial && daysRemaining !== null && daysRemaining <= 5 && daysRemaining > 0) {
    return (
      <Alert className="mb-4 border-warning bg-warning/10">
        <Clock className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Trial Expirando</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Seu período de testes expira em <strong>{daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}</strong>.
            Ative seu plano para continuar usando.
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            className="ml-4 border-warning text-warning hover:bg-warning/20"
            onClick={() => navigate("/admin/plan")}
          >
            Ver Planos
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial expirado
  if (expired || subscription.status === 'expired') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Assinatura Expirada</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Seu período de testes expirou. Ative um plano para continuar.
          </span>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate("/admin/plan")}
          >
            Ativar Plano
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Pagamento pendente
  if (subscription.status === 'past_due') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Pagamento Pendente</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Há um problema com seu pagamento. Atualize seus dados para continuar.
          </span>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate("/admin/plan")}
          >
            Resolver
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial ativo (mostrar de forma discreta)
  if (isInTrial && daysRemaining !== null && daysRemaining > 5) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 rounded-lg px-4 py-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>
          <strong>Trial ativo</strong> • {daysRemaining} dias restantes no plano {subscription.plan?.name}
        </span>
      </div>
    );
  }

  return null;
}
