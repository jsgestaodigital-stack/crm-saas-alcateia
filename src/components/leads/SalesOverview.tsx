import { useMemo } from 'react';
import { Lead } from '@/types/lead';
import { 
  Target, 
  Flame, 
  CalendarCheck, 
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO, isBefore, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SalesOverviewProps {
  leads: Lead[];
}

// Funnel Stage Row - simplified
function FunnelStageRow({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string; 
  count: number; 
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <Badge variant="secondary" className="font-mono min-w-[32px] justify-center">
        {count}
      </Badge>
    </div>
  );
}

export function SalesOverview({ leads }: SalesOverviewProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const openLeads = leads.filter(l => l.status === 'open');
    const hotLeads = openLeads.filter(l => l.temperature === 'hot');
    
    const gainedThisMonth = leads.filter(l => 
      l.status === 'gained' && 
      l.converted_at && 
      isWithinInterval(parseISO(l.converted_at), { start: monthStart, end: monthEnd })
    );
    
    // Overdue follow-ups
    const overdueFollowups = openLeads.filter(l => 
      l.next_action_date && 
      isBefore(parseISO(l.next_action_date), now) &&
      !isToday(parseISO(l.next_action_date))
    );

    // Today follow-ups
    const todayFollowups = openLeads.filter(l => 
      l.next_action_date && isToday(parseISO(l.next_action_date))
    );
    
    // Pipeline stages
    const byStage = {
      cold: openLeads.filter(l => l.pipeline_stage === 'cold'),
      contacted: openLeads.filter(l => l.pipeline_stage === 'contacted'),
      qualified: openLeads.filter(l => l.pipeline_stage === 'qualified'),
      meeting_scheduled: openLeads.filter(l => l.pipeline_stage === 'meeting_scheduled'),
      meeting_done: openLeads.filter(l => l.pipeline_stage === 'meeting_done'),
      proposal_sent: openLeads.filter(l => l.pipeline_stage === 'proposal_sent'),
      negotiating: openLeads.filter(l => l.pipeline_stage === 'negotiating'),
    };

    return {
      openLeads: openLeads.length,
      hotLeads: hotLeads.length,
      gainedThisMonth: gainedThisMonth.length,
      overdueFollowups: overdueFollowups.length,
      todayFollowups: todayFollowups.length,
      byStage,
      overdueList: overdueFollowups.slice(0, 5),
      hotList: hotLeads.slice(0, 5),
    };
  }, [leads]);

  const STAGE_CONFIG = [
    { key: 'cold', label: 'Frio', color: 'bg-slate-500' },
    { key: 'contacted', label: 'Contatado', color: 'bg-blue-500' },
    { key: 'qualified', label: 'Qualificado', color: 'bg-cyan-500' },
    { key: 'meeting_scheduled', label: 'Reunião Agendada', color: 'bg-violet-500' },
    { key: 'meeting_done', label: 'Reunião Feita', color: 'bg-purple-500' },
    { key: 'proposal_sent', label: 'Proposta Enviada', color: 'bg-amber-500' },
    { key: 'negotiating', label: 'Negociando', color: 'bg-orange-500' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Quick Stats - Simplified */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-amber-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Target className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">No Pipeline</p>
                <p className="text-lg font-bold font-mono text-amber-400">{metrics.openLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("glass-card", metrics.hotLeads > 0 ? "border-red-500/30" : "border-muted/20")}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", metrics.hotLeads > 0 ? "bg-red-500/10" : "bg-muted/10")}>
                <Flame className={cn("h-4 w-4", metrics.hotLeads > 0 ? "text-red-400" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Quentes</p>
                <p className={cn("text-lg font-bold font-mono", metrics.hotLeads > 0 ? "text-red-400" : "text-muted-foreground")}>
                  {metrics.hotLeads}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("glass-card", metrics.overdueFollowups > 0 ? "border-status-warning/30" : "border-muted/20")}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", metrics.overdueFollowups > 0 ? "bg-status-warning/10" : "bg-muted/10")}>
                <AlertTriangle className={cn("h-4 w-4", metrics.overdueFollowups > 0 ? "text-status-warning" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Atrasados</p>
                <p className={cn("text-lg font-bold font-mono", metrics.overdueFollowups > 0 ? "text-status-warning" : "text-muted-foreground")}>
                  {metrics.overdueFollowups}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-status-success/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-status-success/10">
                <CheckCircle2 className="h-4 w-4 text-status-success" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Ganhos (Mês)</p>
                <p className="text-lg font-bold font-mono text-status-success">{metrics.gainedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pipeline Funnel */}
        <Card className="glass-card border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              Pipeline de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STAGE_CONFIG.map(({ key, label, color }) => (
              <FunnelStageRow
                key={key}
                label={label}
                count={metrics.byStage[key as keyof typeof metrics.byStage]?.length || 0}
                total={metrics.openLeads}
                color={color}
              />
            ))}
          </CardContent>
        </Card>

        {/* Action Items */}
        <div className="space-y-4">
          {/* Hot Leads */}
          {metrics.hotLeads > 0 && (
            <Card className="glass-card border-red-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-400">
                  <Flame className="h-4 w-4" />
                  Leads Quentes ({metrics.hotLeads})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {metrics.hotList.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                        <span className="text-sm font-medium truncate">{lead.company_name}</span>
                        <ArrowRight className="h-4 w-4 text-red-400" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Overdue Follow-ups */}
          {metrics.overdueFollowups > 0 && (
            <Card className="glass-card border-status-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-status-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Follow-ups Atrasados ({metrics.overdueFollowups})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {metrics.overdueList.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-status-warning/5 border border-status-warning/20">
                        <div>
                          <span className="text-sm font-medium truncate block">{lead.company_name}</span>
                          {lead.next_action && (
                            <span className="text-xs text-muted-foreground">{lead.next_action}</span>
                          )}
                        </div>
                        {lead.next_action_date && (
                          <Badge variant="destructive" className="text-[10px]">
                            {differenceInDays(new Date(), parseISO(lead.next_action_date))}d
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Today's Follow-ups */}
          {metrics.todayFollowups > 0 && (
            <Card className="glass-card border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-400">
                  <CalendarCheck className="h-4 w-4" />
                  Para Fazer Hoje ({metrics.todayFollowups})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Você tem {metrics.todayFollowups} follow-up{metrics.todayFollowups > 1 ? 's' : ''} agendado{metrics.todayFollowups > 1 ? 's' : ''} para hoje.
                </p>
              </CardContent>
            </Card>
          )}

          {/* All Clear */}
          {metrics.overdueFollowups === 0 && metrics.hotLeads === 0 && (
            <Card className="glass-card border-status-success/30">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-status-success/50" />
                <h3 className="font-semibold text-status-success">Tudo em dia!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum lead atrasado ou urgente no momento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}