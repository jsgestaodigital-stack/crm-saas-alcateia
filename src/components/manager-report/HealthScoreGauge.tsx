import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthScoreGaugeProps {
  title: string;
  description?: string;
  score: number; // 0-100
  label?: string;
}

export const HealthScoreGauge = ({ title, description, score, label }: HealthScoreGaugeProps) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  const getColor = () => {
    if (normalizedScore >= 80) return { bg: "bg-emerald-500", text: "text-emerald-500" };
    if (normalizedScore >= 60) return { bg: "bg-lime-500", text: "text-lime-500" };
    if (normalizedScore >= 40) return { bg: "bg-amber-500", text: "text-amber-500" };
    if (normalizedScore >= 20) return { bg: "bg-orange-500", text: "text-orange-500" };
    return { bg: "bg-red-500", text: "text-red-500" };
  };

  const getStatus = () => {
    if (normalizedScore >= 80) return "Excelente";
    if (normalizedScore >= 60) return "Bom";
    if (normalizedScore >= 40) return "Regular";
    if (normalizedScore >= 20) return "Atenção";
    return "Crítico";
  };

  const color = getColor();
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn("transition-all duration-1000 ease-out", color.text)}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", color.text)}>
              {normalizedScore}
            </span>
            <span className="text-xs text-muted-foreground">pontos</span>
          </div>
        </div>
        
        <div className={cn(
          "mt-3 px-4 py-1.5 rounded-full text-sm font-semibold",
          color.bg,
          "text-white"
        )}>
          {label || getStatus()}
        </div>
      </CardContent>
    </Card>
  );
};
