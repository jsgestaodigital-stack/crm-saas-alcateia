import { useState } from 'react';
import { useEngagementRankings, EngagementRanking } from '@/hooks/useEngagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Medal, 
  Award, 
  Zap, 
  Activity, 
  Eye, 
  MousePointer, 
  Star,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getEngagementBadge(level: EngagementRanking['engagement_level']) {
  switch (level) {
    case 'champion':
      return (
        <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-0 font-bold">
          <Trophy className="h-3 w-3 mr-1" />
          Campeão
        </Badge>
      );
    case 'power_user':
      return (
        <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
          <Zap className="h-3 w-3 mr-1" />
          Power User
        </Badge>
      );
    case 'active':
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0">
          <Activity className="h-3 w-3 mr-1" />
          Ativo
        </Badge>
      );
    case 'exploring':
      return (
        <Badge className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-0">
          <Eye className="h-3 w-3 mr-1" />
          Explorando
        </Badge>
      );
    case 'inactive':
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Inativo
        </Badge>
      );
  }
}

function getRankIcon(index: number) {
  switch (index) {
    case 0:
      return <Trophy className="h-5 w-5 text-amber-400" />;
    case 1:
      return <Medal className="h-5 w-5 text-slate-300" />;
    case 2:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm text-muted-foreground w-5 text-center">{index + 1}</span>;
  }
}

function ScoreBreakdown({ ranking }: { ranking: EngagementRanking }) {
  const maxScore = Math.max(ranking.navigation_score, ranking.crud_score, ranking.feature_score, 1);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <MousePointer className="h-3 w-3 text-blue-400" />
        <span className="w-20">Navegação</span>
        <Progress value={(ranking.navigation_score / maxScore) * 100} className="h-1.5 flex-1" />
        <span className="w-8 text-right">{ranking.navigation_score}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <TrendingUp className="h-3 w-3 text-emerald-400" />
        <span className="w-20">Ações</span>
        <Progress value={(ranking.crud_score / maxScore) * 100} className="h-1.5 flex-1" />
        <span className="w-8 text-right">{ranking.crud_score}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Star className="h-3 w-3 text-purple-400" />
        <span className="w-20">Features</span>
        <Progress value={(ranking.feature_score / maxScore) * 100} className="h-1.5 flex-1" />
        <span className="w-8 text-right">{ranking.feature_score}</span>
      </div>
    </div>
  );
}

export function EngagementRankingTab() {
  const [daysBack, setDaysBack] = useState(30);
  const { data: rankings, isLoading, refetch } = useEngagementRankings(daysBack, 50);

  const stats = rankings ? {
    totalUsers: rankings.length,
    champions: rankings.filter(r => r.engagement_level === 'champion').length,
    powerUsers: rankings.filter(r => r.engagement_level === 'power_user').length,
    active: rankings.filter(r => r.engagement_level === 'active').length,
    exploring: rankings.filter(r => r.engagement_level === 'exploring').length,
    inactive: rankings.filter(r => r.engagement_level === 'inactive').length,
    avgScore: rankings.length > 0 
      ? Math.round(rankings.reduce((sum, r) => sum + r.total_score, 0) / rankings.length)
      : 0,
  } : null;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Total Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-amber-400">{stats?.champions || 0}</p>
                <p className="text-xs text-muted-foreground">Campeões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-violet-400" />
              <div>
                <p className="text-2xl font-bold text-violet-400">{stats?.powerUsers || 0}</p>
                <p className="text-xs text-muted-foreground">Power Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-400">{stats?.active || 0}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats?.exploring || 0}</p>
                <p className="text-xs text-muted-foreground">Explorando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.inactive || 0}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.avgScore || 0}</p>
                <p className="text-xs text-muted-foreground">Média Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Ranking de Engajamento
              </CardTitle>
              <CardDescription>
                Usuários mais ativos na plataforma
              </CardDescription>
            </div>
            <Select value={daysBack.toString()} onValueChange={(v) => setDaysBack(Number(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !rankings || rankings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado de engajamento ainda</p>
              <p className="text-sm mt-1">Os dados aparecerão conforme os usuários usam a plataforma</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Eventos</TableHead>
                  <TableHead className="text-center">Dias Ativos</TableHead>
                  <TableHead className="w-48">Breakdown</TableHead>
                  <TableHead>Última Atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((ranking, index) => (
                  <TableRow 
                    key={`${ranking.user_id}-${ranking.agency_id}`}
                    className={index < 3 ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getRankIcon(index)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ranking.user_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {ranking.agency_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getEngagementBadge(ranking.engagement_level)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-lg">{ranking.total_score}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{ranking.total_events}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{ranking.active_days}</span>
                    </TableCell>
                    <TableCell>
                      <ScoreBreakdown ranking={ranking} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ranking.last_activity ? (
                          <>
                            <div className="text-muted-foreground">
                              {formatDistanceToNow(new Date(ranking.last_activity), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground/70">
                              {format(new Date(ranking.last_activity), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
