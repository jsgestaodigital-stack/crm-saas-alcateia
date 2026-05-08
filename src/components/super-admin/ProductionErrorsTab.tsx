import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductionError {
  id: string;
  error_type: string;
  error_message: string;
  component: string | null;
  user_id: string | null;
  agency_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function ProductionErrorsTab() {
  const [rows, setRows] = useState<ProductionError[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("production_errors" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) setRows(data as unknown as ProductionError[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchRows();
  }, []);

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.error_type))).sort(),
    [rows],
  );

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && r.error_type !== typeFilter) return false;
    if (dateFilter && !r.created_at.startsWith(dateFilter)) return false;
    return true;
  });

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          Erros de Produção
          <Badge variant="secondary" className="ml-2">
            {filtered.length}
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[160px] h-9"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void fetchRows()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {loading ? "Carregando..." : "Nenhum erro registrado no período."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-border/40 bg-surface-2/40 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                    <Badge variant="destructive" className="text-xs">
                      {r.error_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="font-medium text-foreground break-words">
                    {r.error_message}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {r.component && <span>Componente: {r.component}</span>}
                    {r.user_id && (
                      <span>User: {r.user_id.slice(0, 8)}…</span>
                    )}
                    {r.agency_id && (
                      <span>Agência: {r.agency_id.slice(0, 8)}…</span>
                    )}
                  </div>
                  {r.metadata && Object.keys(r.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Metadata
                      </summary>
                      <pre className="text-[10px] mt-1 p-2 rounded bg-background/50 overflow-x-auto">
                        {JSON.stringify(r.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
