import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import alcateiaLogo from "@/assets/alcateia-logo.png";
import { supabase } from "@/integrations/supabase/client";
const loginSchema = z.object({
  email: z.string().trim().email({
    message: "E-mail inválido"
  }),
  password: z.string().trim().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres"
  })
});
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const {
    signIn,
    user,
    isLoading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [authLoading, user, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse({
      email,
      password
    });
    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
      } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("E-mail não confirmado. Verifique sua caixa de entrada.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={alcateiaLogo} alt="Alcateia Lobos do Google" className="h-24 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground">Plataforma Operacional Alcateia</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">Gestão de clientes, processos e execução diária — tudo em um só lugar.</p>
        </div>

        <div className="bg-surface-2 border border-border/50 rounded-xl p-6 neon-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 bg-background border-border/50 focus:border-primary" disabled={isLoading} />
              </div>
              {errors.email && <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 bg-background border-border/50 focus:border-primary" disabled={isLoading} />
              </div>
              {errors.password && <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>}
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow" disabled={isLoading}>
              {isLoading ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </> : <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </>}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">Acesso restrito a usuários convidados.</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Alcateia Lobos do Google. Todos os direitos reservados.
        </p>
      </div>
    </div>;
}