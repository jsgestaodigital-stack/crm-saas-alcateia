import { useState } from "react";
import { Mail, Copy, Check, Loader2, Link as LinkIcon } from "lucide-react";
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
import { toast } from "sonner";
import { useInvites } from "@/hooks/useInvites";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

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

interface InviteMemberModalProps {
  trigger?: React.ReactNode;
}

export default function InviteMemberModal({ trigger }: InviteMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("operador");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { createInvite } = useInvites();

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Digite o email do convidado");
      return;
    }

    try {
      const invite = await createInvite.mutateAsync({ email, role });
      const link = `${window.location.origin}/convite/${invite.token}`;
      setGeneratedLink(link);
    } catch {
      // Error handled by mutation
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAndClose = () => {
    setEmail("");
    setRole("operador");
    setGeneratedLink(null);
    setCopied(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Convidar por email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar novo membro</DialogTitle>
          <DialogDescription>
            {generatedLink
              ? "Compartilhe o link abaixo com a pessoa que deseja convidar"
              : "Digite o email da pessoa que deseja convidar para sua equipe"}
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Função</Label>
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
                <p className="text-xs text-muted-foreground">
                  A pessoa receberá essa função ao aceitar o convite
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createInvite.isPending}>
                {createInvite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Gerar link de convite
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Link de convite</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button size="icon" variant="outline" onClick={copyLink}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Email: <strong>{email}</strong></p>
                <p>• Função: <strong>{roleLabels[role]}</strong></p>
                <p>• Validade: <strong>7 dias</strong></p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={resetAndClose}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
