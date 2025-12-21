import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CONTRACT_STATUS_CONFIG, ContractStatus } from '@/types/contract';
import { 
  FileEdit, 
  CheckCircle2, 
  XCircle, 
  Clock
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  showTooltip?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const STATUS_ICONS: Record<ContractStatus, React.ReactNode> = {
  draft: <FileEdit className="h-3 w-3" />,
  sent: <FileEdit className="h-3 w-3" />,
  viewed: <FileEdit className="h-3 w-3" />,
  signed: <CheckCircle2 className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  expired: <Clock className="h-3 w-3" />,
};

const STATUS_TOOLTIPS: Record<ContractStatus, string> = {
  draft: 'Este contrato ainda está sendo editado.',
  sent: 'Contrato pronto para uso.',
  viewed: 'Contrato pronto para uso.',
  signed: 'Contrato assinado com sucesso!',
  cancelled: 'Este contrato foi cancelado.',
  expired: 'Este contrato expirou.',
};

export function ContractStatusBadge({ 
  status, 
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
