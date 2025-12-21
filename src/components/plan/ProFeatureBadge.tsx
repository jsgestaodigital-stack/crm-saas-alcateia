import React from "react";
import { Crown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProFeatureBadgeProps {
  feature: string;
  className?: string;
  variant?: "badge" | "icon" | "button";
  showUpgradeDialog?: boolean;
}

export const ProFeatureBadge: React.FC<ProFeatureBadgeProps> = ({
  feature,
  className,
  variant = "badge",
  showUpgradeDialog = true,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const content = (
    <>
      {variant === "badge" && (
        <Badge 
          className={cn(
            "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1 cursor-pointer hover:from-amber-600 hover:to-orange-600 transition-all",
            className
          )}
        >
          <Crown className="h-3 w-3" />
          PRO
        </Badge>
      )}
      {variant === "icon" && (
        <div className={cn(
          "p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer hover:from-amber-600 hover:to-orange-600 transition-all",
          className
        )}>
          <Crown className="h-3.5 w-3.5" />
        </div>
      )}
      {variant === "button" && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700",
            className
          )}
        >
          <Crown className="h-3.5 w-3.5" />
          Recurso PRO
        </Button>
      )}
    </>
  );

  if (!showUpgradeDialog) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p>Disponível no plano pago</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              {content}
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Disponível no plano pago</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center">Recurso Premium</DialogTitle>
          <DialogDescription className="text-center">
            <strong>{feature}</strong> está disponível apenas nos planos pagos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Faça upgrade para desbloquear:
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                Exportação de relatórios em PDF
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                Relatório completo do Gestor
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                Contratos com assinatura digital
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Depois
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => {
                setOpen(false);
                navigate("/upgrade");
              }}
            >
              Ver Planos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Wrapper para bloquear uma feature no trial
 * Mostra o conteúdo bloqueado com overlay
 */
interface ProFeatureGateProps {
  feature: string;
  isBlocked: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ProFeatureGate: React.FC<ProFeatureGateProps> = ({
  feature,
  isBlocked,
  children,
  className,
}) => {
  const navigate = useNavigate();

  if (!isBlocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="opacity-50 pointer-events-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
        <div className="text-center p-6 max-w-xs">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-3">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Recurso Premium</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {feature} está disponível nos planos pagos.
          </p>
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={() => navigate("/upgrade")}
          >
            <Crown className="h-4 w-4 mr-1.5" />
            Fazer Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para verificar se está em trial
 */
export const useIsTrialBlocked = () => {
  // Import from usePlanFeatures inside the hook to avoid circular deps
  const { usePlanFeatures } = require("@/hooks/usePlanFeatures");
  const { isInTrial, rawDbFeatures } = usePlanFeatures();
  
  const isTrialWithoutFeature = (featureKey: string): boolean => {
    if (!isInTrial) return false;
    return rawDbFeatures?.is_trial === true && rawDbFeatures?.[featureKey] !== true;
  };

  return {
    isInTrial,
    isExportBlocked: isTrialWithoutFeature("exportacao"),
    isManagerReportBlocked: isTrialWithoutFeature("relatorios_agencia"),
    isDigitalSignatureBlocked: isTrialWithoutFeature("assinatura_digital"),
  };
};
