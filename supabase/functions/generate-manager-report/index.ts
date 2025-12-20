import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  startDate: string;
  endDate: string;
  format?: 'json' | 'pdf';
}

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

function calculateDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function getPreviousPeriod(start: string, end: string): { start: string; end: string } {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = calculateDaysBetween(start, end);
  
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  
  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0]
  };
}

function getMonthAgoPeriod(start: string, end: string): { start: string; end: string } {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const monthAgoStart = new Date(startDate);
  monthAgoStart.setMonth(monthAgoStart.getMonth() - 1);
  
  const monthAgoEnd = new Date(endDate);
  monthAgoEnd.setMonth(monthAgoEnd.getMonth() - 1);
  
  return {
    start: monthAgoStart.toISOString().split('T')[0],
    end: monthAgoEnd.toISOString().split('T')[0]
  };
}

function generatePDFContent(metrics: Metrics, startDate: string, endDate: string): string {
  // Generate a simple PDF-like structured content that can be rendered by jsPDF
  // This returns a JSON structure that the client will use to build the PDF
  return JSON.stringify({
    title: 'Relatório do Gestor',
    period: `${startDate} a ${endDate}`,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: 'Resumo Executivo',
        type: 'kpi',
        data: {
          totalClients: metrics.clients.total,
          totalLeads: metrics.leads.total,
          leadsGained: metrics.leads.gained,
          leadsLost: metrics.leads.lost,
          conversionRate: metrics.leads.total > 0 
            ? ((metrics.leads.gained / metrics.leads.total) * 100).toFixed(1) 
            : 0,
          pendingCommissions: metrics.commissions.pending.amount,
          trends: metrics.trends
        }
      },
      {
        title: 'Operacional',
        type: 'operational',
        data: {
          byColumn: metrics.clients.byColumn,
          stalled: metrics.clients.stalled.slice(0, 10),
          checklistProgress: metrics.clients.checklistProgress
        }
      },
      {
        title: 'Vendas',
        type: 'sales',
        data: {
          byStage: metrics.leads.byStage,
          created: metrics.leads.created,
          gained: metrics.leads.gained,
          lost: metrics.leads.lost,
          lostReasons: metrics.leads.lostReasons,
          overdueActions: metrics.leads.overdueActions.slice(0, 10),
          hotWithoutActivity: metrics.leads.hotWithoutActivity.slice(0, 10)
        }
      },
      {
        title: 'Financeiro',
        type: 'financial',
        data: {
          summary: {
            pending: metrics.commissions.pending,
            approved: metrics.commissions.approved,
            paid: metrics.commissions.paid,
            cancelled: metrics.commissions.cancelled
          },
          byRole: metrics.commissions.byRole,
          topRecipients: metrics.commissions.topRecipients.slice(0, 5),
          topClients: metrics.commissions.topClients.slice(0, 5)
        }
      },
      {
        title: 'Insights e Recomendações',
        type: 'insights',
        data: metrics.insights
      }
    ],
    timeline: metrics.timeline,
    activities: metrics.activities.slice(0, 100),
    heatmap: metrics.heatmap
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl, 
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdminResult } = await supabaseClient.rpc('is_admin', { _user_id: user.id });
    
    if (!isAdminResult) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { startDate, endDate, format = 'json' }: ReportRequest = await req.json();
    
    console.log(`Generating report for period: ${startDate} to ${endDate}`);
    
    const prevPeriod = getPreviousPeriod(startDate, endDate);
    const monthAgoPeriod = getMonthAgoPeriod(startDate, endDate);
    
    // Fetch all data in parallel
    const [
      clientsResult,
      leadsResult,
      leadsPrevResult,
      leadsMonthAgoResult,
      commissionsResult,
      auditLogResult,
      auditLogPrevResult,
      auditLogMonthAgoResult,
      lostReasonsResult,
      commissionRolesResult,
      leadActivitiesResult
    ] = await Promise.all([
      // Current clients
      supabaseClient.from('clients').select('*').is('deleted_at', null),
      // Current leads
      supabaseClient.from('leads').select('*'),
      // Previous period leads
      supabaseClient.from('leads').select('*')
        .gte('created_at', prevPeriod.start)
        .lte('created_at', prevPeriod.end + 'T23:59:59'),
      // Month ago leads
      supabaseClient.from('leads').select('*')
        .gte('created_at', monthAgoPeriod.start)
        .lte('created_at', monthAgoPeriod.end + 'T23:59:59'),
      // Commissions in period
      supabaseClient.from('commissions_v2').select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59'),
      // Audit log current period
      supabaseClient.from('audit_log').select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false }),
      // Audit log previous period
      supabaseClient.from('audit_log').select('*')
        .gte('created_at', prevPeriod.start)
        .lte('created_at', prevPeriod.end + 'T23:59:59'),
      // Audit log month ago
      supabaseClient.from('audit_log').select('*')
        .gte('created_at', monthAgoPeriod.start)
        .lte('created_at', monthAgoPeriod.end + 'T23:59:59'),
      // Lost reasons lookup
      supabaseClient.from('lost_reasons').select('*'),
      // Commission roles lookup
      supabaseClient.from('commission_roles').select('*'),
      // Lead activities in period
      supabaseClient.from('lead_activities').select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
    ]);

    const clients = clientsResult.data || [];
    const leads = leadsResult.data || [];
    const leadsPrev = leadsPrevResult.data || [];
    const leadsMonthAgo = leadsMonthAgoResult.data || [];
    const commissions = commissionsResult.data || [];
    const auditLog = auditLogResult.data || [];
    const auditLogPrev = auditLogPrevResult.data || [];
    const auditLogMonthAgo = auditLogMonthAgoResult.data || [];
    const lostReasons = lostReasonsResult.data || [];
    const commissionRoles = commissionRolesResult.data || [];
    const leadActivities = leadActivitiesResult.data || [];

    // Build lost reasons map
    const lostReasonsMap = new Map(lostReasons.map(r => [r.id, r.label]));
    const rolesMap = new Map(commissionRoles.map(r => [r.id, r.label]));

    // Calculate clients by column
    const clientsByColumn: Record<string, number> = {};
    clients.forEach(c => {
      clientsByColumn[c.column_id] = (clientsByColumn[c.column_id] || 0) + 1;
    });

    // Calculate stalled clients
    const now = new Date();
    const stalledClients = clients
      .map(c => ({
        id: c.id,
        name: c.company_name,
        daysSinceUpdate: calculateDaysBetween(c.updated_at, now.toISOString())
      }))
      .filter(c => c.daysSinceUpdate > 7)
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

    // Calculate checklist progress (aggregate)
    const checklistProgress: { section: string; completed: number; total: number }[] = [];
    const sectionStats: Record<string, { completed: number; total: number }> = {};
    
    clients.forEach(client => {
      if (Array.isArray(client.checklist)) {
        client.checklist.forEach((section: { title: string; items: { done: boolean }[] }) => {
          if (!sectionStats[section.title]) {
            sectionStats[section.title] = { completed: 0, total: 0 };
          }
          section.items?.forEach(item => {
            sectionStats[section.title].total++;
            if (item.done) sectionStats[section.title].completed++;
          });
        });
      }
    });
    
    Object.entries(sectionStats).forEach(([section, stats]) => {
      checklistProgress.push({ section, ...stats });
    });

    // Calculate leads by stage
    const leadsByStage: Record<string, number> = {};
    leads.forEach(l => {
      leadsByStage[l.pipeline_stage] = (leadsByStage[l.pipeline_stage] || 0) + 1;
    });

    // Leads created in period
    const leadsCreatedInPeriod = leads.filter(l => 
      l.created_at >= startDate && l.created_at <= endDate + 'T23:59:59'
    ).length;

    // Gained and lost in period
    const gainedInPeriod = leads.filter(l => 
      l.status === 'gained' && 
      l.converted_at && 
      l.converted_at >= startDate && 
      l.converted_at <= endDate + 'T23:59:59'
    ).length;

    const lostInPeriod = leads.filter(l => 
      l.status === 'lost' && 
      l.updated_at >= startDate && 
      l.updated_at <= endDate + 'T23:59:59'
    ).length;

    // Previous period stats
    const gainedPrev = leadsPrev.filter(l => l.status === 'gained').length;
    const lostPrev = leadsPrev.filter(l => l.status === 'lost').length;
    
    // Month ago stats
    const gainedMonthAgo = leadsMonthAgo.filter(l => l.status === 'gained').length;
    const lostMonthAgo = leadsMonthAgo.filter(l => l.status === 'lost').length;

    // Lost reasons breakdown
    const lostReasonCounts: Record<string, number> = {};
    leads.filter(l => l.status === 'lost' && l.lost_reason_id).forEach(l => {
      const reason = lostReasonsMap.get(l.lost_reason_id) || 'Não especificado';
      lostReasonCounts[reason] = (lostReasonCounts[reason] || 0) + 1;
    });

    // Overdue next actions
    const today = now.toISOString().split('T')[0];
    const overdueActions = leads
      .filter(l => l.status === 'open' && l.next_action_date && l.next_action_date < today)
      .map(l => ({
        id: l.id,
        name: l.company_name,
        nextAction: l.next_action || 'Ação pendente',
        dueDate: l.next_action_date
      }))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Hot leads without recent activity
    const hotWithoutActivity = leads
      .filter(l => l.temperature === 'hot' && l.status === 'open')
      .map(l => ({
        id: l.id,
        name: l.company_name,
        daysSinceActivity: calculateDaysBetween(l.last_activity_at, now.toISOString())
      }))
      .filter(l => l.daysSinceActivity > 3)
      .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);

    // Commissions breakdown
    const commissionsByStatus = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 }
    };
    
    commissions.forEach(c => {
      if (commissionsByStatus[c.status as keyof typeof commissionsByStatus]) {
        commissionsByStatus[c.status as keyof typeof commissionsByStatus].count++;
        commissionsByStatus[c.status as keyof typeof commissionsByStatus].amount += Number(c.amount) || 0;
      }
    });

    // Commissions by role
    const commissionsByRole: Record<string, number> = {};
    commissions.forEach(c => {
      const role = rolesMap.get(c.recipient_role_id) || c.recipient_type || 'Outros';
      commissionsByRole[role] = (commissionsByRole[role] || 0) + Number(c.amount);
    });

    // Top recipients
    const recipientAmounts: Record<string, number> = {};
    commissions.forEach(c => {
      recipientAmounts[c.recipient_name] = (recipientAmounts[c.recipient_name] || 0) + Number(c.amount);
    });
    const topRecipients = Object.entries(recipientAmounts)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Top clients by commission
    const clientCommissions: Record<string, number> = {};
    commissions.forEach(c => {
      if (c.client_name) {
        clientCommissions[c.client_name] = (clientCommissions[c.client_name] || 0) + Number(c.amount);
      }
    });
    const topClients = Object.entries(clientCommissions)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Timeline - activities per day
    const timelineMap: Record<string, { count: number; byType: Record<string, number> }> = {};
    
    // Combine audit log and lead activities
    const allActivities = [
      ...auditLog.map(a => ({
        date: a.created_at.split('T')[0],
        type: a.action_type
      })),
      ...leadActivities.map(a => ({
        date: a.created_at.split('T')[0],
        type: a.type
      }))
    ];
    
    allActivities.forEach(a => {
      if (!timelineMap[a.date]) {
        timelineMap[a.date] = { count: 0, byType: {} };
      }
      timelineMap[a.date].count++;
      timelineMap[a.date].byType[a.type] = (timelineMap[a.date].byType[a.type] || 0) + 1;
    });

    const timeline = Object.entries(timelineMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Heatmap - activities by day of week
    const heatmapData: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    allActivities.forEach(a => {
      const dayOfWeek = new Date(a.date).getDay();
      heatmapData[dayOfWeek]++;
    });
    const heatmap = Object.entries(heatmapData).map(([day, count]) => ({
      dayOfWeek: parseInt(day),
      count
    }));

    // Insights
    const operationalBottleneck = Object.entries(clientsByColumn)
      .filter(([col]) => !['delivered', 'finalized', 'suspended'].includes(col))
      .sort((a, b) => b[1] - a[1])[0];

    const salesBottleneck = Object.entries(leadsByStage)
      .filter(([stage]) => !['gained', 'lost', 'future'].includes(stage))
      .sort((a, b) => b[1] - a[1])[0];

    const topLossReasons = Object.entries(lostReasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Focus actions based on data
    const focusActions: string[] = [];
    
    if (overdueActions.length > 0) {
      focusActions.push(`Resolver ${overdueActions.length} ações vencidas de leads`);
    }
    if (hotWithoutActivity.length > 0) {
      focusActions.push(`Ativar ${hotWithoutActivity.length} leads quentes sem atividade recente`);
    }
    if (stalledClients.length > 5) {
      focusActions.push(`Atualizar ${stalledClients.length} clientes parados há mais de 7 dias`);
    }
    if (commissionsByStatus.pending.count > 10) {
      focusActions.push(`Revisar ${commissionsByStatus.pending.count} comissões pendentes`);
    }
    if (operationalBottleneck && operationalBottleneck[1] > 5) {
      focusActions.push(`Desafogar etapa "${operationalBottleneck[0]}" com ${operationalBottleneck[1]} clientes`);
    }

    // Risks
    const risks = [
      ...stalledClients.slice(0, 5).map(c => ({
        type: 'client',
        entity: c.name,
        days: c.daysSinceUpdate
      })),
      ...hotWithoutActivity.slice(0, 5).map(l => ({
        type: 'lead',
        entity: l.name,
        days: l.daysSinceActivity
      }))
    ].sort((a, b) => b.days - a.days).slice(0, 10);

    // Fetch recurring data
    const { data: recurringClients } = await supabaseClient
      .from('recurring_clients')
      .select('*, monthly_value')
      .eq('status', 'active');

    const { data: recurringTasks } = await supabaseClient
      .from('recurring_tasks')
      .select('*')
      .gte('due_date', startDate)
      .lte('due_date', endDate);

    const { data: recurringRoutines } = await supabaseClient
      .from('recurring_routines')
      .select('*')
      .eq('active', true);

    // Calculate recurring metrics
    const totalRecurringTasks = recurringTasks?.length || 0;
    const completedRecurringTasks = recurringTasks?.filter((t: any) => t.status === 'done').length || 0;
    const overdueRecurringTasks = recurringTasks?.filter((t: any) => {
      return t.status === 'todo' && new Date(t.due_date) < new Date();
    }).length || 0;
    const weeklyComplianceRate = totalRecurringTasks > 0 
      ? Math.round((completedRecurringTasks / totalRecurringTasks) * 100) 
      : 0;

    // Calculate MRR and annual value
    const mrr = (recurringClients || []).reduce((sum: number, client: any) => {
      return sum + (Number(client.monthly_value) || 500);
    }, 0);
    const annualValue = mrr * 12;
    const clientCount = recurringClients?.length ?? 0;
    const avgContractValue = clientCount > 0 ? mrr / clientCount : 0;

    // Recurring by routine
    const recurringByRoutine = (recurringRoutines || []).map((routine: any) => {
      const routineTasks = (recurringTasks || []).filter((t: any) => t.routine_id === routine.id);
      const completed = routineTasks.filter((t: any) => t.status === 'done').length;
      return {
        routine: routine.title,
        completed,
        total: routineTasks.length
      };
    });

    // At risk recurring clients  
    const atRiskRecurringClients = (recurringClients || []).map((client: any) => {
      const clientTasks = (recurringTasks || []).filter((t: any) => t.recurring_client_id === client.id);
      const completed = clientTasks.filter((t: any) => t.status === 'done').length;
      const complianceRate = clientTasks.length > 0 ? Math.round((completed / clientTasks.length) * 100) : 0;
      const completedTasksArr = clientTasks.filter((t: any) => t.completed_at);
      const lastAction = completedTasksArr.length > 0
        ? completedTasksArr.sort((a: any, b: any) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0].completed_at
        : null;
      const daysSinceAction = lastAction 
        ? calculateDaysBetween(lastAction, new Date().toISOString())
        : 999;
      
      return {
        name: client.company_name,
        complianceRate,
        daysSinceAction
      };
    }).filter((c: any) => c.complianceRate < 50 || c.daysSinceAction > 7);

    const metrics: Metrics = {
      clients: {
        total: clients.length,
        byColumn: clientsByColumn,
        movements: [], // Would need history tracking
        stalled: stalledClients,
        checklistProgress
      },
      leads: {
        total: leads.filter(l => l.status === 'open').length,
        byStage: leadsByStage,
        created: leadsCreatedInPeriod,
        gained: gainedInPeriod,
        lost: lostInPeriod,
        lostReasons: Object.entries(lostReasonCounts).map(([reason, count]) => ({ reason, count })),
        overdueActions,
        hotWithoutActivity
      },
      commissions: {
        ...commissionsByStatus,
        byRole: Object.entries(commissionsByRole).map(([role, amount]) => ({ role, amount })),
        topRecipients,
        topClients
      },
      recurring: {
        totalClients: recurringClients?.length || 0,
        totalTasks: totalRecurringTasks,
        completedTasks: completedRecurringTasks,
        overdueTasks: overdueRecurringTasks,
        weeklyComplianceRate,
        byRoutine: recurringByRoutine,
        atRiskClients: atRiskRecurringClients,
        mrr,
        annualValue,
        avgContractValue
      },
      timeline,
      activities: auditLog.slice(0, 100).map(a => ({
        id: a.id,
        createdAt: a.created_at,
        userName: a.user_name,
        actionType: a.action_type,
        entityType: a.entity_type,
        entityName: a.entity_name || '',
        metadata: a.metadata || {}
      })),
      trends: {
        leadsTrend: {
          current: leadsCreatedInPeriod,
          previous: leadsPrev.length,
          monthAgo: leadsMonthAgo.length
        },
        gainedTrend: {
          current: gainedInPeriod,
          previous: gainedPrev,
          monthAgo: gainedMonthAgo
        },
        lostTrend: {
          current: lostInPeriod,
          previous: lostPrev,
          monthAgo: lostMonthAgo
        },
        deliveredTrend: {
          current: clients.filter(c => c.column_id === 'delivered').length,
          previous: 0, // Would need historical data
          monthAgo: 0
        },
        activitiesTrend: {
          current: auditLog.length + leadActivities.length,
          previous: auditLogPrev.length,
          monthAgo: auditLogMonthAgo.length
        }
      },
      insights: {
        operationalBottleneck: operationalBottleneck 
          ? { column: operationalBottleneck[0], count: operationalBottleneck[1] }
          : null,
        salesBottleneck: salesBottleneck
          ? { stage: salesBottleneck[0], count: salesBottleneck[1] }
          : null,
        topLossReasons,
        focusActions: focusActions.slice(0, 5),
        risks
      },
      heatmap
    };

    if (format === 'pdf') {
      const pdfContent = generatePDFContent(metrics, startDate, endDate);
      return new Response(pdfContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify(metrics), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: unknown) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});