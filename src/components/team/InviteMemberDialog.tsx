import { useState, useMemo } from "react";
import { z } from "zod";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface InviteMemberDialogProps {
  onSuccess: () => void;
}

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  operador: "Operador",
  visualizador: "Visualizador",
  super_admin: "Super Admin",
  owner: "Proprietário",
  manager: "Gerente",
  sales_rep: "Vendedor",
  support: "Suporte",
};

export default function InviteMemberDialog({ onSuccess }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("operador");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const emailSchema = useMemo(() => z.string().email("E-mail inválido"), []);
  const nameSchema = useMemo(() => z.string().min(2, "Nome deve ter pelo menos 2 caracteres"), []);
  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(8, "Senha deve ter no mínimo 8 caracteres")
        .regex(/\d/, "Senha deve conter pelo menos 1 número")
        .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/, "Senha deve conter pelo menos 1 símbolo"),
    []
  );

  const handleSubmit = async () => {
    setErrors({});
    const validationErrors: typeof errors = {};

    const nameResult = nameSchema.safeParse(name.trim());
    if (!nameResult.success) validationErrors.name = nameResult.error.errors[0].message;

    const emailResult = emailSchema.safeParse(email.trim());
    if (!emailResult.success) validationErrors.email = emailResult.error.errors[0].message;

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) validationErrors.password = passwordResult.error.errors[0].message;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: email.trim().toLowerCase(),
          password,
          full_name: name.trim(),
          role,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Membro ${name} adicionado com sucesso!`);
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar membro");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("operador");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar novo membro</DialogTitle>
          <DialogDescription>
            Adicione um novo membro à sua equipe. Ele receberá acesso imediato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              placeholder="Nome do membro"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha temporária</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            <p className="text-xs text-muted-foreground">
              Deve conter letras, números e símbolos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels)
                  .filter(([key]) => !["super_admin", "owner"].includes(key))
                  .map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar membro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
