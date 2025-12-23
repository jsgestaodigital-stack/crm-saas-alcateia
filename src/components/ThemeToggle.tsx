import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TOOLTIP_CONTENT } from "@/lib/tooltipContent";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check initial state from localStorage or system preference
    const stored = localStorage.getItem("rankeia-theme");
    if (stored) {
      return stored === "dark";
    }
    // Default to dark theme
    return true;
  });

  // Sync DOM with state on mount and when isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem("rankeia-theme", newIsDark ? "dark" : "light");
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
