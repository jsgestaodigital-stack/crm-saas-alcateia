import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Proposal, PROPOSAL_STATUS_CONFIG } from '@/types/proposal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Send,
  Link,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProposalsListProps {
  proposals: Proposal[];
  onNew: () => void;
  onEdit: (proposal: Proposal) => void;
  onView: (proposal: Proposal) => void;
  onDuplicate: (proposal: Proposal) => void;
  onDelete: (id: string) => void;
  onSend: (proposal: Proposal) => void;
}

export function ProposalsList({
  proposals,
  onNew,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
  onSend
}: ProposalsListProps) {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProposals = proposals.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name.toLowerCase().includes(search.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const copyPublicLink = (proposal: Proposal) => {
    if (proposal.public_token) {
      const url = `${window.location.origin}/proposta/${proposal.public_token}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar propostas..."
            className="pl-10"
          />
        </div>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      {filteredProposals.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma proposta encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'Tente uma busca diferente' : 'Comece criando sua primeira proposta'}
          </p>
          {!search && (
            <Button onClick={onNew}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Proposta
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProposals.map((proposal) => {
            const statusConfig = PROPOSAL_STATUS_CONFIG[proposal.status];
            
            return (
              <Card key={proposal.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{proposal.title}</h3>
                        <Badge className={cn("shrink-0", statusConfig.color)}>
                          {statusConfig.emoji} {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {proposal.company_name || proposal.client_name}
                        {proposal.city && ` • ${proposal.city}`}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Criada em {format(new Date(proposal.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {proposal.valid_until && (
                          <span>
                            Válida até {format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {proposal.view_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {proposal.view_count} visualização{proposal.view_count > 1 ? 'ões' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="font-semibold text-primary">
                          {formatCurrency(proposal.discounted_price || proposal.full_price)}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(proposal)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(proposal)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(proposal)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          {proposal.public_token && (
                            <DropdownMenuItem onClick={() => copyPublicLink(proposal)}>
                              <Link className="h-4 w-4 mr-2" />
                              Copiar Link
                            </DropdownMenuItem>
                          )}
                          {proposal.status === 'draft' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onSend(proposal)}>
                                <Send className="h-4 w-4 mr-2" />
                                Marcar como Enviada
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(proposal.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A proposta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
