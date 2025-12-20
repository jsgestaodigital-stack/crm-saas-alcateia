import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLeadActivities } from '@/hooks/useLeads';
import { LeadActivityType, ACTIVITY_TYPE_CONFIG } from '@/types/lead';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, 
  Phone, 
  Users, 
  StickyNote, 
  RefreshCw, 
  FileText,
  Mail,
  Link,
  Plus,
  Send
} from 'lucide-react';

const ACTIVITY_BUTTONS: { type: LeadActivityType; icon: React.ElementType; label: string }[] = [
  { type: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
  { type: 'call', icon: Phone, label: 'Ligação' },
  { type: 'meeting', icon: Users, label: 'Reunião' },
  { type: 'follow_up', icon: RefreshCw, label: 'Follow-up' },
  { type: 'note', icon: StickyNote, label: 'Nota' },
  { type: 'proposal', icon: FileText, label: 'Proposta' },
];

interface LeadActivityTabProps {
  leadId: string;
}

export function LeadActivityTab({ leadId }: LeadActivityTabProps) {
  const { activities, loading, addActivity } = useLeadActivities(leadId);
  const [selectedType, setSelectedType] = useState<LeadActivityType | null>(null);
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !content.trim()) return;
    
    setIsSubmitting(true);
    const success = await addActivity(selectedType, content, link || undefined);
    setIsSubmitting(false);
    
    if (success) {
      setSelectedType(null);
      setContent('');
      setLink('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_BUTTONS.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className="gap-1 text-xs"
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
      </div>

      {/* Add Activity Form */}
      {selectedType && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", ACTIVITY_TYPE_CONFIG[selectedType].color)}>
              {ACTIVITY_TYPE_CONFIG[selectedType].emoji} {ACTIVITY_TYPE_CONFIG[selectedType].label}
            </Badge>
          </div>
          <Textarea
            placeholder="O que aconteceu?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px]"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Link (opcional)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              size="sm"
              className="gap-1"
            >
              <Send className="h-3 w-3" />
              Registrar
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Histórico</h4>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const config = ACTIVITY_TYPE_CONFIG[activity.type];
              return (
                <div 
                  key={activity.id}
                  className="p-3 rounded-lg border border-border/30 bg-surface-1/50"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px]", config.color)}
                    >
                      {config.emoji} {config.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(activity.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{activity.content}</p>
                  {activity.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      📝 {activity.notes}
                    </p>
                  )}
                  {activity.ai_insight && (
                    <div className="mt-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                      <p className="text-xs text-purple-400 flex items-center gap-1">
                        <span>🤖</span>
                        <span className="font-semibold">Insight IA:</span>
                      </p>
                      <p className="text-xs text-purple-300 mt-1">{activity.ai_insight}</p>
                    </div>
                  )}
                  {activity.link && (
                    <a 
                      href={activity.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                    >
                      <Link className="h-3 w-3" />
                      Ver link
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    por {activity.created_by_name}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
