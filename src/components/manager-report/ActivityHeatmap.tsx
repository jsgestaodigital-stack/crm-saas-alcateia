import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { format, subDays, startOfDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityHeatmapProps {
  /** Array of { date: string (ISO), count: number } for the last ~90 days */
  data: { date: string; count: number }[];
  className?: string;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getColorIntensity(count: number, max: number): string {
  if (count === 0) return "bg-muted/40";
  const ratio = count / Math.max(max, 1);
  if (ratio <= 0.25) return "bg-primary/20";
  if (ratio <= 0.5) return "bg-primary/40";
  if (ratio <= 0.75) return "bg-primary/60";
  return "bg-primary/90";
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  const { grid, maxCount, totalActivities, weeks } = useMemo(() => {
    const today = startOfDay(new Date());
    const daysBack = 91; // ~13 weeks
    const dateMap = new Map<string, number>();
    
    data.forEach(d => {
      const key = format(new Date(d.date), "yyyy-MM-dd");
      dateMap.set(key, (dateMap.get(key) || 0) + d.count);
    });

    let max = 0;
    let total = 0;
    const cells: { date: Date; count: number; key: string }[] = [];

    for (let i = daysBack; i >= 0; i--) {
      const day = subDays(today, i);
      const key = format(day, "yyyy-MM-dd");
      const count = dateMap.get(key) || 0;
      max = Math.max(max, count);
      total += count;
      cells.push({ date: day, count, key });
    }

    // Organize into weeks (columns)
    const weekColumns: typeof cells[] = [];
    let currentWeek: typeof cells = [];
    
    cells.forEach((cell) => {
      const dow = getDay(cell.date);
      if (dow === 0 && currentWeek.length > 0) {
        weekColumns.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(cell);
    });
    if (currentWeek.length > 0) weekColumns.push(currentWeek);

    return { grid: cells, maxCount: max, totalActivities: total, weeks: weekColumns };
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          Mapa de Calor de Atividades
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {totalActivities} atividades nos últimos 90 dias
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Weekday labels */}
          <div className="flex flex-col gap-[3px] mr-1 pt-0">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="h-[14px] flex items-center">
                {i % 2 === 1 && (
                  <span className="text-[9px] text-muted-foreground w-6 text-right">{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Grid */}
          <TooltipProvider delayDuration={200}>
            <div className="flex gap-[3px] overflow-x-auto">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {/* Pad first week if it doesn't start on Sunday */}
                  {wi === 0 && Array.from({ length: getDay(week[0].date) }).map((_, pi) => (
                    <div key={`pad-${pi}`} className="w-[14px] h-[14px]" />
                  ))}
                  {week.map((cell) => (
                    <Tooltip key={cell.key}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-[14px] h-[14px] rounded-[3px] transition-colors",
                            getColorIntensity(cell.count, maxCount)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">
                          {format(cell.date, "dd MMM yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-muted-foreground">
                          {cell.count} {cell.count === 1 ? "atividade" : "atividades"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          <div className="flex gap-[2px]">
            <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/40" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/20" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/40" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/60" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/90" />
          </div>
          <span className="text-[10px] text-muted-foreground">Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}
