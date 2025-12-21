import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/tooltipContent";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("rankeia-theme");
    if (stored === "light") {
      setIsDark(false);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add("light");
      localStorage.setItem("rankeia-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("rankeia-theme", "dark");
    }
    setIsDark(!isDark);
  };

  return (
    <TooltipProvider delayDuration={1000}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            className={cn(
              "w-9 h-9 rounded-lg transition-all",
              "hover:bg-primary/10 hover:text-primary"
            )}
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="glass max-w-[280px]">
          <p className="font-medium mb-1">{isDark ? "Tema Claro" : "Tema Escuro"}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{TOOLTIP_CONTENT.actions.themeToggle}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
