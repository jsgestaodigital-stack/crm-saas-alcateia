import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CONTRACT_STATUS_CONFIG, ContractStatus } from '@/types/contract';
import { 
  FileEdit, 
  Send, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  autentiqueStatus?: string | null;
  viewCount?: number | null;
  showTooltip?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const STATUS_ICONS: Record<ContractStatus, React.ReactNode> = {
  draft: <FileEdit className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  viewed: <Eye className="h-3 w-3" />,
  signed: <CheckCircle2 className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  expired: <Clock className="h-3 w-3" />,
};

const STATUS_TOOLTIPS: Record<ContractStatus, string> = {
  draft: 'Este contrato ainda está sendo editado. Finalize e envie para assinatura.',
  sent: 'O contrato foi enviado e está aguardando que o cliente visualize.',
  viewed: 'O cliente já visualizou o contrato. Aguardando assinatura.',
  signed: 'Contrato assinado com sucesso! Todas as partes concordaram.',
  cancelled: 'Este contrato foi cancelado e não é mais válido.',
  expired: 'O prazo para assinatura deste contrato expirou.',
};

export function ContractStatusBadge({ 
  status, 
  autentiqueStatus, 
  viewCount = 0,
  showTooltip = true,
  size = 'default'
}: ContractStatusBadgeProps) {
  const config = CONTRACT_STATUS_CONFIG[status];
  const icon = STATUS_ICONS[status];
  const tooltip = STATUS_TOOLTIPS[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const badge = (
    <Badge className={`${config.color} ${sizeClasses[size]} gap-1.5`}>
      {icon}
      <span>{config.emoji} {config.label}</span>
      {viewCount && viewCount > 0 && status !== 'draft' && (
        <span className="ml-1 opacity-75">({viewCount}x)</span>
      )}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
          {autentiqueStatus && autentiqueStatus !== status && (
            <p className="text-xs text-muted-foreground mt-1">
              Status Autentique: {autentiqueStatus}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para mostrar o progresso/timeline do contrato
export function ContractStatusTimeline({ 
  status, 
  sentAt,
  firstViewedAt,
  signedAt
}: { 
  status: ContractStatus;
  sentAt?: string | null;
  firstViewedAt?: string | null;
  signedAt?: string | null;
}) {
  const steps = [
    { key: 'draft', label: 'Rascunho', completed: true },
    { key: 'sent', label: 'Enviado', completed: ['sent', 'viewed', 'signed'].includes(status), date: sentAt },
    { key: 'viewed', label: 'Visualizado', completed: ['viewed', 'signed'].includes(status), date: firstViewedAt },
    { key: 'signed', label: 'Assinado', completed: status === 'signed', date: signedAt },
  ];

  if (status === 'cancelled' || status === 'expired') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>
          {status === 'cancelled' ? 'Contrato cancelado' : 'Contrato expirado'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center">
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${step.completed 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }`}
            >
              {step.completed ? '✓' : index + 1}
            </div>
            <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`w-8 h-0.5 ${
                steps[index + 1].completed ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
