import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Loader2, Plus } from "lucide-react";

interface CreateAgencyModalProps {
  onSuccess?: () => void;
}

export function CreateAgencyModal({ onSuccess }: CreateAgencyModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const queryClient = useQueryClient();

  const createAgency = useMutation({
    mutationFn: async () => {
      // First, create the owner user
      const { data: userData, error: userError } = await supabase.functions.invoke(
        "create-agency-owner",
        {
          body: {
            agencyName: name.trim(),
            agencySlug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            email: ownerEmail.trim(),
            password: ownerPassword || undefined,
            ownerName: ownerName.trim(),
          },
        }
      );

      if (userError) throw new Error(userError.message);
      if (userData?.error) throw new Error(userData.error);

      return userData;
    },
    onSuccess: (data) => {
      toast.success("Agência criada com sucesso!", {
        description: `Owner: ${data.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ["super-admin-agencies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-logs"] });
      resetForm();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao criar agência", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setOwnerEmail("");
    setOwnerName("");
    setOwnerPassword("");
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const isValid = name.trim().length >= 2 && 
                  slug.trim().length >= 2 && 
                  ownerEmail.includes("@") &&
                  ownerName.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Agência
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Criar Nova Agência
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova agência e seu usuário owner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agency-name">Nome da Agência *</Label>
            <Input
              id="agency-name"
              placeholder="Ex: Marketing Pro"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-slug">Slug (URL) *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="agency-slug"
                placeholder="marketing-pro"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-3">Dados do Owner</p>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="owner-name">Nome do Owner *</Label>
                <Input
                  id="owner-name"
                  placeholder="Nome completo"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-email">Email do Owner *</Label>
                <Input
                  id="owner-email"
                  type="email"
                  placeholder="owner@agencia.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-password">Senha (opcional)</Label>
                <Input
                  id="owner-password"
                  type="text"
                  placeholder="Deixe vazio para gerar automaticamente"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se não informada, uma senha aleatória será gerada.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => createAgency.mutate()}
            disabled={!isValid || createAgency.isPending}
          >
            {createAgency.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Agência
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
