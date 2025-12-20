import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Plus, 
  ArrowLeft,
  TrendingUp,
  Banknote,
  FileCheck,
  Wallet,
  PiggyBank,
  Calendar,
  Filter,
  Building2,
  User,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClientStore } from "@/stores/clientStore";
import { useCommissions, PaymentStatus, Commission } from "@/hooks/useCommissions";
import { 
  CommissionKPI, 
  CommissionTimeline, 
  CommissionsByRecipient, 
  CommissionForecast,
  CommissionCard,
  CommissionConfigPanel
} from "@/components/commissions";

// Icon mapping for role labels
const ROLE_ICON_MAP: Record<string, any> = {
  'sdr': User,
  'vendedor': User,
  'fotógrafo': User,
  'operacional': User,
  'designer': User,
  'freelancer': User,
  'avulso': User,
};

const getRoleIcon = (label: string) => {
  const normalizedLabel = label.toLowerCase();
  return ROLE_ICON_MAP[normalizedLabel] || User;
};

export default function Commissions() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, derived, isAdmin: userIsAdmin } = useAuth();
  const { clients } = useClientStore();
  
  const {
    commissions,
    roles,
    loading,
    isAdmin,
    stats,
    getRoleById,
    getCommissionRoleLabel,
    approveCommission,
    markAsPaid,
    cancelCommission,
    refetch,
  } = useCommissions({ filterByUser: !derived?.canFinanceOrAdmin });
  
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "week">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  
  // Form state
  const [formClientId, setFormClientId] = useState("");
  const [formSaleValue, setFormSaleValue] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formRecipientName, setFormRecipientName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const canAccessPage = derived?.canFinanceOrAdmin || (user !== null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Set default role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !formRoleId) {
      const operationalRole = roles.find(r => r.label.toLowerCase() === 'operacional');
      if (operationalRole) {
        setFormRoleId(operationalRole.id);
      } else {
        setFormRoleId(roles[0].id);
      }
    }
  }, [roles, formRoleId]);

  const handleAddCommission = async () => {
    if (!formClientId || !formRecipientName || !formDescription || !formAmount || !formRoleId) {
      toast.warning("Preencha todos os campos obrigatórios");
      return;
    }

    const client = clients.find(c => c.id === formClientId);
    if (!client) {
      toast.error("Cliente não encontrado");
      return;
    }

    const selectedRole = getRoleById(formRoleId);

    try {
      const { error } = await (supabase.from("commissions_v2" as any).insert({
        client_id: formClientId,
        client_name: client.companyName,
        sale_value: formSaleValue ? parseFloat(formSaleValue) : null,
        recipient_role_id: formRoleId,
        recipient_type: selectedRole?.label.toLowerCase() || 'operational',
        recipient_name: formRecipientName,
        description: formDescription,
        amount: parseFloat(formAmount),
        status: 'pending',
        delivered_at: new Date().toISOString(),
        notes: formNotes || null,
        created_by: user?.id,
      }) as any);

      if (error) throw error;

      toast.success("Comissão registrada!");
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error("Error adding commission:", error);
      toast.error("Erro ao registrar comissão");
    }
  };

  const resetForm = () => {
    setFormClientId("");
    setFormSaleValue("");
    const operationalRole = roles.find(r => r.label.toLowerCase() === 'operacional');
    setFormRoleId(operationalRole?.id || roles[0]?.id || "");
    setFormRecipientName("");
    setFormDescription("");
    setFormAmount("");
    setFormNotes("");
  };

  // Filtered commissions
  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const statusMatch = filter === "all" || c.status === filter;
      
      let periodMatch = true;
      if (periodFilter !== "all") {
        const date = parseISO(c.created_at);
        const now = new Date();
        if (periodFilter === "month") {
          periodMatch = date >= startOfMonth(now) && date <= endOfMonth(now);
        } else if (periodFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodMatch = date >= weekAgo;
        }
      }
      
      return statusMatch && periodMatch;
    });
  }, [commissions, filter, periodFilter]);

  if (!canAccessPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-status-danger mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página</p>
          <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-primary text-lg font-medium animate-pulse">Carregando...</div>
        </div>
      </div>
    );
  }

  // Render different views based on role
  return isAdmin ? (
    <AdminCommissionView
      commissions={commissions}
      filteredCommissions={filteredCommissions}
      stats={stats}
      roles={roles}
      filter={filter}
      setFilter={setFilter}
      periodFilter={periodFilter}
      setPeriodFilter={setPeriodFilter}
      isAddDialogOpen={isAddDialogOpen}
      setIsAddDialogOpen={setIsAddDialogOpen}
      selectedCommission={selectedCommission}
      setSelectedCommission={setSelectedCommission}
      clients={clients}
      formClientId={formClientId}
      setFormClientId={setFormClientId}
      formSaleValue={formSaleValue}
      setFormSaleValue={setFormSaleValue}
      formRoleId={formRoleId}
      setFormRoleId={setFormRoleId}
      formRecipientName={formRecipientName}
      setFormRecipientName={setFormRecipientName}
      formDescription={formDescription}
      setFormDescription={setFormDescription}
      formAmount={formAmount}
      setFormAmount={setFormAmount}
      formNotes={formNotes}
      setFormNotes={setFormNotes}
      handleAddCommission={handleAddCommission}
      getRoleById={getRoleById}
      getCommissionRoleLabel={getCommissionRoleLabel}
      approveCommission={approveCommission}
      markAsPaid={markAsPaid}
      cancelCommission={cancelCommission}
      navigate={navigate}
    />
  ) : (
    <CollaboratorCommissionView
      commissions={commissions}
      stats={stats}
      getCommissionRoleLabel={getCommissionRoleLabel}
      navigate={navigate}
    />
  );
}

