import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Download, 
  Calendar, 
  ArrowLeft,
  Loader2,
  BarChart3,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Lightbulb,
  Zap,
  Clock,
  RefreshCw,
  PieChart,
  Layers,
  Repeat,
  FileText,
  FileSignature,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useDashboardBI } from "@/hooks/useDashboardBI";
import { 
  MonthlyTrendChart, 
  RevenueChart, 
  ProposalsStatusChart, 
  ContractsTypeChart,
  AlertsPanel,
} from "@/components/bi";

import {
  ExecutiveKPICard,
  SectionHeader,
  InsightCard,
  FunnelVisualization,
  CrossAnalysisChart,
  HealthScoreGauge,
  AlertsList,
  FinancialProjection,
  RankingTable,
  WeeklyHeatmap,
  TrendComparisonTable,
} from "@/components/manager-report";
import { ProFeatureGate } from "@/components/plan";
import { useTrialFeatures } from "@/hooks/useTrialFeatures";

// Types
interface Metrics {
  clients: {
    total: number;
    byColumn: Record<string, number>;
    movements: { from: string; to: string; count: number }[];
    stalled: { id: string; name: string; daysSinceUpdate: number }[];
    checklistProgress: { section: string; completed: number; total: number }[];
  };
  leads: {
    total: number;
    byStage: Record<string, number>;
    created: number;
    gained: number;
    lost: number;
    lostReasons: { reason: string; count: number }[];
    overdueActions: { id: string; name: string; nextAction: string; dueDate: string }[];
    hotWithoutActivity: { id: string; name: string; daysSinceActivity: number }[];
  };
  commissions: {
    pending: { count: number; amount: number };
    approved: { count: number; amount: number };
    paid: { count: number; amount: number };
    cancelled: { count: number; amount: number };
    byRole: { role: string; amount: number }[];
    topRecipients: { name: string; amount: number }[];
    topClients: { name: string; amount: number }[];
  };
  recurring: {
    totalClients: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    weeklyComplianceRate: number;
    byRoutine: { routine: string; completed: number; total: number }[];
    atRiskClients: { name: string; complianceRate: number; daysSinceAction: number }[];
    mrr: number;
    annualValue: number;
    avgContractValue: number;
  };
  timeline: {
    date: string;
    count: number;
    byType: Record<string, number>;
  }[];
  activities: {
    id: string;
    createdAt: string;
    userName: string;
    actionType: string;
    entityType: string;
    entityName: string;
    metadata: Record<string, unknown>;
  }[];
  trends: {
    leadsTrend: { current: number; previous: number; monthAgo: number };
    gainedTrend: { current: number; previous: number; monthAgo: number };
    lostTrend: { current: number; previous: number; monthAgo: number };
    deliveredTrend: { current: number; previous: number; monthAgo: number };
    activitiesTrend: { current: number; previous: number; monthAgo: number };
  };
  insights: {
    operationalBottleneck: { column: string; count: number } | null;
    salesBottleneck: { stage: string; count: number } | null;
    topLossReasons: { reason: string; count: number }[];
    focusActions: string[];
    risks: { type: string; entity: string; days: number }[];
  };
  heatmap: {
    dayOfWeek: number;
    count: number;
  }[];
}

type PeriodPreset = 'today' | '7d' | '30d' | 'month' | 'custom';

const COLUMN_LABELS: Record<string, string> = {
  pipeline: 'Pipeline',
  onboarding: 'Onboarding',
  optimization: 'Otimização',
  ready_to_deliver: 'Pronto p/ Entregar',
  delivered: 'Entregues',
  suspended: 'Suspensos',
  finalized: 'Finalizados'
};

