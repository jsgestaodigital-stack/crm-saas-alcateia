import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProposalBlock as ProposalBlockType, BLOCK_TYPE_CONFIG } from '@/types/proposal';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalBlockProps {
  block: ProposalBlockType;
  onUpdate: (block: ProposalBlockType) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  variables?: Record<string, string>;
}

export function ProposalBlockComponent({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  variables = {}
}: ProposalBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const config = BLOCK_TYPE_CONFIG[block.type];

  const handleTitleChange = (title: string) => {
    onUpdate({ ...block, title });
  };

  const handleContentChange = (content: string) => {
    onUpdate({ ...block, content });
  };

  const handleChecklistItemToggle = (index: number) => {
    if (!block.checklist) return;
    const newChecklist = [...block.checklist];
    // For editing, we just keep the checklist as-is
    onUpdate({ ...block, checklist: newChecklist });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newChecklist = [...(block.checklist || []), newChecklistItem.trim()];
    onUpdate({ ...block, checklist: newChecklist });
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    if (!block.checklist) return;
    const newChecklist = block.checklist.filter((_, i) => i !== index);
    onUpdate({ ...block, checklist: newChecklist });
  };

  // Replace variables in content for preview
  const getPreviewContent = (content: string) => {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return result;
  };

  return (
    <Card className="border border-border/50 bg-surface-1/50">
      <div className="flex items-center gap-2 p-3 border-b border-border/30">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        
        <span className="text-lg">{config.emoji}</span>
        
        <Input
          value={block.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="flex-1 font-semibold bg-transparent border-none focus-visible:ring-0 px-1"
        />
        
        <div className="flex items-center gap-1">
          {!isFirst && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          {!isLast && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {block.type !== 'scope' && block.type !== 'investment' && (
            <Textarea
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Digite o conteúdo do bloco..."
              className="min-h-[100px] resize-y"
            />
          )}
          
          {block.type === 'scope' && block.checklist && (
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Itens do escopo</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {block.checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <Checkbox checked className="pointer-events-none" />
                    <span className="flex-1 text-sm">{item}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveChecklistItem(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Adicionar item..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                />
                <Button variant="outline" size="icon" onClick={handleAddChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {block.type === 'investment' && (
            <div className="text-sm text-muted-foreground">
              Os valores de investimento são configurados na seção de preços abaixo.
            </div>
          )}

          {/* Preview with variables replaced */}
          {block.content && Object.keys(variables).length > 0 && (
            <div className="pt-3 border-t border-border/30">
              <Label className="text-xs text-muted-foreground mb-2 block">Prévia:</Label>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {getPreviewContent(block.content)}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
