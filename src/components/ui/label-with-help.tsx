import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LabelWithHelpProps extends React.ComponentProps<typeof Label> {
  help: string;
  iconClassName?: string;
}

/**
 * Label acessível com ícone de ajuda e tooltip explicativo.
 * Padrão para campos cujo significado não é óbvio sem contexto.
 */
export function LabelWithHelp({
  children,
  help,
  className,
  iconClassName,
  ...props
}: LabelWithHelpProps) {
  return (
    <Label className={cn("inline-flex items-center gap-1.5", className)} {...props}>
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Mais informações"
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors",
              iconClassName,
            )}
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {help}
        </TooltipContent>
      </Tooltip>
    </Label>
  );
}
