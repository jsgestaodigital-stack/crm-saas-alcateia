import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Target, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function KPICard({ title, value, subtitle, icon, trend, variant = "default" }: KPICardProps) {
  const variantStyles = {
    default: "border-border/50",
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    danger: "border-red-500/30 bg-red-500/5",
    info: "border-primary/30 bg-primary/5",
  };

  const iconStyles = {
    default: "text-muted-foreground bg-muted/50",
    success: "text-emerald-500 bg-emerald-500/10",
    warning: "text-amber-500 bg-amber-500/10",
    danger: "text-red-500 bg-red-500/10",
    info: "text-primary bg-primary/10",
  };

  return (
    <Card className={cn("transition-all hover:shadow-lg hover:-translate-y-0.5", variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs mt-2",
                trend.isPositive ? "text-emerald-500" : "text-red-500"
              )}>
                {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Pre-built KPI cards for common use cases
export function LeadsKPICard({ total, converted, conversionRate }: { total: number; converted: number; conversionRate: string | number }) {
  return (
    <KPICard
      title="Leads"
      value={total}
      subtitle={`${converted} convertidos (${conversionRate}%)`}
      icon={<Target className="w-5 h-5" />}
      variant="info"
    />
  );
}

export function ProposalsKPICard({ sent, accepted, conversionRate }: { sent: number; accepted: number; conversionRate: string | number }) {
  return (
    <KPICard
      title="Propostas"
      value={sent}
      subtitle={`${accepted} aceitas (${conversionRate}%)`}
      icon={<FileText className="w-5 h-5" />}
      variant="warning"
    />
  );
}

export function ContractsKPICard({ active, expiringSoon }: { active: number; expiringSoon: number }) {
  const variant = expiringSoon > 0 ? "warning" : "success";
  return (
    <KPICard
      title="Contratos Ativos"
      value={active}
      subtitle={expiringSoon > 0 ? `${expiringSoon} vencem em 30 dias` : "Todos em dia"}
      icon={<FileText className="w-5 h-5" />}
      variant={variant}
    />
  );
}

export function RevenueKPICard({ value, label }: { value: number; label: string }) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <KPICard
      title={label}
      value={formatted}
      icon={<DollarSign className="w-5 h-5" />}
      variant="success"
    />
  );
}

export function ProjectsKPICard({ active, delivered, delayed }: { active: number; delivered: number; delayed: number }) {
  const variant = delayed > 0 ? "danger" : "success";
  return (
    <KPICard
      title="Projetos"
      value={active}
      subtitle={delayed > 0 ? `${delayed} atrasados` : `${delivered} entregues`}
      icon={<Users className="w-5 h-5" />}
      variant={variant}
    />
  );
}

export function RecurringKPICard({ active, monthlyRevenue }: { active: number; monthlyRevenue: number }) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monthlyRevenue);

  return (
    <KPICard
      title="Recorrência"
      value={active}
      subtitle={`${formatted}/mês`}
      icon={<RefreshCw className="w-5 h-5" />}
      variant="info"
    />
  );
}

export function AvgTimeKPICard({ hours, label }: { hours: number; label: string }) {
  const display = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
  return (
    <KPICard
      title={label}
      value={display}
      icon={<Clock className="w-5 h-5" />}
      variant="default"
    />
  );
}
