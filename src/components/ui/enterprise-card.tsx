import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EnterpriseKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  insight?: {
    type: 'success' | 'warning' | 'danger' | 'info';
    message: string;
  };
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium' | 'emerald' | 'blue' | 'amber' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    border: 'border-border/30',
    gradient: 'from-surface-2/50 to-surface-1/30',
    icon: 'text-muted-foreground bg-muted/30',
    glow: '',
  },
  success: {
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    icon: 'text-emerald-400 bg-emerald-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(142_76%_45%/0.3)]',
  },
  emerald: {
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    icon: 'text-emerald-400 bg-emerald-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(142_76%_45%/0.3)]',
  },
  warning: {
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/10 to-amber-500/5',
    icon: 'text-amber-400 bg-amber-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(45_93%_50%/0.3)]',
  },
  amber: {
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/10 to-amber-500/5',
    icon: 'text-amber-400 bg-amber-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(45_93%_50%/0.3)]',
  },
  danger: {
    border: 'border-red-500/30',
    gradient: 'from-red-500/10 to-red-500/5',
    icon: 'text-red-400 bg-red-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(0_72%_51%/0.3)]',
  },
  info: {
    border: 'border-blue-500/30',
    gradient: 'from-blue-500/10 to-blue-500/5',
    icon: 'text-blue-400 bg-blue-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(217_91%_60%/0.3)]',
  },
  blue: {
    border: 'border-blue-500/30',
    gradient: 'from-blue-500/10 to-blue-500/5',
    icon: 'text-blue-400 bg-blue-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(217_91%_60%/0.3)]',
  },
  violet: {
    border: 'border-violet-500/30',
    gradient: 'from-violet-500/10 to-violet-500/5',
    icon: 'text-violet-400 bg-violet-500/20',
    glow: 'shadow-[0_0_30px_-5px_hsl(280_70%_60%/0.3)]',
  },
  premium: {
    border: 'border-amber-400/40',
    gradient: 'from-amber-500/15 via-orange-500/10 to-amber-500/5',
    icon: 'text-amber-300 bg-gradient-to-br from-amber-500/30 to-orange-500/20',
    glow: 'shadow-[0_0_40px_-5px_hsl(45_93%_50%/0.4)]',
  },
};

const insightStyles = {
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
  danger: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Sparkles },
};

export function EnterpriseKPICard({
  title,
  value,
  subtitle,
  trend,
  insight,
  icon,
  variant = 'default',
  size = 'md',
  className,
  onClick,
}: EnterpriseKPICardProps) {
  const styles = variantStyles[variant];
  
  const sizeStyles = {
    sm: { padding: 'p-4', title: 'text-[10px]', value: 'text-xl', icon: 'h-4 w-4', iconBox: 'p-2' },
    md: { padding: 'p-5', title: 'text-xs', value: 'text-2xl', icon: 'h-5 w-5', iconBox: 'p-3' },
    lg: { padding: 'p-6', title: 'text-sm', value: 'text-3xl', icon: 'h-6 w-6', iconBox: 'p-4' },
  };
  
  const sizing = sizeStyles[size];

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend?.direction === 'up' ? 'text-emerald-400' : trend?.direction === 'down' ? 'text-red-400' : 'text-muted-foreground';
  
  const InsightIcon = insight ? insightStyles[insight.type].icon : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border-2 transition-all duration-500",
        "bg-gradient-to-br backdrop-blur-xl",
        styles.border,
        styles.gradient,
        styles.glow,
        sizing.padding,
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        "hover:shadow-xl",
        className
      )}
    >
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className={cn(
              "font-semibold uppercase tracking-wider text-muted-foreground mb-2",
              sizing.title
            )}>
              {title}
            </p>
            
            {/* Value */}
            <p className={cn(
              "font-bold font-mono tracking-tight text-foreground leading-none",
              sizing.value
            )}>
              {value}
            </p>
            
            {/* Subtitle with trend */}
            <div className="flex items-center gap-3 mt-2">
              {subtitle && (
                <p className="text-[11px] text-muted-foreground">{subtitle}</p>
              )}
              
              {trend && (
                <div className={cn("flex items-center gap-1", trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span className="text-[11px] font-semibold">
                    {trend.value > 0 ? '+' : ''}{trend.value}%
                  </span>
                  {trend.label && (
                    <span className="text-[10px] text-muted-foreground">{trend.label}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Icon */}
          {icon && (
            <div className={cn(
              "rounded-xl transition-transform duration-300 group-hover:scale-110",
              styles.icon,
              sizing.iconBox
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {/* AI Insight */}
        {insight && InsightIcon && (
          <div className={cn(
            "mt-4 px-3 py-2 rounded-lg flex items-start gap-2",
            insightStyles[insight.type].bg
          )}>
            <InsightIcon className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", insightStyles[insight.type].text)} />
            <p className={cn("text-[11px] leading-relaxed", insightStyles[insight.type].text)}>
              {insight.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface EnterpriseMetricRowProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  icon?: ReactNode;
  suffix?: string;
}

export function EnterpriseMetricRow({
  label,
  value,
  maxValue = 100,
  color = 'bg-primary',
  icon,
  suffix = '',
}: EnterpriseMetricRowProps) {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  return (
    <div className="group flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-2/50 transition-colors">
      {icon && (
        <div className="text-muted-foreground">{icon}</div>
      )}
      <span className="text-xs text-muted-foreground flex-shrink-0 w-32 truncate">{label}</span>
      <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500 group-hover:shadow-glow", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono font-semibold w-12 text-right">
        {value}{suffix}
      </span>
    </div>
  );
}

interface EnterpriseInsightCardProps {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EnterpriseInsightCard({
  type,
  title,
  message,
  action,
  className,
}: EnterpriseInsightCardProps) {
  const styles = {
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-400',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-400',
    },
    danger: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      titleColor: 'text-red-400',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      icon: Sparkles,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-400',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={cn(
      "p-4 rounded-xl border-2",
      style.border,
      style.bg,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", style.bg)}>
          <Icon className={cn("h-4 w-4", style.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-semibold mb-1", style.titleColor)}>{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
          {action && (
            <button 
              onClick={action.onClick}
              className={cn(
                "mt-3 text-xs font-semibold hover:underline underline-offset-2",
                style.titleColor
              )}
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