// ==================== ADMIN VIEW ====================
interface AdminViewProps {
  commissions: Commission[];
  filteredCommissions: Commission[];
  stats: any;
  roles: any[];
  filter: "all" | PaymentStatus;
  setFilter: (f: "all" | PaymentStatus) => void;
  periodFilter: string;
  setPeriodFilter: (p: any) => void;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (o: boolean) => void;
  selectedCommission: Commission | null;
  setSelectedCommission: (c: Commission | null) => void;
  clients: any[];
  formClientId: string;
  setFormClientId: (v: string) => void;
  formSaleValue: string;
  setFormSaleValue: (v: string) => void;
  formRoleId: string;
  setFormRoleId: (v: string) => void;
  formRecipientName: string;
  setFormRecipientName: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formAmount: string;
  setFormAmount: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  handleAddCommission: () => void;
  getRoleById: (id: string | null) => any;
  getCommissionRoleLabel: (c: Commission) => string;
  approveCommission: (id: string) => Promise<boolean>;
  markAsPaid: (id: string) => Promise<boolean>;
  cancelCommission: (id: string) => Promise<boolean>;
  navigate: (path: string) => void;
}

function AdminCommissionView(props: AdminViewProps) {
  const {
    commissions,
    filteredCommissions,
    stats,
    roles,
    filter,
    setFilter,
    periodFilter,
    setPeriodFilter,
    isAddDialogOpen,
    setIsAddDialogOpen,
    selectedCommission,
    setSelectedCommission,
    clients,
    formClientId,
    setFormClientId,
    formSaleValue,
    setFormSaleValue,
    formRoleId,
    setFormRoleId,
    formRecipientName,
    setFormRecipientName,
    formDescription,
    setFormDescription,
    formAmount,
    setFormAmount,
    formNotes,
    setFormNotes,
    handleAddCommission,
    getRoleById,
    getCommissionRoleLabel,
    approveCommission,
    markAsPaid,
    cancelCommission,
    navigate,
  } = props;

  const [activeTab, setActiveTab] = useState<"commissions" | "config">("commissions");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Gestão de Comissões
              </h1>
              <p className="text-sm text-muted-foreground">Painel do Administrador</p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Comissão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" />
                  Registrar Comissão Manual
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={formClientId} onValueChange={setFormClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor da Venda (R$)</Label>
                  <Input
                    type="number"
                    value={formSaleValue}
                    onChange={(e) => setFormSaleValue(e.target.value)}
                    placeholder="Valor negociado"
                  />
                </div>

                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Função *</Label>
                    <Select value={formRoleId} onValueChange={setFormRoleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formRecipientName}
                      onChange={(e) => setFormRecipientName(e.target.value)}
                      placeholder="Nome da pessoa"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Venda, Gestão GMN, Pack de artes..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor da Comissão (R$) *</Label>
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Notas adicionais..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAddCommission}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Tabs: Commissions vs Config */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="commissions" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Comissões
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="p-4 sm:p-6">
        {activeTab === "config" ? (
          <div className="max-w-3xl">
            <CommissionConfigPanel />
          </div>
        ) : (
          <>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <CommissionKPI
            title="Total Gerado"
            value={stats.totalGenerated}
            icon={TrendingUp}
            color="primary"
            subtitle={`${stats.count.total} comissões`}
          />
          <CommissionKPI
            title="A Pagar"
            value={stats.totalPending}
            icon={Clock}
            color="warning"
            subtitle={`${stats.count.pending + stats.count.approved} pendentes`}
          />
          <CommissionKPI
            title="Total Pago"
            value={stats.totalPaid}
            icon={CheckCircle2}
            color="success"
            subtitle={`${stats.count.paid} pagamentos`}
          />
          <CommissionKPI
            title="Este Mês"
            value={stats.thisMonthTotal}
            icon={Calendar}
            color="info"
            trend={stats.monthlyChange !== 0 ? { value: stats.monthlyChange, label: "vs mês anterior" } : undefined}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Commission List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card className="border-border/30">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtros:</span>
                  </div>
                  
                  <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs h-7 px-2">
                        Todas
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="text-xs h-7 px-2">
                        Pendentes
                      </TabsTrigger>
                      <TabsTrigger value="approved" className="text-xs h-7 px-2">
                        Aprovadas
                      </TabsTrigger>
                      <TabsTrigger value="paid" className="text-xs h-7 px-2">
                        Pagas
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo período</SelectItem>
                      <SelectItem value="month">Este mês</SelectItem>
                      <SelectItem value="week">Últimos 7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Commission List */}
            <ScrollArea className="h-[calc(100vh-420px)]">
              <div className="space-y-3">
                {filteredCommissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhuma comissão encontrada</p>
                  </div>
                ) : (
                  filteredCommissions.map((commission) => (
                    <CommissionCard
                      key={commission.id}
                      commission={commission}
                      roleLabel={getCommissionRoleLabel(commission)}
                      isAdmin={true}
                      onApprove={() => approveCommission(commission.id)}
                      onMarkAsPaid={() => markAsPaid(commission.id)}
                      onCancel={() => cancelCommission(commission.id)}
                      onClick={() => setSelectedCommission(commission)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            <CommissionsByRecipient
              commissions={commissions}
              roles={roles}
              getRoleById={getRoleById}
            />
            <CommissionForecast
              commissions={commissions}
              showMonthlyBreakdown={true}
            />
          </div>
        </div>
        </>
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCommission} onOpenChange={() => setSelectedCommission(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedCommission && (
            <CommissionDetailDialog
              commission={selectedCommission}
              roleLabel={getCommissionRoleLabel(selectedCommission)}
              onApprove={() => approveCommission(selectedCommission.id)}
              onMarkAsPaid={() => markAsPaid(selectedCommission.id)}
              onCancel={() => cancelCommission(selectedCommission.id)}
              onClose={() => setSelectedCommission(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== COLLABORATOR VIEW ====================
interface CollaboratorViewProps {
  commissions: Commission[];
  stats: any;
  getCommissionRoleLabel: (c: Commission) => string;
  navigate: (path: string) => void;
}

function CollaboratorCommissionView(props: CollaboratorViewProps) {
  const { commissions, stats, getCommissionRoleLabel, navigate } = props;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" />
              Minhas Comissões
            </h1>
            <p className="text-sm text-muted-foreground">Acompanhe seus ganhos</p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {stats.totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-status-success/5 border-status-success/20">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-status-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-status-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Já Recebi</p>
                  <p className="text-2xl font-bold text-status-success">
                    R$ {stats.totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* This month */}
        <Card className="mb-6 border-border/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Este mês</span>
              </div>
              <span className="text-lg font-bold">
                R$ {stats.thisMonthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Histórico de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CommissionTimeline commissions={commissions} maxItems={10} />
          </CardContent>
        </Card>

        {/* Forecast for collaborator */}
        <div className="mt-6">
          <CommissionForecast commissions={commissions} showMonthlyBreakdown={false} />
        </div>
      </main>
    </div>
  );
}

// ==================== DETAIL DIALOG ====================
interface DetailDialogProps {
  commission: Commission;
  roleLabel: string;
  onApprove: () => void;
  onMarkAsPaid: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-status-warning/20 text-status-warning border-status-warning/30", icon: Clock },
  approved: { label: "Aprovado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: FileCheck },
  paid: { label: "Pago", color: "bg-status-success/20 text-status-success border-status-success/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-status-danger/20 text-status-danger border-status-danger/30", icon: XCircle },
};

function CommissionDetailDialog({ commission, roleLabel, onApprove, onMarkAsPaid, onCancel, onClose }: DetailDialogProps) {
  const statusConfig = STATUS_CONFIG[commission.status];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          {commission.client_name}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge className={cn("border", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Valor da Comissão</span>
          <span className="text-xl font-bold text-primary">
            R$ {Number(commission.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {commission.sale_value && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Valor da Venda</span>
            <span className="font-medium">
              R$ {Number(commission.sale_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Comissionado</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {roleLabel}
            </Badge>
            <span className="font-medium">{commission.recipient_name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Entrega</span>
          <span className="font-medium">{commission.description}</span>
        </div>

        {commission.delivered_at && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Data da Entrega</span>
            <span>{format(parseISO(commission.delivered_at), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}

        {commission.paid_at && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Data do Pagamento</span>
            <span className="text-status-success">
              {format(parseISO(commission.paid_at), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {commission.notes && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-sm text-muted-foreground mb-1">Observações</p>
            <p className="text-sm">{commission.notes}</p>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        {commission.status === "pending" && (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={onApprove} className="bg-blue-500 hover:bg-blue-600">
              Aprovar
            </Button>
          </>
        )}
        {commission.status === "approved" && (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={onMarkAsPaid} className="bg-status-success hover:bg-status-success/90">
              Marcar como Pago
            </Button>
          </>
        )}
        {(commission.status === "paid" || commission.status === "cancelled") && (
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        )}
      </DialogFooter>
    </>
  );
}
