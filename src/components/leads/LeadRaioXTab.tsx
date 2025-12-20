import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Zap, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface RaioXAnalysis {
  id: string;
  created_at: string;
  summary: string | null;
  transcription: string | null;
}

interface LeadRaioXTabProps {
  leadId: string;
}

export function LeadRaioXTab({ leadId }: LeadRaioXTabProps) {
  const [analyses, setAnalyses] = useState<RaioXAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, [leadId]);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('raiox_analyses')
        .select('id, created_at, summary, transcription')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analyses:', error);
        return;
      }

      setAnalyses(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto mb-4">
          <Zap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Nenhuma análise realizada
        </h3>
        <p className="text-xs text-muted-foreground/70">
          Acesse o Raio-X do Fechamento para analisar uma reunião com este lead
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-2">
      <div className="space-y-3">
        {analyses.map((analysis, index) => {
          const analysisNumber = analyses.length - index;
          const isExpanded = expandedId === analysis.id;
          const createdAt = new Date(analysis.created_at);
          
          return (
            <Card 
              key={analysis.id} 
              className={cn(
                "border transition-colors",
                isExpanded ? "border-purple-500/30 bg-purple-500/5" : "border-border"
              )}
            >
              <CardHeader className="p-3 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs font-mono bg-purple-500/10 text-purple-400 border-purple-500/30"
                    >
                      #{analysisNumber}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : analysis.id)}
                    className="h-7 px-2"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 pt-2">
                {isExpanded ? (
                  <div className="space-y-3">
                    {/* Análise completa */}
                    <div>
                      <div className="flex items-center gap-1 text-xs font-medium text-purple-400 mb-2">
                        <Zap className="h-3 w-3" />
                        Análise Estratégica
                      </div>
                      <div className="bg-background/50 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                          {analysis.summary || 'Sem análise disponível'}
                        </p>
                      </div>
                    </div>

                    {/* Transcrição original */}
                    {analysis.transcription && (
                      <div>
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                          <FileText className="h-3 w-3" />
                          Transcrição Original
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 max-h-[150px] overflow-y-auto">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                            {analysis.transcription.substring(0, 500)}
                            {analysis.transcription.length > 500 && '...'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {analysis.summary?.substring(0, 150) || 'Sem análise disponível'}
                    {(analysis.summary?.length || 0) > 150 && '...'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
