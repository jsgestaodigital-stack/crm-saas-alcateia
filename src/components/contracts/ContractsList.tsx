import React from 'react';
import { Contract, CONTRACT_TYPE_CONFIG } from '@/types/contract';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractStatusBadge } from './ContractStatusBadge';
import { 
  FileText, 
  Eye, 
  Copy, 
  Trash2, 
  ExternalLink,
  Calendar,
  Building2,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface ContractsListProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onSend: (contract: Contract) => void;
  onDuplicate: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onViewPublic: (contract: Contract) => void;
}

export function ContractsList({
  contracts,
  onEdit,
  onSend,
  onDuplicate,
  onDelete,
  onViewPublic
}: ContractsListProps) {
  if (contracts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum contrato encontrado</h3>
        <p className="text-muted-foreground">
          Crie seu primeiro contrato para começar
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {contracts.map((contract) => {
        const typeConfig = CONTRACT_TYPE_CONFIG[contract.contract_type];

        return (
          <Card 
            key={contract.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onEdit(contract)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeConfig.emoji}</span>
                  <div>
                    <h3 className="font-medium line-clamp-1">{contract.title}</h3>
                    <p className="text-sm text-muted-foreground">{typeConfig.label}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(contract); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {contract.public_token && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewPublic(contract); }}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Link Público
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(contract); }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(contract); }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Client */}
              {contract.contracted_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  <span className="line-clamp-1">{contract.contracted_name}</span>
                </div>
              )}

              {/* Value */}
              {contract.full_price && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span>R$ {contract.full_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(contract.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <ContractStatusBadge 
                  status={contract.status} 
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
