import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RotateCcw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { usePipelineColumns, PipelineColumn } from '@/hooks/usePipelineColumns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ColumnSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMOJI_OPTIONS = ['📋', '📞', '✅', '📅', '🤝', '📄', '💬', '⏳', '🎯', '🔥', '💰', '🚀', '⭐', '🏆'];
const COLOR_OPTIONS = [
  'bg-slate-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-green-500',
  'bg-pink-500',
  'bg-teal-500',
];

export function ColumnSettingsDialog({ open, onOpenChange }: ColumnSettingsDialogProps) {
  const { isAdmin } = useAuth();
  const { 
    columns, 
    addColumn, 
    updateColumn, 
    deleteColumn, 
    moveColumn, 
    resetToDefaults 
  } = usePipelineColumns();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('📋');
  const [newColor, setNewColor] = useState('bg-blue-500');

  const startEdit = (column: PipelineColumn) => {
    setEditingId(column.id);
    setEditTitle(column.title);
    setEditEmoji(column.emoji);
    setEditColor(column.color);
  };

  const saveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    
    updateColumn(editingId, {
      title: editTitle.trim(),
      emoji: editEmoji,
      color: editColor,
    });
    toast.success('Coluna atualizada');
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleAddColumn = () => {
    if (!newTitle.trim()) {
      toast.error('Digite um nome para a coluna');
      return;
    }
    
    addColumn(newTitle.trim(), newEmoji, newColor);
    toast.success('Coluna criada');
    setNewTitle('');
    setNewEmoji('📋');
    setNewColor('bg-blue-500');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    const column = columns.find(c => c.id === id);
    if (column?.isDefault && !isAdmin) {
      toast.error('Apenas administradores podem excluir colunas padrão');
      return;
    }
    
    const confirmMsg = column?.isDefault 
      ? `⚠️ Esta é uma coluna padrão. Excluir "${column?.title}"?` 
      : `Excluir coluna "${column?.title}"?`;
    
    if (confirm(confirmMsg)) {
      deleteColumn(id, isAdmin);
      toast.success('Coluna excluída');
    }
  };

  const handleReset = () => {
    if (confirm('Restaurar colunas padrão? Colunas personalizadas serão removidas.')) {
      resetToDefaults();
      toast.success('Colunas restauradas');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-amber-400" />
            Configurar Colunas do Pipeline
          </DialogTitle>
          <DialogDescription>
            Adicione, edite, reordene ou remova colunas do seu pipeline de vendas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {columns.map((column, index) => (
            <div
              key={column.id}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-all",
                editingId === column.id 
                  ? "border-amber-500/50 bg-amber-500/5" 
                  : "border-border/30 bg-surface-2/30 hover:bg-surface-2/50"
              )}
            >
              {/* Drag Handle & Reorder */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => index > 0 && moveColumn(index, index - 1)}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => index < columns.length - 1 && moveColumn(index, index + 1)}
                  disabled={index === columns.length - 1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              {editingId === column.id ? (
                // Edit Mode
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Nome da coluna"
                      className="flex-1"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Label className="text-xs w-full">Emoji:</Label>
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setEditEmoji(emoji)}
                        className={cn(
                          "w-8 h-8 rounded text-lg hover:bg-muted/50 transition-all",
                          editEmoji === emoji && "ring-2 ring-amber-500 bg-amber-500/10"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Label className="text-xs w-full">Cor:</Label>
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all",
                          color,
                          editColor === color && "ring-2 ring-offset-2 ring-offset-background ring-white"
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="gap-1">
                        <Check className="h-3 w-3" />
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="gap-1">
                        <X className="h-3 w-3" />
                        Cancelar
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        cancelEdit();
                        handleDelete(column.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-lg",
                    column.color + '/20'
                  )}>
                    {column.emoji}
                  </div>
                  
                  <div className="flex-1">
                    <span className="font-medium text-sm">{column.title}</span>
                    {column.isDefault && (
                      <Badge variant="outline" className="ml-2 text-[9px]">
                        padrão
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-amber-400"
                      onClick={() => startEdit(column)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {(!column.isDefault || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive"
                        onClick={() => handleDelete(column.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add New Column */}
          {isAdding ? (
            <div className="p-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 space-y-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nome da nova coluna"
                autoFocus
              />
              
              <div className="flex gap-2 flex-wrap">
                <Label className="text-xs w-full">Emoji:</Label>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewEmoji(emoji)}
                    className={cn(
                      "w-8 h-8 rounded text-lg hover:bg-muted/50 transition-all",
                      newEmoji === emoji && "ring-2 ring-amber-500 bg-amber-500/10"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Label className="text-xs w-full">Cor:</Label>
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      color,
                      newColor === color && "ring-2 ring-offset-2 ring-offset-background ring-white"
                    )}
                  />
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleAddColumn} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Criar Coluna
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/5"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Nova Coluna
            </Button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Concluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
