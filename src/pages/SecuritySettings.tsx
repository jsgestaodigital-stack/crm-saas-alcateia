import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Monitor, Clock, LogOut, Key, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSecurityCheck } from "@/hooks/useSecurityCheck";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SecuritySettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    isLoading, 
    getLoginHistory, 
    getActiveSessions, 
    invalidateAllSessions, 
    changePassword 
  } = useSecurityCheck();

  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadSecurityData();
  }, [user, navigate]);

  const loadSecurityData = async () => {
    setLoadingData(true);
    const [history, sessions] = await Promise.all([
      getLoginHistory(20),
      getActiveSessions()
    ]);
    setLoginHistory(history);
    setActiveSessions(sessions);
    setLoadingData(false);
  };

  const handleInvalidateSessions = async () => {
    const success = await invalidateAllSessions();
    if (success) {
      toast.success("Todas as sessões foram encerradas. Você será deslogado.");
      setTimeout(() => navigate("/auth"), 2000);
    } else {
      toast.error("Erro ao encerrar sessões");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    const result = await changePassword(newPassword);
    setChangingPassword(false);

    if (result.success) {
      toast.success("Senha alterada! Todas as sessões foram encerradas.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/auth"), 2000);
    } else {
      toast.error(result.error || "Erro ao alterar senha");
    }
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return "Dispositivo desconhecido";
    if (ua.includes("Mobile")) return "📱 Mobile";
    if (ua.includes("Chrome")) return "💻 Chrome";
    if (ua.includes("Firefox")) return "💻 Firefox";
    if (ua.includes("Safari")) return "💻 Safari";
    return "💻 Desktop";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Segurança da Conta</h1>
            <p className="text-muted-foreground">Gerencie a segurança da sua conta</p>
          </div>
        </div>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Ao alterar sua senha, todas as sessões ativas serão encerradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button type="submit" disabled={changingPassword || !newPassword}>
                {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sessões Ativas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Sessões Ativas
              </CardTitle>
              <CardDescription>Dispositivos conectados à sua conta</CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={handleInvalidateSessions} disabled={isLoading}>
              <LogOut className="w-4 h-4 mr-2" />
              Encerrar Todas
            </Button>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma sessão ativa</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Última Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{parseUserAgent(session.user_agent)}</TableCell>
                      <TableCell className="font-mono text-sm">{String(session.ip_address) || "-"}</TableCell>
                      <TableCell>{format(new Date(session.last_activity), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Login
            </CardTitle>
            <CardDescription>Últimos acessos à sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : loginHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum registro de login</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sucesso
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Falhou
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{parseUserAgent(log.user_agent)}</TableCell>
                      <TableCell className="font-mono text-sm">{String(log.ip_address) || "-"}</TableCell>
                      <TableCell>{format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
