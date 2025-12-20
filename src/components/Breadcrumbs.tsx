import { ChevronRight, Home } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useClientStore } from "@/stores/clientStore";
import { cn } from "@/lib/utils";

const VIEW_LABELS: Record<string, string> = {
  kanban: "Kanban",
  table: "Tabela",
  checklist: "Execução",
  mytasks: "Minhas Tarefas",
  timeline: "Timeline",
  calendar: "Calendário",
  cards: "Cards",
};

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/admin": "Painel Admin",
  "/auth": "Autenticação",
};

export function Breadcrumbs() {
  const location = useLocation();
  const { viewMode, selectedClient } = useClientStore();

  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; href?: string; current?: boolean }> = [
      { label: "Home", href: "/" },
    ];

    if (location.pathname === "/") {
      crumbs.push({
        label: VIEW_LABELS[viewMode] || "Dashboard",
        current: true,
      });

      if (selectedClient) {
        crumbs[crumbs.length - 1].href = "/";
        crumbs[crumbs.length - 1].current = false;
        crumbs.push({
          label: selectedClient.companyName,
          current: true,
        });
      }
    } else if (location.pathname === "/admin") {
      crumbs.push({
        label: "Painel Admin",
        current: true,
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-1 text-sm animate-fade-in">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
          {crumb.href && !crumb.current ? (
            <Link
              to={crumb.href}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200",
                "text-muted-foreground hover:text-primary hover:bg-primary/5",
                index === 0 && "pl-0"
              )}
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              <span>{crumb.label}</span>
            </Link>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md",
                crumb.current
                  ? "text-foreground font-medium bg-primary/10"
                  : "text-muted-foreground"
              )}
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              <span className="max-w-[150px] truncate">{crumb.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
