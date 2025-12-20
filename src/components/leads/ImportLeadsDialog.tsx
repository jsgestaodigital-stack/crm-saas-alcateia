import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  X,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

interface ParsedRow {
  [key: string]: string;
}

// Lead fields available for mapping
const LEAD_FIELDS = [
  { key: 'company_name', label: 'Empresa', required: true },
  { key: 'contact_name', label: 'Nome do Contato', required: false },
  { key: 'whatsapp', label: 'WhatsApp', required: false },
  { key: 'phone', label: 'Telefone', required: false },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'city', label: 'Cidade', required: false },
  { key: 'main_category', label: 'Categoria', required: false },
  { key: 'source_custom', label: 'Origem', required: false },
  { key: 'estimated_value', label: 'Valor Estimado', required: false },
  { key: 'notes', label: 'Observações', required: false },
] as const;

type LeadFieldKey = typeof LEAD_FIELDS[number]['key'];

export function ImportLeadsDialog({ open, onOpenChange, onSuccess }: ImportLeadsDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<LeadFieldKey, string | null>>({
    company_name: null,
    contact_name: null,
    whatsapp: null,
    phone: null,
    email: null,
    city: null,
    main_category: null,
    source_custom: null,
    estimated_value: null,
    notes: null,
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const resetDialog = useCallback(() => {
    setStep('upload');
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setFieldMapping({
      company_name: null,
      contact_name: null,
      whatsapp: null,
      phone: null,
      email: null,
      city: null,
      main_category: null,
      source_custom: null,
      estimated_value: null,
      notes: null,
    });
    setImporting(false);
    setImportResult({ success: 0, failed: 0 });
  }, []);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetDialog, 300);
  };

  // Parse CSV file
  const parseCSV = useCallback((text: string): { headers: string[]; rows: ParsedRow[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      if (values.some(v => v)) {
        const row: ParsedRow = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0 || rows.length === 0) {
        toast.error('Arquivo CSV vazio ou inválido');
        return;
      }

      setCsvHeaders(headers);
      setCsvData(rows);

      // Try to auto-map common field names
      const autoMapping: Record<LeadFieldKey, string | null> = { ...fieldMapping };
      
      const commonMappings: Record<string, LeadFieldKey> = {
        'empresa': 'company_name',
        'nome da empresa': 'company_name',
        'company': 'company_name',
        'company_name': 'company_name',
        'nome': 'contact_name',
        'contato': 'contact_name',
        'contact': 'contact_name',
        'contact_name': 'contact_name',
        'whatsapp': 'whatsapp',
        'zap': 'whatsapp',
        'telefone': 'phone',
        'phone': 'phone',
        'tel': 'phone',
        'email': 'email',
        'e-mail': 'email',
        'cidade': 'city',
        'city': 'city',
        'categoria': 'main_category',
        'category': 'main_category',
        'segmento': 'main_category',
        'origem': 'source_custom',
        'source': 'source_custom',
        'fonte': 'source_custom',
        'valor': 'estimated_value',
        'value': 'estimated_value',
        'notas': 'notes',
        'notes': 'notes',
        'observações': 'notes',
        'observacoes': 'notes',
      };

      headers.forEach(header => {
        const normalized = header.toLowerCase().trim();
        const field = commonMappings[normalized];
        if (field && !autoMapping[field]) {
          autoMapping[field] = header;
        }
      });

      setFieldMapping(autoMapping);
      setStep('mapping');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Erro ao processar arquivo CSV');
    }
  };

  const handleMappingChange = (field: LeadFieldKey, csvColumn: string | null) => {
    setFieldMapping(prev => ({ ...prev, [field]: csvColumn }));
  };

  // Check if required fields are mapped
  const isMappingValid = useMemo(() => {
    return LEAD_FIELDS
      .filter(f => f.required)
      .every(f => fieldMapping[f.key]);
  }, [fieldMapping]);

  // Preview data with mapping applied
  const previewData = useMemo(() => {
    return csvData.slice(0, 10).map(row => {
      const mapped: Record<string, string> = {};
      LEAD_FIELDS.forEach(field => {
        const csvColumn = fieldMapping[field.key];
        mapped[field.key] = csvColumn ? row[csvColumn] || '' : '';
      });
      return mapped;
    });
  }, [csvData, fieldMapping]);

  // Import leads
  const handleImport = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setStep('importing');
    setImporting(true);

    let successCount = 0;
    let failedCount = 0;

    // Process in batches of 50
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < csvData.length; i += batchSize) {
      batches.push(csvData.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const leadsToInsert = batch
        .map(row => {
          const companyNameCol = fieldMapping.company_name;
          const companyName = companyNameCol ? row[companyNameCol]?.trim() : '';
          
          if (!companyName) return null;

          const getValue = (key: LeadFieldKey): string | null => {
            const col = fieldMapping[key];
            return col ? row[col]?.trim() || null : null;
          };

          const estimatedValueStr = getValue('estimated_value');
          let estimatedValue: number | null = null;
          if (estimatedValueStr) {
            const cleanedValue = estimatedValueStr.replace(/[R$\s.]/g, '').replace(',', '.');
            estimatedValue = parseFloat(cleanedValue) || null;
          }

          return {
            company_name: companyName,
            contact_name: getValue('contact_name'),
            whatsapp: getValue('whatsapp'),
            phone: getValue('phone'),
            email: getValue('email'),
            city: getValue('city'),
            main_category: getValue('main_category'),
            source_custom: getValue('source_custom'),
            estimated_value: estimatedValue,
            notes: getValue('notes'),
            pipeline_stage: 'cold' as const,
            temperature: 'cold' as const,
            probability: 0,
            created_by: user.id,
            responsible: user.user_metadata?.full_name || user.email || 'Usuário',
          };
        })
        .filter((lead): lead is NonNullable<typeof lead> => lead !== null);

      if (leadsToInsert.length === 0) continue;

      try {
        const { error } = await supabase
          .from('leads')
          .insert(leadsToInsert);

        if (error) {
          console.error('Batch insert error:', error);
          failedCount += leadsToInsert.length;
        } else {
          successCount += leadsToInsert.length;
        }
      } catch (error) {
        console.error('Batch insert exception:', error);
        failedCount += leadsToInsert.length;
      }
    }

    setImportResult({ success: successCount, failed: failedCount });
    setStep('complete');
    setImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} leads importados com sucesso!`);
      onSuccess?.();
    }
  };

  const downloadTemplate = () => {
    const headers = LEAD_FIELDS.map(f => f.label).join(';');
    const exampleRow = 'Empresa Exemplo;João Silva;11999999999;1133333333;joao@empresa.com;São Paulo;Restaurante;Google Maps;5000;Interessado em marketing';
    const csvContent = `${headers}\n${exampleRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_leads.csv';
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-500" />
            Importar Leads
          </DialogTitle>
          <DialogDescription>
            Importe leads de um arquivo CSV (listas compradas, extraídas do Google Maps, etc.)
          </DialogDescription>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="flex items-center gap-2 py-4 border-b border-border/30">
          {[
            { key: 'upload', label: 'Upload' },
            { key: 'mapping', label: 'Mapeamento' },
            { key: 'preview', label: 'Preview' },
            { key: 'complete', label: 'Concluído' },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s.key || arr.findIndex(x => x.key === step) > i
                    ? "bg-amber-500 text-black"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              <span className={cn(
                "text-sm",
                step === s.key ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
              {i < arr.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-hidden py-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 w-full max-w-lg text-center",
                  "hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors cursor-pointer",
                  file ? "border-amber-500 bg-amber-500/10" : "border-border/50"
                )}
                onClick={() => document.getElementById('csv-input')?.click()}
              >
                <Input
                  id="csv-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <>
                    <FileSpreadsheet className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar outro arquivo
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium text-foreground mb-1">
                      Arraste ou clique para selecionar
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Arquivo CSV (separado por vírgula ou ponto-e-vírgula)
                    </p>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar modelo de importação
              </Button>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                <Badge variant="outline" className="mr-2">{csvData.length}</Badge>
                linhas encontradas no arquivo. Mapeie as colunas do CSV para os campos do lead:
              </div>

              <ScrollArea className="h-[350px]">
                <div className="space-y-3 pr-4">
                  {LEAD_FIELDS.map((field) => (
                    <div 
                      key={field.key}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/30"
                    >
                      <div className="w-40 flex items-center gap-2">
                        <span className="font-medium text-sm">{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-[10px] px-1">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      
                      <Select
                        value={fieldMapping[field.key] || 'none'}
                        onValueChange={(val) => handleMappingChange(field.key, val === 'none' ? null : val)}
                      >
                        <SelectTrigger className="w-60">
                          <SelectValue placeholder="Selecione uma coluna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Não mapear</span>
                          </SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {fieldMapping[field.key] && csvData[0] && (
                        <div className="flex-1 text-xs text-muted-foreground truncate">
                          Ex: "{csvData[0][fieldMapping[field.key]!] || '-'}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Preview dos primeiros 10 leads que serão importados:
              </div>

              <ScrollArea className="h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      {LEAD_FIELDS.filter(f => fieldMapping[f.key]).map((field) => (
                        <TableHead key={field.key}>{field.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        {LEAD_FIELDS.filter(f => fieldMapping[f.key]).map((field) => (
                          <TableCell key={field.key} className="max-w-[200px] truncate">
                            {row[field.key] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-blue-400">
                  Total de <strong>{csvData.length}</strong> leads serão importados
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-lg font-medium">Importando leads...</p>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
              <div className="text-center">
                <p className="text-xl font-semibold mb-2">Importação concluída!</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="text-green-400">
                    ✓ {importResult.success} importados
                  </span>
                  {importResult.failed > 0 && (
                    <span className="text-red-400">
                      ✗ {importResult.failed} falharam
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/30 pt-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!isMappingValid}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                Continuar
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                Importar {csvData.length} leads
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button
              onClick={handleClose}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
