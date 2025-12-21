import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Target, 
  CheckSquare, 
  UserPlus, 
  Map, 
  FileText, 
  Settings,
  TrendingUp,
  Star,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ACTIVATION_EVENTS, ActivationEvent } from '@/hooks/useActivation';
import { cn } from '@/lib/utils';

interface ActivationStats {
  total_users: number;
  events_by_type: Record<string, number> | null;
  nps_stats: {
    total_responses: number;
    average_score: number | null;
    promoters: number;
    passives: number;
    detractors: number;
    nps_score: number | null;
  } | null;
}

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  added_first_client: Users,
  created_first_lead: Target,
  created_first_task: CheckSquare,
  invited_team_member: UserPlus,
  completed_visual_tour: Map,
  accessed_reports: FileText,
  customized_settings: Settings,
  completed_onboarding_step: CheckSquare,
  viewed_dashboard: TrendingUp,
  exported_data: Download,
};

export default function ActivationDashboard() {
  const navigate = useNavigate();
  const { user, derived } = useAuth();

  const canAccess = derived?.canAdminOrIsAdmin;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['activation-stats'],
    queryFn: async (): Promise<ActivationStats> => {
      const { data, error } = await supabase.rpc('get_activation_stats');
      
      if (error) throw error;
      return data as unknown as ActivationStats;
    },
    enabled: !!user && canAccess,
  });

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  const npsScore = stats?.nps_stats?.nps_score;
  const totalUsers = stats?.total_users || 0;
  const eventsByType = stats?.events_by_type || {};

  // Calculate activation rate for each event
  const eventStats = Object.keys(ACTIVATION_EVENTS).map(key => {
    const count = eventsByType[key] || 0;
    const rate = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
    return {
      key: key as ActivationEvent,
      ...ACTIVATION_EVENTS[key as ActivationEvent],
      count,
      rate,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Funil de Ativação
              </h1>
              <p className="text-sm text-muted-foreground">
                Métricas de engajamento e NPS
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* NPS Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                NPS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className={cn(
                  "text-5xl font-bold",
                  npsScore === null ? "text-muted-foreground" :
                  npsScore >= 50 ? "text-status-success" :
                  npsScore >= 0 ? "text-amber-500" : "text-status-danger"
                )}>
                  {npsScore !== null ? npsScore : '--'}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-status-success">
                      <ThumbsUp className="h-4 w-4" /> Promotores
                    </span>
                    <span className="font-medium">{stats?.nps_stats?.promoters || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Meh className="h-4 w-4" /> Neutros
                    </span>
                    <span className="font-medium">{stats?.nps_stats?.passives || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-status-danger">
                      <ThumbsDown className="h-4 w-4" /> Detratores
                    </span>
                    <span className="font-medium">{stats?.nps_stats?.detractors || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Respostas NPS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.nps_stats?.total_responses || 0}</div>
              <p className="text-sm text-muted-foreground">de {totalUsers} usuários</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Média de Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.nps_stats?.average_score?.toFixed(1) || '--'}
              </div>
              <p className="text-sm text-muted-foreground">de 0 a 10</p>
            </CardContent>
          </Card>
        </div>

        {/* Activation Events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Ativação</CardTitle>
            <CardDescription>
              Taxa de adoção por funcionalidade ({totalUsers} usuários totais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventStats.map(event => {
                const Icon = EVENT_ICONS[event.key] || CheckSquare;
                return (
                  <div key={event.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{event.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {event.count} usuários
                        </span>
                        <span className="text-sm font-medium w-12 text-right">
                          {event.rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={event.rate} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
