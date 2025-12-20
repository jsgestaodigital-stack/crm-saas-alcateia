import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

interface CrossAnalysisChartProps {
  title: string;
  description?: string;
  type: "composed" | "scatter";
  data: any[];
  barKey?: string;
  lineKey?: string;
  xKey: string;
  yKey?: string;
  zKey?: string;
  barColor?: string;
  lineColor?: string;
}

export const CrossAnalysisChart = ({
  title,
  description,
  type,
  data,
  barKey,
  lineKey,
  xKey,
  yKey,
  zKey,
  barColor = "hsl(var(--primary))",
  lineColor = "#f59e0b",
}: CrossAnalysisChartProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Dados insuficientes para análise
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {type === "composed" ? (
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={xKey} className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {barKey && (
                  <Bar
                    yAxisId="left"
                    dataKey={barKey}
                    fill={barColor}
                    radius={[4, 4, 0, 0]}
                    name={barKey}
                  />
                )}
                {lineKey && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={lineKey}
                    stroke={lineColor}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={lineKey}
                  />
                )}
              </ComposedChart>
            ) : (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={xKey} className="text-xs" name={xKey} />
                <YAxis dataKey={yKey} className="text-xs" name={yKey} />
                {zKey && <ZAxis dataKey={zKey} range={[60, 400]} name={zKey} />}
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Scatter data={data} fill={barColor} />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