const STAGE_LABELS: Record<string, string> = {
  cold: 'Frio',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  meeting_scheduled: 'Reunião Agendada',
  meeting_done: 'Reunião Realizada',
  proposal_sent: 'Proposta Enviada',
  negotiating: 'Negociando',
  future: 'Futuro',
  gained: 'Ganho',
  lost: 'Perdido'
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#eab308',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899'
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const ManagerReport = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, derived } = useAuth();
  const { toast } = useToast();
  const { isManagerReportBlocked, isTrial } = useTrialFeatures();
  
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30d');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("executive");

  // Fetch BI data for proposals and contracts
  const { data: biData, loading: biLoading, refetch: refetchBI } = useDashboardBI();

  const canAccess = derived?.canAdminOrIsAdmin;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (canAccess) {
      fetchReport();
    }
  }, [canAccess, startDate, endDate]);

  const handlePeriodChange = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    const now = new Date();
    
    switch (preset) {
      case 'today':
        setStartDate(now);
        setEndDate(now);
        break;
      case '7d':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30d':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case 'month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'custom':
        setDatePickerOpen(true);
        break;
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({ title: "Sessão expirada", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke('generate-manager-report', {
        body: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          format: 'json'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Computed Data for Charts
  const computedData = useMemo(() => {
    if (!metrics) return null;

    // Timeline for area chart
    const timelineData = metrics.timeline.map(t => ({
      date: format(new Date(t.date), 'dd/MM'),
      atividades: t.count
    }));

    // Heatmap data
    const heatmapData = metrics.heatmap.map(h => ({
      day: DAY_NAMES[h.dayOfWeek],
      value: h.count
    }));

    // Column funnel data
    const columnFunnelData = Object.entries(metrics.clients.byColumn)
      .filter(([_, v]) => v > 0)
      .map(([col, count]) => ({
        name: COLUMN_LABELS[col] || col,
        value: count as number,
      }));

    // Stage funnel data
    const stageFunnelData = Object.entries(metrics.leads.byStage)
      .filter(([stage, v]) => v > 0 && !['gained', 'lost'].includes(stage))
      .map(([stage, count]) => ({
        name: STAGE_LABELS[stage] || stage,
        value: count as number,
      }));

    // Lost reasons pie
    const lostReasonsPie = metrics.leads.lostReasons.slice(0, 6);

    // Commissions by role
    const commissionsByRole = metrics.commissions.byRole.map(r => ({
      name: r.role,
      value: r.amount,
    }));

    // Top recipients
    const topRecipients = metrics.commissions.topRecipients.slice(0, 5).map(r => ({
      name: r.name,
      value: r.amount,
    }));

    // Cross analysis - Volume x Conversão
    const conversionRate = metrics.leads.created > 0 
      ? ((metrics.leads.gained / metrics.leads.created) * 100) 
      : 0;

    // Calculate operational health score
    const stalledPenalty = Math.min(30, metrics.clients.stalled.length * 5);
    const completionBonus = metrics.recurring.weeklyComplianceRate || 0;
    const operationalHealth = Math.max(0, Math.min(100, 70 - stalledPenalty + (completionBonus * 0.3)));

    // Calculate sales health score
    const lossRatio = metrics.leads.created > 0 
      ? (metrics.leads.lost / metrics.leads.created) * 100 
      : 0;
    const hotLeadsPenalty = Math.min(20, metrics.leads.hotWithoutActivity.length * 4);
    const salesHealth = Math.max(0, Math.min(100, 80 - lossRatio - hotLeadsPenalty + conversionRate));

    // Alerts list
    const alerts = [
      ...metrics.clients.stalled.slice(0, 10).map(c => ({
        id: c.id,
        title: c.name,
        subtitle: 'Cliente parado',
        value: `${c.daysSinceUpdate}d`,
        severity: c.daysSinceUpdate > 14 ? 'critical' as const : 'warning' as const,
      })),
      ...metrics.leads.hotWithoutActivity.slice(0, 5).map(l => ({
        id: l.id,
        title: l.name,
        subtitle: 'Lead quente sem atividade',
        value: `${l.daysSinceActivity}d`,
        severity: l.daysSinceActivity > 7 ? 'critical' as const : 'warning' as const,
      })),
      ...metrics.leads.overdueActions.slice(0, 5).map(l => ({
        id: l.id,
        title: l.name,
        subtitle: l.nextAction,
        value: l.dueDate,
        severity: 'warning' as const,
      })),
    ];

    // Financial summary
    const totalCommissions = 
      metrics.commissions.pending.amount + 
      metrics.commissions.approved.amount + 
      metrics.commissions.paid.amount;

    // Trend items for comparison table
    const trendItems = [
      { label: 'Leads Criados', current: metrics.trends.leadsTrend.current, previous: metrics.trends.leadsTrend.previous, icon: Target },
      { label: 'Leads Ganhos', current: metrics.trends.gainedTrend.current, previous: metrics.trends.gainedTrend.previous, icon: TrendingUp },
      { label: 'Leads Perdidos', current: metrics.trends.lostTrend.current, previous: metrics.trends.lostTrend.previous, icon: AlertTriangle, inverted: true },
      { label: 'Clientes Entregues', current: metrics.trends.deliveredTrend.current, previous: metrics.trends.deliveredTrend.previous, icon: Users },
      { label: 'Atividades', current: metrics.trends.activitiesTrend.current, previous: metrics.trends.activitiesTrend.previous, icon: Activity },
    ];

    // Insights categorization
    const positiveInsights: string[] = [];
    const negativeInsights: string[] = [];
    const warningInsights: string[] = [];

    if (conversionRate >= 30) {
      positiveInsights.push(`Taxa de conversão de ${conversionRate.toFixed(1)}% está acima da média`);
    }
    if (metrics.trends.gainedTrend.current > metrics.trends.gainedTrend.previous) {
      positiveInsights.push(`Crescimento de ${((metrics.trends.gainedTrend.current - metrics.trends.gainedTrend.previous) / Math.max(1, metrics.trends.gainedTrend.previous) * 100).toFixed(0)}% em vendas`);
    }
    if (metrics.recurring.weeklyComplianceRate >= 80) {
      positiveInsights.push(`Compliance de recorrência em ${metrics.recurring.weeklyComplianceRate.toFixed(0)}%`);
    }

    if (metrics.insights.operationalBottleneck) {
      negativeInsights.push(`Gargalo operacional: ${COLUMN_LABELS[metrics.insights.operationalBottleneck.column] || metrics.insights.operationalBottleneck.column} com ${metrics.insights.operationalBottleneck.count} clientes`);
    }
    if (metrics.insights.salesBottleneck) {
      negativeInsights.push(`Gargalo comercial: ${STAGE_LABELS[metrics.insights.salesBottleneck.stage] || metrics.insights.salesBottleneck.stage} com ${metrics.insights.salesBottleneck.count} leads`);
    }
    if (metrics.leads.lost > metrics.leads.gained) {
      negativeInsights.push(`Mais leads perdidos (${metrics.leads.lost}) do que ganhos (${metrics.leads.gained})`);
    }

    if (metrics.clients.stalled.length > 5) {
      warningInsights.push(`${metrics.clients.stalled.length} clientes parados necessitam atenção`);
    }
    if (metrics.leads.hotWithoutActivity.length > 0) {
      warningInsights.push(`${metrics.leads.hotWithoutActivity.length} leads quentes sem atividade recente`);
    }
    if (metrics.recurring.overdueTasks > 0) {
      warningInsights.push(`${metrics.recurring.overdueTasks} tarefas de recorrência atrasadas`);
    }

    return {
      timelineData,
      heatmapData,
      columnFunnelData,
      stageFunnelData,
      lostReasonsPie,
      commissionsByRole,
      topRecipients,
      conversionRate,
      operationalHealth,
      salesHealth,
      alerts,
      totalCommissions,
      trendItems,
      positiveInsights,
      negativeInsights,
      warningInsights,
    };
  }, [metrics]);

  if (!authLoading && !canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
            <CardDescription>
              Somente administradores podem acessar o Relatório do Gestor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProFeatureGate
      feature="Relatório do Gestor"
      isBlocked={isManagerReportBlocked}
    >
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Relatório Executivo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Centro de Business Intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Period Selector */}
              <Select value={periodPreset} onValueChange={(v) => handlePeriodChange(v as PeriodPreset)}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Picker */}
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(startDate, "dd/MM", { locale: ptBR })} - {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="flex gap-2 p-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 text-center">Início</p>
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => d && setStartDate(d)}
                        locale={ptBR}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 text-center">Fim</p>
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(d) => d && setEndDate(d)}
                        locale={ptBR}
                      />
                    </div>
                  </div>
                  <div className="p-2 border-t">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => setDatePickerOpen(false)}
                    >
                      Aplicar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Refresh */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchReport}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando análises...</p>
          </div>
        ) : !metrics || !computedData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
              <TabsTrigger value="executive" className="gap-2 py-3">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Executivo</span>
                <span className="sm:hidden">Exec</span>
              </TabsTrigger>
              <TabsTrigger value="sales" className="gap-2 py-3">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Vendas</span>
                <span className="sm:hidden">Vendas</span>
              </TabsTrigger>
              <TabsTrigger value="proposals" className="gap-2 py-3">
                <FileSignature className="h-4 w-4" />
                <span className="hidden sm:inline">Propostas</span>
                <span className="sm:hidden">Prop</span>
              </TabsTrigger>
              <TabsTrigger value="ops" className="gap-2 py-3">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Operacional</span>
                <span className="sm:hidden">Ops</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2 py-3">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
                <span className="sm:hidden">Finan</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2 py-3">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
                <span className="sm:hidden">Insights</span>
              </TabsTrigger>
            </TabsList>

            {/* ===================== EXECUTIVE TAB ===================== */}
            <TabsContent value="executive" className="space-y-6 fade-in-up">
              {/* Health Scores Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HealthScoreGauge
                  title="Saúde Operacional"
                  description="Baseado em eficiência e atrasos"
                  score={computedData.operationalHealth}
                />
                <HealthScoreGauge
                  title="Saúde Comercial"
                  description="Baseado em conversões e pipeline"
                  score={computedData.salesHealth}
                />
                <HealthScoreGauge
                  title="Compliance Recorrência"
                  description="Taxa de execução das tarefas"
                  score={metrics.recurring.weeklyComplianceRate}
                />
              </div>

              {/* KPIs Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <ExecutiveKPICard
                  title="Clientes Ativos"
                  value={metrics.clients.total}
                  icon={Users}
                  color="primary"
                />
                <ExecutiveKPICard
                  title="Pipeline de Leads"
                  value={metrics.leads.total}
                  icon={Target}
                  color="info"
                />
                <ExecutiveKPICard
                  title="Ganhos no Período"
                  value={metrics.leads.gained}
                  previousValue={metrics.trends.gainedTrend.previous}
                  currentValue={metrics.trends.gainedTrend.current}
                  icon={TrendingUp}
                  color="success"
                />
                <ExecutiveKPICard
                  title="Perdidos no Período"
                  value={metrics.leads.lost}
                  previousValue={metrics.trends.lostTrend.previous}
                  currentValue={metrics.trends.lostTrend.current}
                  inverted
                  icon={AlertTriangle}
                  color="danger"
                />
                <ExecutiveKPICard
                  title="Taxa de Conversão"
                  value={`${computedData.conversionRate.toFixed(1)}%`}
                  icon={Zap}
                  color="warning"
                />
                <ExecutiveKPICard
                  title="MRR"
                  value={`R$ ${metrics.recurring.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={Repeat}
                  color="purple"
                />
              </div>

              {/* Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Evolução de Atividades
                  </CardTitle>
                  <CardDescription>
                    Volume de atividades ao longo do período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={computedData.timelineData}>
                        <defs>
                          <linearGradient id="colorAtividades" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="atividades" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorAtividades)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Trends and Heatmap */}
              <div className="grid md:grid-cols-2 gap-6">
                <TrendComparisonTable
                  title="Comparativo de Períodos"
                  description="Evolução dos principais indicadores"
                  items={computedData.trendItems}
                />
                <WeeklyHeatmap
                  title="Atividades por Dia"
                  description="Distribuição semanal das ações"
                  data={computedData.heatmapData}
                />
              </div>

              {/* Insights Summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <InsightCard
                  title="O que melhorou"
                  type="positive"
                  items={computedData.positiveInsights}
                />
                <InsightCard
                  title="Pontos de atenção"
                  type="warning"
                  items={computedData.warningInsights}
                />
                <InsightCard
                  title="O que piorou"
                  type="negative"
                  items={computedData.negativeInsights}
                />
              </div>
            </TabsContent>

            {/* ===================== SALES TAB ===================== */}
            <TabsContent value="sales" className="space-y-6 fade-in-up">
              <SectionHeader
                title="Performance de Vendas"
                subtitle="Análise completa do funil comercial e conversões"
                icon={Target}
                color="amber"
              />

              {/* Sales KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ExecutiveKPICard
                  title="Leads Criados"
                  value={metrics.leads.created}
                  previousValue={metrics.trends.leadsTrend.previous}
                  currentValue={metrics.trends.leadsTrend.current}
                  icon={Target}
                  color="info"
                  size="lg"
                />
                <ExecutiveKPICard
                  title="Leads Ganhos"
                  value={metrics.leads.gained}
                  previousValue={metrics.trends.gainedTrend.previous}
                  currentValue={metrics.trends.gainedTrend.current}
                  icon={TrendingUp}
                  color="success"
                  size="lg"
                />
                <ExecutiveKPICard
                  title="Leads Perdidos"
                  value={metrics.leads.lost}
                  previousValue={metrics.trends.lostTrend.previous}
                  currentValue={metrics.trends.lostTrend.current}
                  inverted
                  icon={AlertTriangle}
                  color="danger"
                  size="lg"
                />
                <ExecutiveKPICard
                  title="Taxa de Conversão"
                  value={`${computedData.conversionRate.toFixed(1)}%`}
                  icon={Zap}
                  color="warning"
                  size="lg"
                />
              </div>

              {/* Funnel and Conversion */}
              <div className="grid md:grid-cols-2 gap-6">
                <FunnelVisualization
                  title="Funil de Vendas"
                  steps={computedData.stageFunnelData}
                />
                
                {/* Pie Chart - Lost Reasons */}
                <Card>
                  <CardHeader>
                    <CardTitle>Motivos de Perda</CardTitle>
                    <CardDescription>Distribuição dos motivos de leads perdidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {computedData.lostReasonsPie.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={computedData.lostReasonsPie}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              dataKey="count"
                              nameKey="reason"
                            >
                              {computedData.lostReasonsPie.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Nenhuma perda registrada
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cross Analysis */}
              <CrossAnalysisChart
                title="Volume vs Conversão por Etapa"
                description="Análise cruzada mostrando onde há maior oportunidade de conversão"
                type="composed"
                data={computedData.stageFunnelData.map((s, i) => ({
                  name: s.name,
                  volume: s.value,
                  taxa: i === 0 ? 100 : Math.round((s.value / computedData.stageFunnelData[0].value) * 100)
                }))}
                xKey="name"
                barKey="volume"
                lineKey="taxa"
              />

              {/* Alerts */}
              <div className="grid md:grid-cols-2 gap-6">
                <AlertsList
                  title="Leads Quentes sem Atividade"
                  icon={AlertTriangle}
                  emptyMessage="Todos os leads quentes estão ativos"
                  items={metrics.leads.hotWithoutActivity.slice(0, 8).map(l => ({
                    id: l.id,
                    title: l.name,
                    subtitle: 'Lead quente parado',
                    value: `${l.daysSinceActivity}d`,
                    severity: l.daysSinceActivity > 7 ? 'critical' as const : 'warning' as const,
                  }))}
                />
                <AlertsList
                  title="Ações Vencidas"
                  icon={Clock}
                  emptyMessage="Nenhuma ação vencida"
                  items={metrics.leads.overdueActions.slice(0, 8).map(l => ({
                    id: l.id,
                    title: l.name,
                    subtitle: l.nextAction,
                    value: l.dueDate,
                    severity: 'warning' as const,
                  }))}
                />
              </div>
            </TabsContent>

            {/* ===================== PROPOSALS & CONTRACTS TAB ===================== */}
            <TabsContent value="proposals" className="space-y-6 fade-in-up">
              <SectionHeader
                title="Propostas & Contratos"
                subtitle="Acompanhamento de propostas enviadas e contratos assinados"
                icon={FileSignature}
                color="blue"
              />

              {biLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : biData ? (
                <>
                  {/* Proposals KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ExecutiveKPICard
                      title="Total Propostas"
                      value={biData.kpis.proposals.total}
                      icon={FileText}
                      color="info"
                    />
                    <ExecutiveKPICard
                      title="Aceitas"
                      value={biData.kpis.proposals.accepted}
                      icon={TrendingUp}
                      color="success"
                    />
                    <ExecutiveKPICard
                      title="Recusadas"
                      value={biData.kpis.proposals.rejected}
                      icon={AlertTriangle}
                      color="danger"
                    />
                    <ExecutiveKPICard
                      title="Taxa Conversão"
                      value={`${biData.kpis.proposals.conversionRate}%`}
                      icon={Zap}
                      color="warning"
                    />
                  </div>

                  {/* Proposals Chart */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <ProposalsStatusChart
                      draft={biData.kpis.proposals.draft}
                      sent={biData.kpis.proposals.sent}
                      viewed={biData.kpis.proposals.viewed}
                      accepted={biData.kpis.proposals.accepted}
                      rejected={biData.kpis.proposals.rejected}
                      expired={biData.kpis.proposals.expired}
                    />
                    <Card>
                      <CardHeader>
                        <CardTitle>Valores de Propostas</CardTitle>
                        <CardDescription>Resumo financeiro das propostas</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Valor Total</span>
                          <span className="font-bold text-lg">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(biData.kpis.proposals.totalValue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <span className="text-sm text-emerald-600">Valor Aceito</span>
                          <span className="font-bold text-lg text-emerald-600">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(biData.kpis.proposals.acceptedValue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Tempo Médio Resposta</span>
                          <span className="font-bold">
                            {biData.kpis.proposals.avgResponseTime < 24 
                              ? `${biData.kpis.proposals.avgResponseTime}h` 
                              : `${Math.round(biData.kpis.proposals.avgResponseTime / 24)}d`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator className="my-6" />

                  {/* Contracts KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ExecutiveKPICard
                      title="Total Contratos"
                      value={biData.kpis.contracts.total}
                      icon={FileSignature}
                      color="info"
                    />
                    <ExecutiveKPICard
                      title="Ativos"
                      value={biData.kpis.contracts.active}
                      icon={TrendingUp}
                      color="success"
                    />
                    <ExecutiveKPICard
                      title="Vencendo (30d)"
                      value={biData.kpis.contracts.expiringSoon}
                      icon={Clock}
                      color={biData.kpis.contracts.expiringSoon > 0 ? "warning" : "info"}
                    />
                    <ExecutiveKPICard
                      title="MRR Contratos"
                      value={`R$ ${biData.kpis.contracts.monthlyRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                      icon={Repeat}
                      color="purple"
                    />
                  </div>

                  {/* Contracts Chart */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <ContractsTypeChart
                      recurring={biData.kpis.contracts.recurring}
                      oneTime={biData.kpis.contracts.oneTime}
                    />
                    <Card>
                      <CardHeader>
                        <CardTitle>Status dos Contratos</CardTitle>
                        <CardDescription>Distribuição por situação</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Rascunhos</span>
                          <span className="font-medium">{biData.kpis.contracts.draft}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Aguardando Assinatura</span>
                          <span className="font-medium">{biData.kpis.contracts.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Assinados</span>
                          <span className="font-medium">{biData.kpis.contracts.signed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-emerald-500">Ativos</span>
                          <span className="font-medium text-emerald-500">{biData.kpis.contracts.active}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-red-500">Cancelados</span>
                          <span className="font-medium text-red-500">{biData.kpis.contracts.cancelled}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly Trend */}
                  {biData.monthlyTrend && biData.monthlyTrend.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <MonthlyTrendChart data={biData.monthlyTrend} type="area" />
                      <RevenueChart data={biData.monthlyTrend} />
                    </div>
                  )}

                  {/* BI Alerts */}
                  {biData.alerts && biData.alerts.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Alertas Inteligentes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AlertsPanel alerts={biData.alerts} />
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Dados de propostas e contratos não disponíveis</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => refetchBI()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ===================== OPERATIONAL TAB ===================== */}
            <TabsContent value="ops" className="space-y-6 fade-in-up">
              <SectionHeader
                title="Performance Operacional"
                subtitle="Status de clientes, progressão e eficiência da operação"
                icon={Users}
                color="blue"
              />

              {/* Ops KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ExecutiveKPICard
                  title="Total de Clientes"
                  value={metrics.clients.total}
                  icon={Users}
                  color="primary"
                />
                <ExecutiveKPICard
                  title="Em Onboarding"
                  value={metrics.clients.byColumn['onboarding'] || 0}
                  icon={Layers}
                  color="info"
                />
                <ExecutiveKPICard
                  title="Em Otimização"
                  value={metrics.clients.byColumn['optimization'] || 0}
                  icon={Zap}
                  color="warning"
                />
                <ExecutiveKPICard
                  title="Prontos p/ Entregar"
                  value={metrics.clients.byColumn['ready_to_deliver'] || 0}
                  icon={TrendingUp}
                  color="success"
                />
                <ExecutiveKPICard
                  title="Clientes Parados"
                  value={metrics.clients.stalled.length}
                  icon={AlertTriangle}
                  color={metrics.clients.stalled.length > 5 ? "danger" : "warning"}
                />
              </div>

              {/* Funnel and Progress */}
              <div className="grid md:grid-cols-2 gap-6">
                <FunnelVisualization
                  title="Distribuição por Coluna"
                  steps={computedData.columnFunnelData}
                />

                {/* Checklist Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso do Checklist</CardTitle>
                    <CardDescription>Média de conclusão por seção</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-4 pr-4">
                        {metrics.clients.checklistProgress.map((section, i) => {
                          const pct = section.total > 0 ? (section.completed / section.total) * 100 : 0;
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium truncate max-w-[200px]">{section.section}</span>
                                <span className="text-muted-foreground">{section.completed}/{section.total}</span>
                              </div>
                              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    pct >= 80 ? "bg-emerald-500" :
                                    pct >= 50 ? "bg-amber-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Stalled Clients */}
              <AlertsList
                title="Clientes Parados"
                icon={Clock}
                emptyMessage="Nenhum cliente parado - operação saudável!"
                maxHeight="h-96"
                items={metrics.clients.stalled.slice(0, 15).map(c => ({
                  id: c.id,
                  title: c.name,
                  subtitle: 'Sem atualização há',
                  value: `${c.daysSinceUpdate}d`,
                  severity: c.daysSinceUpdate > 14 ? 'critical' as const : c.daysSinceUpdate > 7 ? 'warning' as const : 'info' as const,
                }))}
              />

              {/* Recurrence Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <ExecutiveKPICard
                  title="Clientes Recorrentes"
                  value={metrics.recurring.totalClients}
                  icon={Repeat}
                  color="purple"
                />
                <ExecutiveKPICard
                  title="Tarefas Concluídas"
                  value={metrics.recurring.completedTasks}
                  subtitle={`de ${metrics.recurring.totalTasks} tarefas`}
                  icon={TrendingUp}
                  color="success"
                />
                <ExecutiveKPICard
                  title="Tarefas Atrasadas"
                  value={metrics.recurring.overdueTasks}
                  icon={AlertTriangle}
                  color={metrics.recurring.overdueTasks > 10 ? "danger" : "warning"}
                />
                <ExecutiveKPICard
                  title="Taxa de Compliance"
                  value={`${metrics.recurring.weeklyComplianceRate.toFixed(0)}%`}
                  icon={Zap}
                  color={metrics.recurring.weeklyComplianceRate >= 80 ? "success" : metrics.recurring.weeklyComplianceRate >= 60 ? "warning" : "danger"}
                />
              </div>
            </TabsContent>

            {/* ===================== FINANCIAL TAB ===================== */}
            <TabsContent value="financial" className="space-y-6 fade-in-up">
              <SectionHeader
                title="Visão Financeira"
                subtitle="Receitas, comissões e projeções financeiras"
                icon={DollarSign}
                color="purple"
              />

              {/* Financial KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ExecutiveKPICard
                  title="MRR"
                  value={`R$ ${metrics.recurring.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={Repeat}
                  color="primary"
                  size="lg"
                />
                <ExecutiveKPICard
                  title="ARR (Projeção)"
                  value={`R$ ${metrics.recurring.annualValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={TrendingUp}
                  color="success"
                  size="lg"
                />
                <ExecutiveKPICard
                  title="Ticket Médio"
                  value={`R$ ${metrics.recurring.avgContractValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  color="info"
                  size="lg"
                />
                <ExecutiveKPICard
                  title="Total Comissões"
                  value={`R$ ${computedData.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  color="warning"
                  size="lg"
                />
              </div>

              {/* Commission Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-2xl font-bold text-amber-500">
                      R$ {metrics.commissions.pending.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.commissions.pending.count} comissões</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Aprovado</p>
                    <p className="text-2xl font-bold text-blue-500">
                      R$ {metrics.commissions.approved.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.commissions.approved.count} comissões</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pago</p>
                    <p className="text-2xl font-bold text-emerald-500">
                      R$ {metrics.commissions.paid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.commissions.paid.count} comissões</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Cancelado</p>
                    <p className="text-2xl font-bold text-muted-foreground">
                      R$ {metrics.commissions.cancelled.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.commissions.cancelled.count} comissões</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* By Role */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comissões por Função</CardTitle>
                    <CardDescription>Distribuição de valores por tipo de colaborador</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={computedData.commissionsByRole}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px'
                            }} 
                          />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <RankingTable
                  title="Top 5 Recebedores"
                  items={computedData.topRecipients}
                  valuePrefix="R$ "
                />
              </div>

              {/* Top Clients by Commission */}
              <RankingTable
                title="Clientes com Maior Volume de Comissões"
                items={metrics.commissions.topClients.slice(0, 8).map(c => ({
                  name: c.name,
                  value: c.amount,
                }))}
                valuePrefix="R$ "
                maxItems={8}
              />
            </TabsContent>

            {/* ===================== INSIGHTS TAB ===================== */}
            <TabsContent value="insights" className="space-y-6 fade-in-up">
              <SectionHeader
                title="Insights & Recomendações"
                subtitle="Análises inteligentes e ações sugeridas baseadas nos dados"
                icon={Lightbulb}
                color="emerald"
              />

              {/* Insights Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <InsightCard
                  title="O que está funcionando"
                  type="positive"
                  items={computedData.positiveInsights.length > 0 ? computedData.positiveInsights : ['Operação estável no período analisado']}
                />
                <InsightCard
                  title="Pontos de atenção"
                  type="warning"
                  items={computedData.warningInsights.length > 0 ? computedData.warningInsights : ['Nenhum alerta crítico identificado']}
                />
                <InsightCard
                  title="Riscos identificados"
                  type="negative"
                  items={computedData.negativeInsights.length > 0 ? computedData.negativeInsights : ['Sem riscos críticos no momento']}
                />
              </div>

              {/* Bottlenecks */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className={cn(
                  "border-2",
                  metrics.insights.operationalBottleneck ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"
                )}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-5 w-5", metrics.insights.operationalBottleneck ? "text-amber-500" : "text-emerald-500")} />
                      Gargalo Operacional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.insights.operationalBottleneck ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-background rounded-lg">
                          <p className="text-sm text-muted-foreground">Etapa com acúmulo</p>
                          <p className="text-xl font-bold text-amber-500">
                            {COLUMN_LABELS[metrics.insights.operationalBottleneck.column] || metrics.insights.operationalBottleneck.column}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metrics.insights.operationalBottleneck.count} clientes acumulados
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Recomendação: Priorize a movimentação destes clientes para evitar gargalos maiores.
                        </p>
                      </div>
                    ) : (
                      <p className="text-center py-6 text-emerald-500 font-medium">
                        ✓ Fluxo operacional saudável
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className={cn(
                  "border-2",
                  metrics.insights.salesBottleneck ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"
                )}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className={cn("h-5 w-5", metrics.insights.salesBottleneck ? "text-amber-500" : "text-emerald-500")} />
                      Gargalo Comercial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.insights.salesBottleneck ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-background rounded-lg">
                          <p className="text-sm text-muted-foreground">Etapa com acúmulo</p>
                          <p className="text-xl font-bold text-amber-500">
                            {STAGE_LABELS[metrics.insights.salesBottleneck.stage] || metrics.insights.salesBottleneck.stage}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metrics.insights.salesBottleneck.count} leads acumulados
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Recomendação: Foque em avançar estes leads no funil ou qualificá-los melhor.
                        </p>
                      </div>
                    ) : (
                      <p className="text-center py-6 text-emerald-500 font-medium">
                        ✓ Pipeline comercial balanceado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Focus Actions */}
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Ações Recomendadas para Esta Semana
                  </CardTitle>
                  <CardDescription>
                    Baseadas nos dados analisados, estas são as prioridades sugeridas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.insights.focusActions.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {metrics.insights.focusActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {i + 1}
                          </span>
                          <span className="text-sm pt-1">{action}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p>Operação saudável! Nenhuma ação urgente identificada.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risks List */}
              <AlertsList
                title="Entidades em Risco"
                icon={AlertTriangle}
                emptyMessage="Nenhum risco identificado - excelente!"
                maxHeight="h-80"
                items={metrics.insights.risks.slice(0, 15).map((risk, i) => ({
                  id: `risk-${i}`,
                  title: risk.entity,
                  subtitle: risk.type === 'lead' ? 'Lead' : 'Cliente',
                  value: `${risk.days}d`,
                  severity: risk.days > 14 ? 'critical' as const : risk.days > 7 ? 'warning' as const : 'info' as const,
                }))}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
    </ProFeatureGate>
  );
};

export default ManagerReport;
