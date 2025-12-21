import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadsKpis {
  total: number;
  byStage: Record<string, number>;
  byTemperature: Record<string, number>;
  converted: number;
  lost: number;
  totalValue: number;
  conversionRate: string | number;
}

export interface ProposalsKpis {
  total: number;
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
  expired: number;
  totalValue: number;
  acceptedValue: number;
  conversionRate: string | number;
  avgResponseTime: number;
}

export interface ContractsKpis {
  total: number;
  draft: number;
  pending: number;
  signed: number;
  active: number;
  cancelled: number;
  expiringSoon: number;
  recurring: number;
  oneTime: number;
  totalValue: number;
  monthlyRecurring: number;
}

export interface ProjectsKpis {
  total: number;
  byColumn: Record<string, number>;
  active: number;
  delivered: number;
  delayed: number;
}

export interface RecurringKpis {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
  monthlyRevenue: number;
  upcomingExecutions: number;
}

export interface FinancialSummary {
  totalPipeline: number;
  totalProposals: number;
  totalAcceptedProposals: number;
  totalContracts: number;
  monthlyRecurring: number;
}

export interface Alert {
  type: "info" | "warning" | "error";
  icon: string;
  title: string;
  description: string;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  leads: number;
  leadsValue: number;
  proposals: number;
  proposalsValue: number;
  contracts: number;
  contractsValue: number;
  conversions: number;
}

export interface DashboardBIData {
  success: boolean;
  agencyId: string;
  period: { startDate: string; endDate: string };
  kpis: {
    leads: LeadsKpis;
    proposals: ProposalsKpis;
    contracts: ContractsKpis;
    projects: ProjectsKpis;
    recurring: RecurringKpis;
  };
  financial: FinancialSummary;
  alerts: Alert[];
  monthlyTrend: MonthlyTrend[];
  responsibles: string[];
  teamSize: number;
}

interface UseDashboardBIOptions {
  startDate?: string;
  endDate?: string;
  responsible?: string;
}

export function useDashboardBI(options: UseDashboardBIOptions = {}) {
  const [data, setData] = useState<DashboardBIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.startDate) params.set("startDate", options.startDate);
      if (options.endDate) params.set("endDate", options.endDate);
      if (options.responsible) params.set("responsible", options.responsible);

      const { data: result, error: fnError } = await supabase.functions.invoke("dashboard-bi", {
        body: null,
        method: "GET",
      });

      if (fnError) {
        throw fnError;
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      setData(result as DashboardBIData);
    } catch (err: any) {
      console.error("Dashboard BI error:", err);
      setError(err.message || "Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, [options.startDate, options.endDate, options.responsible]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
