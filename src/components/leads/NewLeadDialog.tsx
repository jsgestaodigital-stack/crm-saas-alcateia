import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useLeads, useLeadSources } from '@/hooks/useLeads';
import { useLeadDuplicates } from '@/hooks/useLeadDuplicates';
import { LeadTemperature, TEMPERATURE_CONFIG } from '@/types/lead';
import { 
  leadFormSchema, 
  formatPhoneNumber, 
  validateBrazilianPhone, 
  formatInstagram,
  validateEmail,
  LeadFormData 
} from '@/lib/leadValidation';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Tag, 
  Plus, 
  Instagram, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationState {
  whatsapp: { valid: boolean; message?: string };
  email: { valid: boolean; message?: string };
  instagram: { valid: boolean; message?: string };
}

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const { createLead } = useLeads();
  const { sources, addSource } = useLeadSources();
  const { duplicates, isChecking, checkDuplicates, clearDuplicates } = useLeadDuplicates();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSourceInput, setNewSourceInput] = useState('');
  const [showNewSource, setShowNewSource] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [validation, setValidation] = useState<ValidationState>({
    whatsapp: { valid: true },
    email: { valid: true },
    instagram: { valid: true },
  });

  const initialFormData: LeadFormData = {
    company_name: '',
    contact_name: '',
    whatsapp: '',
    email: '',
    instagram: '',
    city: '',
    main_category: '',
    source_id: '',
    temperature: 'cold',
    next_action: '',
    notes: '',
  };

  const [formData, setFormData] = useState<LeadFormData>(initialFormData);

  // Check if form has unsaved changes (dirty state)
  const isDirty = useMemo(() => {
    return Object.keys(formData).some(key => {
      const k = key as keyof LeadFormData;
      return formData[k] !== initialFormData[k];
    });
  }, [formData]);

  // Warn before closing with unsaved changes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isDirty) {
      const confirmClose = window.confirm(
        'Você tem alterações não salvas. Deseja realmente fechar e perder os dados?'
      );
      if (!confirmClose) return;
    }
    onOpenChange(newOpen);
  }, [isDirty, onOpenChange]);

  // Warn before page unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && open) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, open]);

  // Debounced duplicate check
  const debouncedCheckDuplicates = useCallback(
    debounce((data: { company_name: string; whatsapp?: string; email?: string; instagram?: string }) => {
      checkDuplicates(data);
    }, 500),
    [checkDuplicates]
  );

  // Run duplicate check when relevant fields change
  useEffect(() => {
    if (formData.company_name.length >= 2 || formData.whatsapp || formData.email || formData.instagram) {
      debouncedCheckDuplicates({
        company_name: formData.company_name,
        whatsapp: formData.whatsapp,
        email: formData.email,
        instagram: formData.instagram,
      });
    } else {
      clearDuplicates();
    }
  }, [formData.company_name, formData.whatsapp, formData.email, formData.instagram, debouncedCheckDuplicates, clearDuplicates]);

  // Validate phone number
  const handleWhatsappChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, whatsapp: formatted }));
    
    if (value.length >= 10) {
      const result = validateBrazilianPhone(value);
      setValidation(prev => ({ ...prev, whatsapp: result }));
    } else {
      setValidation(prev => ({ ...prev, whatsapp: { valid: true } }));
    }
  };

  // Validate email
  const handleEmailChange = (value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
    
    if (value.length >= 5) {
      const result = validateEmail(value);
      setValidation(prev => ({ ...prev, email: result }));
    } else {
      setValidation(prev => ({ ...prev, email: { valid: true } }));
    }
  };

  // Format instagram
  const handleInstagramChange = (value: string) => {
    // Remove @ if typed, we'll add it on blur
    const cleaned = value.replace(/^@/, '');
    setFormData(prev => ({ ...prev, instagram: cleaned }));
    
    // Validate
    if (cleaned.length > 0) {
      const isValid = /^[a-zA-Z0-9._]{1,30}$/.test(cleaned);
      setValidation(prev => ({ 
        ...prev, 
        instagram: { 
          valid: isValid, 
          message: isValid ? undefined : 'Usuário inválido' 
        } 
      }));
    } else {
      setValidation(prev => ({ ...prev, instagram: { valid: true } }));
    }
  };

  const handleInstagramBlur = () => {
    if (formData.instagram) {
      setFormData(prev => ({ ...prev, instagram: formatInstagram(prev.instagram || '') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const result = leadFormSchema.safeParse(formData);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    // Check for validation errors
    if (!validation.whatsapp.valid || !validation.email.valid || !validation.instagram.valid) {
      toast.error('Por favor, corrija os dados inválidos');
      return;
    }

    // Warn about duplicates but allow creation
    if (duplicates.length > 0) {
      const exactMatch = duplicates.find(d => d.similarity === 1);
      if (exactMatch) {
        const confirmCreate = window.confirm(
          `Já existe um lead com dados idênticos: "${exactMatch.company_name}"\n\nDeseja criar mesmo assim?`
        );
        if (!confirmCreate) return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const lead = await createLead({
        ...formData,
        instagram: formData.instagram ? formatInstagram(formData.instagram) : undefined,
      });

      if (lead) {
        resetForm();
        onOpenChange(false);
        toast.success('Lead criado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao criar lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_name: '',
      whatsapp: '',
      email: '',
      instagram: '',
      city: '',
      main_category: '',
      source_id: '',
      temperature: 'cold',
      next_action: '',
      notes: '',
    });
    setFormErrors({});
    setValidation({
      whatsapp: { valid: true },
      email: { valid: true },
      instagram: { valid: true },
    });
    clearDuplicates();
  };

  const handleAddSource = async () => {
    if (!newSourceInput.trim()) return;
    const source = await addSource(newSourceInput.trim());
    if (source) {
      setFormData(prev => ({ ...prev, source_id: source.id }));
      setNewSourceInput('');
      setShowNewSource(false);
    }
  };

  const getMatchTypeBadge = (matchType: string) => {
    switch (matchType) {
      case 'phone':
        return <Badge variant="destructive" className="text-xs">Mesmo telefone</Badge>;
      case 'email':
        return <Badge variant="destructive" className="text-xs">Mesmo e-mail</Badge>;
      case 'instagram':
        return <Badge variant="destructive" className="text-xs">Mesmo Instagram</Badge>;
      case 'exact':
        return <Badge variant="destructive" className="text-xs">Nome idêntico</Badge>;
      case 'similar':
        return <Badge variant="secondary" className="text-xs">Nome similar</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value && isDirty) {
        const confirmClose = window.confirm(
          'Você tem alterações não salvas. Deseja realmente fechar e perder os dados?'
        );
        if (!confirmClose) return;
      }
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Novo Lead
          </DialogTitle>
        </DialogHeader>

        {/* Duplicate Warning */}
        {duplicates.length > 0 && (
          <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-orange-500">
              Possíveis duplicatas encontradas ({duplicates.length})
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              {duplicates.slice(0, 3).map((dup) => (
                <div key={dup.id} className="flex items-center justify-between gap-2 text-sm p-2 rounded bg-background/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{dup.company_name}</span>
                  </div>
                  {getMatchTypeBadge(dup.matchType)}
                </div>
              ))}
              {duplicates.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  + {duplicates.length - 3} outros possíveis duplicados
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <Label className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Nome do Negócio *
            </Label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Ex: Restaurante Bom Sabor, Clínica Exemplo"
              className={`mt-1 ${formErrors.company_name ? 'border-red-500' : ''}`}
              autoFocus
              required
              aria-required="true"
            />
            {formErrors.company_name && (
              <p className="text-xs text-red-500 mt-1">{formErrors.company_name}</p>
            )}
            {isChecking && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando duplicatas...
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Contact Name */}
            <div>
              <Label className="flex items-center gap-1">
                <User className="h-3 w-3" /> Contato
              </Label>
              <Input
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Nome do responsável pelo negócio"
                className="mt-1"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <Label className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> WhatsApp
                {validation.whatsapp.valid && formData.whatsapp && formData.whatsapp.length >= 10 && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {!validation.whatsapp.valid && (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                placeholder="(00) 00000-0000"
                className={`mt-1 ${!validation.whatsapp.valid ? 'border-red-500' : ''}`}
              />
              {!validation.whatsapp.valid && validation.whatsapp.message && (
                <p className="text-xs text-red-500 mt-1">{validation.whatsapp.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Email */}
            <div>
              <Label className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-mail
                {validation.email.valid && formData.email && formData.email.length >= 5 && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {!validation.email.valid && (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="email@exemplo.com"
                className={`mt-1 ${!validation.email.valid ? 'border-red-500' : ''}`}
              />
              {!validation.email.valid && validation.email.message && (
                <p className="text-xs text-red-500 mt-1">{validation.email.message}</p>
              )}
            </div>

            {/* Instagram */}
            <div>
              <Label className="flex items-center gap-1">
                <Instagram className="h-3 w-3" /> Instagram
                {validation.instagram.valid && formData.instagram && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                {!validation.instagram.valid && (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </Label>
              <Input
                value={formData.instagram}
                onChange={(e) => handleInstagramChange(e.target.value)}
                onBlur={handleInstagramBlur}
                placeholder="@usuario"
                className={`mt-1 ${!validation.instagram.valid ? 'border-red-500' : ''}`}
              />
              {!validation.instagram.valid && validation.instagram.message && (
                <p className="text-xs text-red-500 mt-1">{validation.instagram.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Cidade
              </Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ex: São Paulo, Campinas"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Tag className="h-3 w-3" /> Nicho / Segmento
              </Label>
              <Input
                value={formData.main_category}
                onChange={(e) => setFormData(prev => ({ ...prev, main_category: e.target.value }))}
                placeholder="Ex: Dentista, Restaurante, Advogado"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Source */}
            <div>
              <Label>Origem</Label>
              {showNewSource ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newSourceInput}
                    onChange={(e) => setNewSourceInput(e.target.value)}
                    placeholder="Nova origem..."
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddSource}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Select 
                    value={formData.source_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, source_id: v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowNewSource(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Temperature */}
            <div>
              <Label>Temperatura</Label>
              <Select 
                value={formData.temperature} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, temperature: v as LeadTemperature }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPERATURE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.emoji} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Next Action */}
          <div>
            <Label>Próxima Ação</Label>
            <Input
              value={formData.next_action}
              onChange={(e) => setFormData(prev => ({ ...prev, next_action: e.target.value }))}
              placeholder="O que fazer primeiro?"
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Informações adicionais..."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!formData.company_name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
