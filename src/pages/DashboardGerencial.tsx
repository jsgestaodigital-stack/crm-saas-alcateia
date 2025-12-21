import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, BarChart3, Calendar, Filter, ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardBI } from "@/hooks/useDashboardBI";
import { 
  LeadsKPICard, 
  ProposalsKPICard, 
  ContractsKPICard, 
  RevenueKPICard, 
  ProjectsKPICard,
  RecurringKPICard,
  AvgTimeKPICard,
  LeadsFunnelChart,
  TemperatureChart,
  ProposalsStatusChart,
  ContractsTypeChart,
  ProjectsColumnChart,
  MonthlyTrendChart,
  RevenueChart,
  AlertsPanel,
} from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function DashboardGerencial() {
  const { user, isLoading: authLoading, isAdmin, permissions, derived } = useAuth();
  const navigate = useNavigate();
  
  // Check admin access
  const hasAccess = isAdmin || permissions.isSuperAdmin || permissions.canAdmin || derived.canAdminOrIsAdmin;
  
  // Fetch BI data
  const { data, loading, error, refetch } = useDashboardBI();

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && user && !hasAccess) {
      navigate("/dashboard");
    }
  }, [authLoading, user, hasAccess, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">Acesso Restrito</h1>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar o Dashboard Gerencial. 
              Esta área é exclusiva para administradores.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados do BI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">Erro ao carregar dados</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Voltar
              </Button>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { kpis, financial, alerts, monthlyTrend } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Dashboard Gerencial</h1>
                <p className="text-sm text-muted-foreground">
                  Visão completa da sua agência
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                Voltar ao Dashboard
              </Button>
              <Button size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <LeadsKPICard 
            total={kpis.leads.total} 
            converted={kpis.leads.converted} 
            conversionRate={kpis.leads.conversionRate} 
          />
          <ProposalsKPICard 
            sent={kpis.proposals.sent + kpis.proposals.viewed} 
            accepted={kpis.proposals.accepted} 
            conversionRate={kpis.proposals.conversionRate} 
          />
          <ContractsKPICard 
            active={kpis.contracts.active} 
            expiringSoon={kpis.contracts.expiringSoon} 
          />
          <ProjectsKPICard 
            active={kpis.projects.active} 
            delivered={kpis.projects.delivered} 
            delayed={kpis.projects.delayed} 
          />
          <RecurringKPICard 
            active={kpis.recurring.active} 
            monthlyRevenue={kpis.recurring.monthlyRevenue} 
          />
          <RevenueKPICard 
            value={financial.monthlyRecurring} 
            label="MRR Total" 
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-surface-2 border border-border/50">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="proposals">Propostas</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Alerts */}
            {alerts.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Alertas Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertsPanel alerts={alerts} />
                </CardContent>
              </Card>
            )}

            {/* Trend Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <MonthlyTrendChart data={monthlyTrend} type="area" />
              <RevenueChart data={monthlyTrend} />
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                    Pipeline Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financial.totalPipeline)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Valor estimado em leads</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                    Propostas Aceitas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financial.totalAcceptedProposals)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Valor fechado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                    Tempo Médio Resposta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {kpis.proposals.avgResponseTime < 24 
                      ? `${kpis.proposals.avgResponseTime}h` 
                      : `${Math.round(kpis.proposals.avgResponseTime / 24)}d`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Propostas</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <LeadsKPICard 
                total={kpis.leads.total} 
                converted={kpis.leads.converted} 
                conversionRate={kpis.leads.conversionRate} 
              />
              <RevenueKPICard value={kpis.leads.totalValue} label="Pipeline Total" />
              <AvgTimeKPICard hours={0} label="Tempo Médio Ciclo" />
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Perdidos</p>
                  <p className="text-2xl font-bold text-red-500">{kpis.leads.lost}</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <LeadsFunnelChart byStage={kpis.leads.byStage} />
              <TemperatureChart byTemperature={kpis.leads.byTemperature} />
            </div>
          </TabsContent>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <ProposalsKPICard 
                sent={kpis.proposals.sent + kpis.proposals.viewed} 
                accepted={kpis.proposals.accepted} 
                conversionRate={kpis.proposals.conversionRate} 
              />
              <RevenueKPICard value={kpis.proposals.totalValue} label="Valor Total" />
              <RevenueKPICard value={kpis.proposals.acceptedValue} label="Valor Aceito" />
              <AvgTimeKPICard hours={kpis.proposals.avgResponseTime} label="Tempo Resposta" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ProposalsStatusChart 
                draft={kpis.proposals.draft}
                sent={kpis.proposals.sent}
                viewed={kpis.proposals.viewed}
                accepted={kpis.proposals.accepted}
                rejected={kpis.proposals.rejected}
                expired={kpis.proposals.expired}
              />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Detalhamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rascunhos</span>
                    <span className="font-medium">{kpis.proposals.draft}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Enviadas</span>
                    <span className="font-medium">{kpis.proposals.sent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Visualizadas</span>
                    <span className="font-medium">{kpis.proposals.viewed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-500">Aceitas</span>
                    <span className="font-medium text-emerald-500">{kpis.proposals.accepted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-500">Recusadas</span>
                    <span className="font-medium text-red-500">{kpis.proposals.rejected}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-500">Expiradas</span>
                    <span className="font-medium text-amber-500">{kpis.proposals.expired}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <ContractsKPICard active={kpis.contracts.active} expiringSoon={kpis.contracts.expiringSoon} />
              <RevenueKPICard value={kpis.contracts.totalValue} label="Valor Total" />
              <RevenueKPICard value={kpis.contracts.monthlyRecurring} label="MRR Contratos" />
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Aguardando Assinatura</p>
                  <p className="text-2xl font-bold text-amber-500">{kpis.contracts.pending}</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ContractsTypeChart recurring={kpis.contracts.recurring} oneTime={kpis.contracts.oneTime} />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status dos Contratos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rascunhos</span>
                    <span className="font-medium">{kpis.contracts.draft}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aguardando Assinatura</span>
                    <span className="font-medium">{kpis.contracts.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Assinados</span>
                    <span className="font-medium">{kpis.contracts.signed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-500">Ativos</span>
                    <span className="font-medium text-emerald-500">{kpis.contracts.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-500">Vencendo em 30 dias</span>
                    <span className="font-medium text-amber-500">{kpis.contracts.expiringSoon}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-500">Cancelados</span>
                    <span className="font-medium text-red-500">{kpis.contracts.cancelled}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <ProjectsKPICard 
                active={kpis.projects.active} 
                delivered={kpis.projects.delivered} 
                delayed={kpis.projects.delayed} 
              />
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Total de Projetos</p>
                  <p className="text-2xl font-bold">{kpis.projects.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Entregues</p>
                  <p className="text-2xl font-bold text-emerald-500">{kpis.projects.delivered}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Atrasados</p>
                  <p className="text-2xl font-bold text-red-500">{kpis.projects.delayed}</p>
                </CardContent>
              </Card>
            </div>
            <ProjectsColumnChart byColumn={kpis.projects.byColumn} />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              <RevenueKPICard value={financial.totalPipeline} label="Pipeline" />
              <RevenueKPICard value={financial.totalProposals} label="Propostas" />
              <RevenueKPICard value={financial.totalAcceptedProposals} label="Aceitas" />
              <RevenueKPICard value={financial.totalContracts} label="Contratos" />
              <RevenueKPICard value={financial.monthlyRecurring} label="MRR Total" />
            </div>
            <RevenueChart data={monthlyTrend} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
