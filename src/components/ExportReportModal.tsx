import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Download, Lock, AlertTriangle } from "lucide-react";
import { useAuth, DerivedPermissions } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type ExportFormat = "pdf" | "csv";

export type ExportModule = "sales" | "ops" | "recurrence" | "all";

export interface ExportConfig {
  format: ExportFormat;
  modules: ExportModule[];
  range: { startDate: Date; endDate: Date };
}

interface ModuleConfig {
  id: ExportModule;
  label: string;
  permissionKey: keyof DerivedPermissions;
  isAll?: boolean;
}

const MODULES: ModuleConfig[] = [
  { id: "sales", label: "Vendas", permissionKey: "canSalesOrAdmin" },
  { id: "ops", label: "Operacional", permissionKey: "canOpsOrAdmin" },
  { id: "recurrence", label: "Recorrência", permissionKey: "canRecurringOrAdmin" },
];

const STORAGE_KEY = "rankeia_export_modules";

interface ExportReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: ExportFormat;
  startDate: Date;
  endDate: Date;
  onExport: (config: ExportConfig) => void;
}

export function ExportReportModal({
  open,
  onOpenChange,
  format,
  startDate,
  endDate,
  onExport,
}: ExportReportModalProps) {
  const { user, derived } = useAuth();
  
  const [selectedModules, setSelectedModules] = useState<ExportModule[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Check if user has permission for a module
  const hasPermission = (moduleId: ExportModule): boolean => {
    const config = MODULES.find((m) => m.id === moduleId);
    if (!config) return false;
    return derived[config.permissionKey] ?? false;
  };

  // Get all permitted modules
  const getPermittedModules = (): ExportModule[] => {
    return MODULES.filter((m) => hasPermission(m.id)).map((m) => m.id);
  };

  // Get initial selection from localStorage
  const getInitialSelection = useCallback((): { modules: ExportModule[]; isAll: boolean } => {
    try {
      const storageKey = user?.id ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isAll) {
          return { modules: [], isAll: true };
        }
        // Filter only modules user has access to
        const validModules = (parsed.modules as ExportModule[]).filter((m) => 
          m !== "all" && hasPermission(m)
        );
        return { modules: validModules, isAll: false };
      }
    } catch {
      // Ignore parse errors
    }
    // Default: "Todos" selected
    return { modules: [], isAll: true };
  }, [user?.id]);

  // Initialize selection when modal opens
  useEffect(() => {
    if (open) {
      const initial = getInitialSelection();
      setSelectedModules(initial.modules);
      setSelectAll(initial.isAll);
    }
  }, [open, getInitialSelection]);

  // Save selection to localStorage
  const saveSelection = (modules: ExportModule[], isAll: boolean) => {
    try {
      const storageKey = user?.id ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify({ modules, isAll }));
    } catch {
      // Ignore storage errors
    }
  };

  const toggleModule = (moduleId: ExportModule) => {
    if (!hasPermission(moduleId)) return;
    
    // If selecting a specific module, uncheck "Todos"
    setSelectAll(false);
    
    setSelectedModules((prev) => {
      const newSelection = prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId];
      saveSelection(newSelection, false);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    if (newValue) {
      // When selecting "Todos", clear individual selections
      setSelectedModules([]);
    }
    saveSelection([], newValue);
  };

  const handleExport = () => {
    const permittedModules = getPermittedModules();
    
    if (permittedModules.length === 0) {
      return; // No modules to export
    }

    let exportModules: ExportModule[];
    
    if (selectAll) {
      // "Todos" = export all permitted modules (actual IDs, not "all")
      exportModules = permittedModules;
    } else if (selectedModules.length > 0) {
      exportModules = selectedModules;
    } else {
      return; // Nothing selected
    }
    
    onExport({
      format,
      modules: exportModules,
      range: { startDate, endDate },
    });
    onOpenChange(false);
  };

  const permittedModules = getPermittedModules();
  const hasAnyPermission = permittedModules.length > 0;
  const hasSelection = selectAll || selectedModules.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md no-print">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format === "pdf" ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            Exportar Relatório ({format.toUpperCase()})
          </DialogTitle>
          <DialogDescription>
            Selecione os módulos que deseja incluir na exportação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning if no permissions */}
          {!hasAnyPermission && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissão para exportar nenhum módulo.
              </AlertDescription>
            </Alert>
          )}

          {/* Module checklist */}
          <div className="space-y-3">
            <TooltipProvider>
              {/* Individual modules */}
              {MODULES.map((module) => {
                const hasAccess = hasPermission(module.id);
                const isSelected = selectedModules.includes(module.id);

                return (
                  <div
                    key={module.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      hasAccess
                        ? isSelected
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted/30 border-border hover:bg-muted/50"
                        : "bg-muted/20 border-border/50 opacity-60"
                    }`}
                  >
                    {hasAccess ? (
                      <Checkbox
                        id={module.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleModule(module.id)}
                        disabled={selectAll}
                      />
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center w-4 h-4">
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sem permissão para este módulo</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Label
                      htmlFor={module.id}
                      className={`flex-1 cursor-pointer font-medium ${
                        !hasAccess ? "cursor-not-allowed text-muted-foreground" : ""
                      } ${selectAll && hasAccess ? "text-muted-foreground" : ""}`}
                    >
                      {module.label}
                    </Label>
                    {!hasAccess && (
                      <Badge variant="outline" className="text-xs">
                        Restrito
                      </Badge>
                    )}
                  </div>
                );
              })}

              {/* "Todos" option */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  hasAnyPermission
                    ? selectAll
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/30 border-border hover:bg-muted/50"
                    : "bg-muted/20 border-border/50 opacity-60"
                }`}
              >
                {hasAnyPermission ? (
                  <Checkbox
                    id="all"
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center w-4 h-4">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sem permissão para nenhum módulo</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Label
                  htmlFor="all"
                  className={`flex-1 cursor-pointer font-medium ${
                    !hasAnyPermission ? "cursor-not-allowed text-muted-foreground" : ""
                  }`}
                >
                  Todos
                </Label>
                {hasAnyPermission && (
                  <Badge variant="secondary" className="text-xs">
                    {permittedModules.length} módulo{permittedModules.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </TooltipProvider>
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            {selectAll 
              ? `"Todos" inclui: ${permittedModules.map(m => MODULES.find(mod => mod.id === m)?.label).join(", ") || "nenhum"}`
              : "Selecione os módulos ou escolha \"Todos\" para exportar tudo permitido."
            }
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={!hasSelection || !hasAnyPermission}
            className="gap-2"
          >
            {format === "pdf" ? (
              <FileText className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
