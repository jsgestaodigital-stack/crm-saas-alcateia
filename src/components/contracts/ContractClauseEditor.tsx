import React from 'react';
import { ContractClause, CLAUSE_TYPE_CONFIG, ContractClauseType } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  GripVertical, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown,
  Lock
} from 'lucide-react';

interface ContractClauseEditorProps {
  clause: ContractClause;
  index: number;
  totalClauses: number;
  onChange: (clause: ContractClause) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ContractClauseEditor({
  clause,
  index,
  totalClauses,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}: ContractClauseEditorProps) {
  const clauseConfig = CLAUSE_TYPE_CONFIG[clause.type as ContractClauseType] || CLAUSE_TYPE_CONFIG.custom;

  return (
    <Card className={`transition-opacity ${clause.isHidden ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <span className="text-lg">{clauseConfig.emoji}</span>
            <Input
              value={clause.title}
              onChange={(e) => onChange({ ...clause, title: e.target.value })}
              className="font-semibold text-sm h-8"
              disabled={!clause.isEditable}
            />
          </div>
          <div className="flex items-center gap-1">
            {clause.isRequired && (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onChange({ ...clause, isHidden: !clause.isHidden })}
            >
              {clause.isHidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMoveUp}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMoveDown}
              disabled={index === totalClauses - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            {!clause.isRequired && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={clause.content}
          onChange={(e) => onChange({ ...clause, content: e.target.value })}
          className="min-h-[150px] font-mono text-sm"
          placeholder="Conteúdo da cláusula..."
        />
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`required-${clause.id}`}
              checked={clause.isRequired}
              onCheckedChange={(checked) => onChange({ ...clause, isRequired: checked })}
            />
            <Label htmlFor={`required-${clause.id}`} className="text-sm">
              Obrigatória
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`editable-${clause.id}`}
              checked={clause.isEditable}
              onCheckedChange={(checked) => onChange({ ...clause, isEditable: checked })}
            />
            <Label htmlFor={`editable-${clause.id}`} className="text-sm">
              Editável
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
