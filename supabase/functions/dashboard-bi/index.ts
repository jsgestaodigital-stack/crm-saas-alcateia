import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  responsible?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user info
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for full access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user is admin or super_admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: permData } = await supabaseAdmin
      .from("user_permissions")
      .select("is_super_admin, can_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin" || permData?.is_super_admin || permData?.can_admin;
    
    if (!isAdmin) {
      console.log("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's agency - try profile first, then agency_members
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("current_agency_id")
      .eq("id", user.id)
      .maybeSingle();

    let agencyId = profile?.current_agency_id;
    
    // Fallback to agency_members if no current_agency_id in profile
    if (!agencyId) {
      const { data: membership } = await supabaseAdmin
        .from("agency_members")
        .select("agency_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      
      agencyId = membership?.agency_id;
    }

    if (!agencyId) {
      console.error("No agency found for user:", user.id);
      return new Response(
        JSON.stringify({ error: "No agency found for this user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse filters
    const url = new URL(req.url);
    const filters: DashboardFilters = {
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      responsible: url.searchParams.get("responsible") || undefined,
    };

    console.log("Fetching BI data for agency:", agencyId, "filters:", filters);

    // Build date filter
    const now = new Date();
    const startDate = filters.startDate || new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    const endDate = filters.endDate || now.toISOString();

    // Fetch all data in parallel
    const [
      leadsResult,
      proposalsResult,
      contractsResult,
      clientsResult,
      recurringResult,
      teamResult
    ] = await Promise.all([
      // Leads
      supabaseAdmin
        .from("leads")
        .select("id, pipeline_stage, temperature, status, estimated_value, created_at, converted_at, responsible, lost_reason_id")
        .eq("agency_id", agencyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate),
      
      // Proposals
      supabaseAdmin
        .from("proposals")
        .select("id, status, full_price, discounted_price, sent_at, first_viewed_at, accepted_at, rejected_at, created_at")
        .eq("agency_id", agencyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate),
      
      // Contracts
      supabaseAdmin
        .from("contracts")
        .select("id, status, contract_type, full_price, discounted_price, is_recurring, start_date, end_date, signed_at, created_at")
        .eq("agency_id", agencyId),
      
      // Clients (projects)
      supabaseAdmin
        .from("clients")
        .select("id, column_id, status, plan_type, start_date, created_at, updated_at, responsible")
        .eq("agency_id", agencyId)
        .is("deleted_at", null),
      
      // Recurring clients
      supabaseAdmin
        .from("recurring_clients")
        .select("id, status, monthly_value, next_execution_date, created_at")
        .eq("agency_id", agencyId),
      
      // Team members
      supabaseAdmin
        .from("agency_members")
        .select("id, user_id, role")
        .eq("agency_id", agencyId)
    ]);

    const leads = leadsResult.data || [];
    const proposals = proposalsResult.data || [];
    const contracts = contractsResult.data || [];
    const clients = clientsResult.data || [];
    const recurring = recurringResult.data || [];
    const team = teamResult.data || [];

    // Calculate Leads KPIs
    const leadsKpis = {
      total: leads.length,
      byStage: {
        novo: leads.filter(l => l.pipeline_stage === "novo").length,
        contato_inicial: leads.filter(l => l.pipeline_stage === "contato_inicial").length,
        qualificacao: leads.filter(l => l.pipeline_stage === "qualificacao").length,
        apresentacao: leads.filter(l => l.pipeline_stage === "apresentacao").length,
        proposta: leads.filter(l => l.pipeline_stage === "proposta").length,
        negociacao: leads.filter(l => l.pipeline_stage === "negociacao").length,
        fechamento: leads.filter(l => l.pipeline_stage === "fechamento").length,
        ganho: leads.filter(l => l.pipeline_stage === "ganho").length,
        perdido: leads.filter(l => l.pipeline_stage === "perdido").length,
      },
      byTemperature: {
        frio: leads.filter(l => l.temperature === "frio").length,
        morno: leads.filter(l => l.temperature === "morno").length,
        quente: leads.filter(l => l.temperature === "quente").length,
      },
      converted: leads.filter(l => l.status === "gained" || l.pipeline_stage === "ganho").length,
      lost: leads.filter(l => l.status === "lost" || l.pipeline_stage === "perdido").length,
      totalValue: leads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0),
      conversionRate: leads.length > 0 
        ? (leads.filter(l => l.status === "gained" || l.pipeline_stage === "ganho").length / leads.length * 100).toFixed(1)
        : 0,
    };

    // Calculate Proposals KPIs
    const proposalsKpis = {
      total: proposals.length,
      draft: proposals.filter(p => p.status === "draft").length,
      sent: proposals.filter(p => p.status === "sent").length,
      viewed: proposals.filter(p => p.status === "viewed").length,
      accepted: proposals.filter(p => p.status === "accepted").length,
      rejected: proposals.filter(p => p.status === "rejected").length,
      expired: proposals.filter(p => p.status === "expired").length,
      totalValue: proposals.reduce((sum, p) => sum + (Number(p.discounted_price) || Number(p.full_price) || 0), 0),
      acceptedValue: proposals
        .filter(p => p.status === "accepted")
        .reduce((sum, p) => sum + (Number(p.discounted_price) || Number(p.full_price) || 0), 0),
      conversionRate: proposals.filter(p => p.status !== "draft").length > 0
        ? (proposals.filter(p => p.status === "accepted").length / proposals.filter(p => p.status !== "draft").length * 100).toFixed(1)
        : 0,
      avgResponseTime: calculateAvgResponseTime(proposals),
    };

    // Calculate Contracts KPIs
    const activeContracts = contracts.filter(c => c.status === "active" || c.status === "signed");
    const expiringContracts = contracts.filter(c => {
      if (!c.end_date) return false;
      const endDate = new Date(c.end_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate <= thirtyDaysFromNow && endDate >= new Date();
    });

    const contractsKpis = {
      total: contracts.length,
      draft: contracts.filter(c => c.status === "draft").length,
      pending: contracts.filter(c => c.status === "pending_signature").length,
      signed: contracts.filter(c => c.status === "signed").length,
      active: activeContracts.length,
      cancelled: contracts.filter(c => c.status === "cancelled").length,
      expiringSoon: expiringContracts.length,
      recurring: contracts.filter(c => c.is_recurring).length,
      oneTime: contracts.filter(c => !c.is_recurring).length,
      totalValue: contracts.reduce((sum, c) => sum + (Number(c.discounted_price) || Number(c.full_price) || 0), 0),
      monthlyRecurring: contracts
        .filter(c => c.is_recurring && (c.status === "active" || c.status === "signed"))
        .reduce((sum, c) => sum + (Number(c.discounted_price) || Number(c.full_price) || 0), 0),
    };

    // Calculate Projects (Clients) KPIs
    const projectsKpis = {
      total: clients.length,
      byColumn: {
        onboarding: clients.filter(c => c.column_id === "onboarding").length,
        briefing: clients.filter(c => c.column_id === "briefing").length,
        in_progress: clients.filter(c => c.column_id === "in_progress").length,
        review: clients.filter(c => c.column_id === "review").length,
        delivered: clients.filter(c => c.column_id === "delivered").length,
        finalized: clients.filter(c => c.column_id === "finalized").length,
        ready_to_deliver: clients.filter(c => c.column_id === "ready_to_deliver").length,
      },
      active: clients.filter(c => !["finalized", "delivered"].includes(c.column_id)).length,
      delivered: clients.filter(c => c.column_id === "delivered" || c.column_id === "finalized").length,
      delayed: clients.filter(c => {
        if (!c.start_date) return false;
        const start = new Date(c.start_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return start < thirtyDaysAgo && !["finalized", "delivered"].includes(c.column_id);
      }).length,
    };

    // Calculate Recurring KPIs
    const recurringKpis = {
      total: recurring.length,
      active: recurring.filter(r => r.status === "active").length,
      paused: recurring.filter(r => r.status === "paused").length,
      cancelled: recurring.filter(r => r.status === "cancelled").length,
      monthlyRevenue: recurring
        .filter(r => r.status === "active")
        .reduce((sum, r) => sum + (Number(r.monthly_value) || 0), 0),
      upcomingExecutions: recurring.filter(r => {
        if (!r.next_execution_date) return false;
        const nextDate = new Date(r.next_execution_date);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return nextDate <= sevenDaysFromNow && nextDate >= new Date();
      }).length,
    };

    // Financial summary
    const financialSummary = {
      totalPipeline: leadsKpis.totalValue,
      totalProposals: proposalsKpis.totalValue,
      totalAcceptedProposals: proposalsKpis.acceptedValue,
      totalContracts: contractsKpis.totalValue,
      monthlyRecurring: contractsKpis.monthlyRecurring + recurringKpis.monthlyRevenue,
    };

    // Alerts
    const alerts = generateAlerts(leads, proposals, contracts, clients, expiringContracts);

    // Monthly trend (last 6 months)
    const monthlyTrend = calculateMonthlyTrend(leads, proposals, contracts);

    // Team performance
    const responsibles = [...new Set(leads.map(l => l.responsible).filter(Boolean))];

    const response = {
      success: true,
      agencyId,
      period: { startDate, endDate },
      kpis: {
        leads: leadsKpis,
        proposals: proposalsKpis,
        contracts: contractsKpis,
        projects: projectsKpis,
        recurring: recurringKpis,
      },
      financial: financialSummary,
      alerts,
      monthlyTrend,
      responsibles,
      teamSize: team.length,
    };

    console.log("BI data generated successfully");

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Dashboard BI error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateAvgResponseTime(proposals: any[]): number {
  const withResponse = proposals.filter(p => p.sent_at && (p.accepted_at || p.rejected_at));
  if (withResponse.length === 0) return 0;
  
  const totalHours = withResponse.reduce((sum, p) => {
    const sent = new Date(p.sent_at).getTime();
    const response = new Date(p.accepted_at || p.rejected_at).getTime();
    return sum + (response - sent) / (1000 * 60 * 60);
  }, 0);
  
  return Math.round(totalHours / withResponse.length);
}

function generateAlerts(leads: any[], proposals: any[], contracts: any[], clients: any[], expiringContracts: any[]): any[] {
  const alerts = [];
  
  // Hot leads without action
  const hotLeadsNoAction = leads.filter(l => 
    l.temperature === "quente" && 
    l.status === "open" &&
    !["ganho", "perdido"].includes(l.pipeline_stage)
  );
  if (hotLeadsNoAction.length > 0) {
    alerts.push({
      type: "warning",
      icon: "🔥",
      title: `${hotLeadsNoAction.length} leads quentes aguardando ação`,
      description: "Leads com alta probabilidade de conversão precisam de follow-up",
    });
  }

  // Proposals waiting response > 7 days
  const oldProposals = proposals.filter(p => {
    if (p.status !== "sent" && p.status !== "viewed") return false;
    if (!p.sent_at) return false;
    const sent = new Date(p.sent_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sent < sevenDaysAgo;
  });
  if (oldProposals.length > 0) {
    alerts.push({
      type: "warning",
      icon: "📄",
      title: `${oldProposals.length} propostas sem resposta há mais de 7 dias`,
      description: "Considere fazer follow-up com esses clientes",
    });
  }

  // Expiring contracts
  if (expiringContracts.length > 0) {
    alerts.push({
      type: "info",
      icon: "📅",
      title: `${expiringContracts.length} contratos vencem nos próximos 30 dias`,
      description: "Verifique renovações ou encerramentos",
    });
  }

  // Delayed projects
  const delayed = clients.filter(c => {
    if (!c.start_date) return false;
    const start = new Date(c.start_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return start < thirtyDaysAgo && !["finalized", "delivered"].includes(c.column_id);
  });
  if (delayed.length > 0) {
    alerts.push({
      type: "error",
      icon: "⚠️",
      title: `${delayed.length} projetos com mais de 30 dias de execução`,
      description: "Verifique o andamento desses projetos",
    });
  }

  // Low conversion rate
  const conversionRate = leads.length > 0 
    ? leads.filter(l => l.status === "gained" || l.pipeline_stage === "ganho").length / leads.length * 100
    : 0;
  if (leads.length >= 10 && conversionRate < 15) {
    alerts.push({
      type: "warning",
      icon: "📉",
      title: "Taxa de conversão abaixo de 15%",
      description: `Atual: ${conversionRate.toFixed(1)}%. Revise o processo comercial.`,
    });
  }

  return alerts;
}

function calculateMonthlyTrend(leads: any[], proposals: any[], contracts: any[]): any[] {
  const months: any[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthLeads = leads.filter(l => {
      const created = new Date(l.created_at);
      return created >= monthStart && created <= monthEnd;
    });
    
    const monthProposals = proposals.filter(p => {
      const created = new Date(p.created_at);
      return created >= monthStart && created <= monthEnd;
    });
    
    const monthContracts = contracts.filter(c => {
      const created = new Date(c.created_at);
      return created >= monthStart && created <= monthEnd;
    });
    
    months.push({
      month: monthStart.toLocaleString("pt-BR", { month: "short" }),
      year: monthStart.getFullYear(),
      leads: monthLeads.length,
      leadsValue: monthLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0),
      proposals: monthProposals.length,
      proposalsValue: monthProposals.reduce((sum, p) => sum + (Number(p.discounted_price) || Number(p.full_price) || 0), 0),
      contracts: monthContracts.length,
      contractsValue: monthContracts.reduce((sum, c) => sum + (Number(c.discounted_price) || Number(c.full_price) || 0), 0),
      conversions: monthLeads.filter(l => l.status === "gained" || l.pipeline_stage === "ganho").length,
    });
  }
  
  return months;
}
