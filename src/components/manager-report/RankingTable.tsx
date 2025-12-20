import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award } from "lucide-react";

interface RankingItem {
  name: string;
  value: number;
  subtitle?: string;
}

interface RankingTableProps {
  title: string;
  items: RankingItem[];
  valuePrefix?: string;
  valueSuffix?: string;
  maxItems?: number;
  showMedals?: boolean;
}

export const RankingTable = ({
  title,
  items,
  valuePrefix = "",
  valueSuffix = "",
  maxItems = 5,
  showMedals = true,
}: RankingTableProps) => {
  const displayItems = items.slice(0, maxItems);
  const total = items.reduce((acc, item) => acc + item.value, 0);

  const getMedalIcon = (index: number) => {
    if (!showMedals) return null;
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getMedalBg = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 border-yellow-500/30";
    if (index === 1) return "bg-gray-500/10 border-gray-500/30";
    if (index === 2) return "bg-amber-600/10 border-amber-600/30";
    return "bg-muted/30 border-border";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{title}</span>
          <Badge variant="outline">
            {valuePrefix}{total.toLocaleString("pt-BR")}{valueSuffix}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              
              return (
                <div
                  key={item.name}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50",
                    getMedalBg(index)
                  )}
                >
                  {/* Progress background */}
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-lg bg-primary/5 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                  
                  <div className="relative flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getMedalIcon(index) || (
                        <span className="text-sm font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm">
                        {valuePrefix}
                        {item.value.toLocaleString("pt-BR")}
                        {valueSuffix}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
