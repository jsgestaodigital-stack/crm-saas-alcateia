import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FunnelStep {
  name: string;
  value: number;
  color?: string;
}

interface FunnelVisualizationProps {
  title: string;
  steps: FunnelStep[];
  maxValue?: number;
}

const defaultColors = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-lime-500",
  "bg-yellow-500",
  "bg-amber-500",
  "bg-orange-500",
];

export const FunnelVisualization = ({ title, steps, maxValue }: FunnelVisualizationProps) => {
  const max = maxValue || Math.max(...steps.map(s => s.value), 1);
  const total = steps.reduce((acc, s) => acc + s.value, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-2xl font-bold text-primary">{total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const percentage = max > 0 ? (step.value / max) * 100 : 0;
            const colorClass = step.color || defaultColors[index % defaultColors.length];
            
            return (
              <div key={step.name} className="group">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                    {step.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{step.value}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((step.value / total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      colorClass
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
