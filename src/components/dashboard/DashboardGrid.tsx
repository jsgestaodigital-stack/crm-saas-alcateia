import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, RotateCcw, Users, Target, CheckCircle2, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIWidget {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

interface SortableKPIProps {
  widget: KPIWidget;
}

function SortableKPI({ widget }: SortableKPIProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={cn(
        'relative group hover:shadow-md transition-shadow border-border/60',
        isDragging && 'shadow-lg ring-2 ring-primary/30'
      )}>
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing touch-none z-10"
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', widget.color)}>
              {widget.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">{widget.title}</p>
              <p className="text-xl font-bold">{widget.value}</p>
              {widget.subtitle && (
                <p className="text-xs text-muted-foreground">{widget.subtitle}</p>
              )}
              {widget.trend && (
                <Badge variant="secondary" className="text-xs mt-1">{widget.trend}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const STORAGE_KEY = 'gbrank-dashboard-layout';

interface DashboardGridProps {
  clientsCount: number;
  leadsCount: number;
  completedTasks: number;
  pendingTasks: number;
  conversionRate: number;
  monthlyRevenue: number;
}

export function DashboardGrid({
  clientsCount,
  leadsCount,
  completedTasks,
  pendingTasks,
  conversionRate,
  monthlyRevenue,
}: DashboardGridProps) {
  const defaultOrder = ['clients', 'leads', 'completed', 'pending', 'conversion', 'revenue'];

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultOrder;
    } catch {
      return defaultOrder;
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const widgetMap: Record<string, KPIWidget> = useMemo(() => ({
    clients: {
      id: 'clients',
      title: 'Clientes Ativos',
      value: clientsCount,
      icon: <Users className="h-4 w-4 text-primary" />,
      color: 'bg-primary/10',
    },
    leads: {
      id: 'leads',
      title: 'Leads Abertos',
      value: leadsCount,
      icon: <Target className="h-4 w-4 text-amber-500" />,
      color: 'bg-amber-500/10',
    },
    completed: {
      id: 'completed',
      title: 'Tarefas Concluídas',
      value: completedTasks,
      subtitle: 'Este mês',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      color: 'bg-emerald-500/10',
    },
    pending: {
      id: 'pending',
      title: 'Tarefas Pendentes',
      value: pendingTasks,
      icon: <Clock className="h-4 w-4 text-orange-500" />,
      color: 'bg-orange-500/10',
    },
    conversion: {
      id: 'conversion',
      title: 'Taxa de Conversão',
      value: `${conversionRate}%`,
      icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
      color: 'bg-blue-500/10',
    },
    revenue: {
      id: 'revenue',
      title: 'Receita Mensal',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyRevenue),
      icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
      color: 'bg-emerald-600/10',
    },
  }), [clientsCount, leadsCount, completedTasks, pendingTasks, conversionRate, monthlyRevenue]);

  const widgets = order.map(id => widgetMap[id]).filter(Boolean);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder(prev => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);

  const handleReset = () => {
    setOrder(defaultOrder);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPIs</h3>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs gap-1 h-7">
          <RotateCcw className="h-3 w-3" />
          Resetar
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {widgets.map((widget) => (
              <SortableKPI key={widget.id} widget={widget} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
