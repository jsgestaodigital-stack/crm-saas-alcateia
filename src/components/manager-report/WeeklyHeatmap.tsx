import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeatmapData {
  day: string;
  value: number;
}

interface WeeklyHeatmapProps {
  title: string;
  description?: string;
  data: HeatmapData[];
}

const dayOrder = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const WeeklyHeatmap = ({ title, description, data }: WeeklyHeatmapProps) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((acc, d) => acc + d.value, 0);

  // Sort by day order
  const sortedData = [...data].sort((a, b) => 
    dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  const getIntensity = (value: number) => {
    const ratio = value / maxValue;
    if (ratio >= 0.8) return "bg-primary";
    if (ratio >= 0.6) return "bg-primary/80";
    if (ratio >= 0.4) return "bg-primary/60";
    if (ratio >= 0.2) return "bg-primary/40";
    return "bg-primary/20";
  };

  const getBestDay = () => {
    if (data.length === 0) return null;
    return data.reduce((best, current) => 
      current.value > best.value ? current : best
    );
  };

  const bestDay = getBestDay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-lg font-bold text-primary">{total}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {sortedData.map((item) => {
            const isMax = bestDay && item.value === bestDay.value && item.value > 0;
            
            return (
              <div key={item.day} className="text-center">
                <p className={cn(
                  "text-xs mb-2",
                  isMax ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {item.day}
                </p>
                <div
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                    getIntensity(item.value),
                    isMax && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
        
        {bestDay && bestDay.value > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Maior atividade: <span className="font-medium text-primary">{bestDay.day}</span> com{" "}
            <span className="font-bold">{bestDay.value}</span> ações
          </div>
        )}
        
        {/* Intensity legend */}
        <div className="flex items-center justify-center gap-1 mt-4">
          <span className="text-xs text-muted-foreground mr-2">Menos</span>
          <div className="w-4 h-4 rounded bg-primary/20" />
          <div className="w-4 h-4 rounded bg-primary/40" />
          <div className="w-4 h-4 rounded bg-primary/60" />
          <div className="w-4 h-4 rounded bg-primary/80" />
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-xs text-muted-foreground ml-2">Mais</span>
        </div>
      </CardContent>
    </Card>
  );
};
