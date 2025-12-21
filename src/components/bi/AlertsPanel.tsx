import { AlertTriangle, Info, XCircle } from "lucide-react";
import { Alert as AlertUI, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Alert } from "@/hooks/useDashboardBI";
import { cn } from "@/lib/utils";

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum alerta no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <AlertCard key={index} alert={alert} />
      ))}
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const variants = {
    info: {
      icon: Info,
      className: "border-primary/30 bg-primary/5",
      iconClass: "text-primary",
    },
    warning: {
      icon: AlertTriangle,
      className: "border-amber-500/30 bg-amber-500/5",
      iconClass: "text-amber-500",
    },
    error: {
      icon: XCircle,
      className: "border-red-500/30 bg-red-500/5",
      iconClass: "text-red-500",
    },
  };

  const variant = variants[alert.type] || variants.info;
  const Icon = variant.icon;

  return (
    <AlertUI className={cn("transition-all hover:shadow-md", variant.className)}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{alert.icon}</span>
        <div className="flex-1">
          <AlertTitle className="text-sm font-medium mb-1">{alert.title}</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            {alert.description}
          </AlertDescription>
        </div>
        <Icon className={cn("w-4 h-4 mt-0.5", variant.iconClass)} />
      </div>
    </AlertUI>
  );
}
