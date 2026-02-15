import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, User, FileText, BarChart3, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEntry {
  id: string;
  action_type: string;
  entity_type: string;
  entity_name: string | null;
  user_name: string;
  created_at: string;
  metadata: any;
}

const ACTION_ICONS: Record<string, typeof Activity> = {
  create: FileText,
  update: BarChart3,
  delete: Activity,
  move: ArrowRight,
};

const ACTION_LABELS: Record<string, string> = {
  create: "criou",
  update: "atualizou",
  delete: "removeu",
  move: "moveu",
  insert: "adicionou",
  status_change: "alterou status de",
};

const ENTITY_LABELS: Record<string, string> = {
  lead: "Lead",
  client: "Cliente",
  proposal: "Proposta",
  contract: "Contrato",
  commission: "Comissão",
  appointment: "Compromisso",
  task: "Tarefa",
};

export function ActivityFeed() {
  const { currentAgencyId } = useAuth();
  const [activities, setActivities] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    if (!currentAgencyId) return;
    
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, action_type, entity_type, entity_name, user_name, created_at, metadata")
        .eq("agency_id", currentAgencyId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }
      setActivities(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        (payload) => {
          const newEntry = payload.new as AuditEntry;
          setActivities((prev) => [newEntry, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAgencyId]);

  const getActionLabel = (action: string) => ACTION_LABELS[action] || action;
  const getEntityLabel = (entity: string) => ENTITY_LABELS[entity] || entity;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 bg-muted rounded" />
                  <div className="h-2 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividades Recentes
          <Badge variant="secondary" className="ml-auto text-xs">
            Tempo real
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="px-6 pb-4 space-y-1">
            {activities.map((entry) => {
              const IconComponent = ACTION_ICONS[entry.action_type] || Activity;
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
                >
                  <div className="mt-0.5 rounded-full p-1.5 bg-muted">
                    <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{entry.user_name}</span>{" "}
                      <span className="text-muted-foreground">{getActionLabel(entry.action_type)}</span>{" "}
                      <span className="text-muted-foreground">{getEntityLabel(entry.entity_type)}</span>
                      {entry.entity_name && (
                        <span className="font-medium"> "{entry.entity_name}"</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
