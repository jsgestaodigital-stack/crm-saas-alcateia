import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Filter, ChevronDown, X, RotateCcw } from "lucide-react";

export interface FilterField {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "toggle";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string;
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset?: () => void;
  className?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}

export function AdvancedFilters({
  fields,
  values,
  onChange,
  onReset,
  className,
  defaultOpen = false,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const activeFiltersCount = Object.values(values).filter(v => v && v !== "all").length;

  const handleChange = (fieldId: string, value: string) => {
    onChange({ ...values, [fieldId]: value });
  };

  const handleReset = () => {
    const empty: FilterValues = {};
    fields.forEach(f => { empty[f.id] = ""; });
    onChange(empty);
    onReset?.();
  };

  const handleRemoveFilter = (fieldId: string) => {
    onChange({ ...values, [fieldId]: "" });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>

        {/* Active filter pills */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {fields
              .filter(f => values[f.id] && values[f.id] !== "all")
              .map(f => {
                const displayVal = f.type === "select"
                  ? f.options?.find(o => o.value === values[f.id])?.label || values[f.id]
                  : values[f.id];
                return (
                  <Badge
                    key={f.id}
                    variant="secondary"
                    className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                    onClick={() => handleRemoveFilter(f.id)}
                  >
                    {f.label}: {displayVal}
                    <X className="h-3 w-3" />
                  </Badge>
                );
              })}
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 px-2 text-xs gap-1">
              <RotateCcw className="h-3 w-3" />
              Limpar
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent className="pt-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 p-3 rounded-lg border border-border/50 bg-muted/30">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
              
              {field.type === "text" && (
                <Input
                  value={values[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Filtrar por ${field.label.toLowerCase()}`}
                  className="h-8 text-sm"
                />
              )}

              {field.type === "select" && field.options && (
                <Select
                  value={values[field.id] || "all"}
                  onValueChange={(v) => handleChange(field.id, v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={`Todos`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === "date" && (
                <Input
                  type="date"
                  value={values[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="h-8 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
