import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  alcateia_member: boolean | null;
  alcateia_member_since: string | null;
}

export function AlcateiaMembersTab() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, alcateia_member, alcateia_member_since")
      .order("alcateia_member", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Não foi possível carregar usuários.");
    } else {
      setRows((data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (row: ProfileRow, next: boolean) => {
    setUpdatingId(row.id);
    const { error } = await supabase.rpc("set_alcateia_member", {
      target_user_id: row.id,
      new_value: next,
    });
    setUpdatingId(null);
    if (error) {
      toast.error("Erro ao atualizar acesso Alcateia.");
      return;
    }
    const patch: Partial<ProfileRow> = next
      ? { alcateia_member: true, alcateia_member_since: new Date().toISOString() }
      : { alcateia_member: false, alcateia_member_since: null };
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, ...patch } : r)));
    toast.success(next ? "Acesso Alcateia ativado." : "Acesso Alcateia removido.");
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (r.full_name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q);
  });

  const activeCount = rows.filter(r => r.alcateia_member).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Membros da Alcateia</CardTitle>
          <p className="text-sm text-muted-foreground">
            {activeCount} usuário(s) com acesso Alcateia (limites do plano Lobão).
          </p>
        </div>
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="text-right">Membro Alcateia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.email || "—"}</TableCell>
                  <TableCell>
                    {row.alcateia_member && row.alcateia_member_since
                      ? format(new Date(row.alcateia_member_since), "dd/MM/yyyy")
                      : <Badge variant="outline">—</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={!!row.alcateia_member}
                      disabled={updatingId === row.id}
                      onCheckedChange={(v) => toggle(row, v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
