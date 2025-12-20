import { useState } from 'react';
import { useClientsV2, ClientV2 } from '@/hooks/useClientsV2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Building2, Phone, Mail, RefreshCw } from 'lucide-react';
import { ClientV2Dialog } from './ClientV2Dialog';
import { format } from 'date-fns';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Ativo', variant: 'default' },
  paused: { label: 'Pausado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export function ClientsV2List() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientV2 | null>(null);

  const { clients, loading, totalCount, refetch, createClient, updateClient, deleteClient } = useClientsV2({
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter || undefined,
  });

  const handleEdit = (client: ClientV2) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: Partial<ClientV2>) => {
    if (selectedClient) {
      await updateClient(selectedClient.id, data);
    } else {
      await createClient(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedClient) {
      await deleteClient(selectedClient.id);
      setDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Clientes CRM
            <Badge variant="outline" className="ml-2">{totalCount}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(client)}
                  >
                    <TableCell className="font-medium">{client.company_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm">
                        {client.contact_name && <span>{client.contact_name}</span>}
                        {client.email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {client.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.plan_name || '-'}</TableCell>
                    <TableCell>
                      {client.monthly_value
                        ? `R$ ${client.monthly_value.toLocaleString('pt-BR')}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[client.status]?.variant || 'secondary'}>
                        {statusLabels[client.status]?.label || client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.start_date
                        ? format(new Date(client.start_date), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ClientV2Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
        onSave={handleSave}
        onDelete={selectedClient ? handleDelete : undefined}
      />
    </Card>
  );
}
