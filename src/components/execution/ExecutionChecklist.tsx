import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, ListFilter, Search, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChecklistSection } from "@/types/client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChecklistItem } from "@/components/checklist/ChecklistItem";
import { getDaysSinceUpdate } from "@/lib/clientUtils";

type ResponsibleFilter = "all" | "João" | "Amanda";

interface ExecutionChecklistProps {
  checklist: ChecklistSection[];
  currentStageIndex: number;
  lastUpdate: string;
  clientId: string;
  clientName: string;
  onToggleItem: (sectionId: string, itemId: string) => void;
  onAttachmentChange: (sectionId: string, itemId: string, url: string) => void;
}

export function ExecutionChecklist({
  checklist,
  currentStageIndex,
  lastUpdate,
  clientId,
  clientName,
  onToggleItem,
  onAttachmentChange,
}: ExecutionChecklistProps) {
  const resolvedCurrentIndex = currentStageIndex >= 0 ? currentStageIndex : Math.max(0, checklist.length - 1);
  const currentSectionId = checklist[resolvedCurrentIndex]?.id;

  const [activeSectionId, setActiveSectionId] = useState<string>(currentSectionId);
  const [responsible, setResponsible] = useState<ResponsibleFilter>("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [query, setQuery] = useState("");
  const [showAllSections, setShowAllSections] = useState(false);

  const daysSinceUpdate = getDaysSinceUpdate(lastUpdate);

  // Auto-scroll to current section on mount
  useEffect(() => {
    setActiveSectionId(currentSectionId);
  }, [currentSectionId]);

  const sections = useMemo(() => {
    return checklist.map((section, idx) => {
      const total = section.items.length;
      const done = section.items.filter((i) => i.completed).length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      const isComplete = done === total;
      const isCurrent = idx === resolvedCurrentIndex;
      return { section, idx, total, done, percent, isComplete, isCurrent };
    });
  }, [checklist, resolvedCurrentIndex]);

  const active = useMemo(() => {
    return sections.find((s) => s.section.id === activeSectionId) ?? sections[resolvedCurrentIndex];
  }, [sections, activeSectionId, resolvedCurrentIndex]);

  const filteredItems = useMemo(() => {
    const base = active.section.items;

    return base
      .filter((item) => {
        if (!showCompleted && item.completed) return false;
        if (responsible !== "all" && item.responsible !== responsible) return false;
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          return item.title.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [active.section.items, responsible, showCompleted, query]);

  // Find next pending item across all sections
  const nextPendingItem = useMemo(() => {
    for (const section of checklist) {
      const pendingItem = section.items.find(item => !item.completed);
      if (pendingItem) {
        return { sectionId: section.id, itemId: pendingItem.id, sectionTitle: section.title, itemTitle: pendingItem.title };
      }
    }
    return null;
  }, [checklist]);

  const handleGoToNextItem = () => {
    if (nextPendingItem) {
      setActiveSectionId(nextPendingItem.sectionId);
    }
  };

  const pendingCount = active.section.items.filter((i) => !i.completed).length;
  const totalPending = checklist.reduce((acc, s) => acc + s.items.filter(i => !i.completed).length, 0);
  const totalCompleted = checklist.reduce((acc, s) => acc + s.items.filter(i => i.completed).length, 0);

  // Show limited sections unless expanded
  const visibleSections = showAllSections ? sections : sections.slice(0, 5);

  return (
    <section className="max-w-6xl mx-auto">
      {/* Compact Header with Next Action */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Checklist de Execução</h2>
            <p className="text-xs text-muted-foreground">
              {totalCompleted}/{totalCompleted + totalPending} concluídas
            </p>
          </div>
          
          {/* Progress Bar Global */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-2 bg-surface-3/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round((totalCompleted / (totalCompleted + totalPending)) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-primary">
              {Math.round((totalCompleted / (totalCompleted + totalPending)) * 100)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Jump to Next */}
          {nextPendingItem && (
            <Button
              size="sm"
              className="h-8 gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
              variant="outline"
              onClick={handleGoToNextItem}
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">Próxima:</span>
              <span className="max-w-[150px] truncate text-xs">{nextPendingItem.itemTitle.slice(0, 30)}...</span>
            </Button>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-surface-1/30 px-3 py-1.5">
            <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
            <Label htmlFor="show-completed" className="text-xs text-muted-foreground cursor-pointer">
              Concluídas
            </Label>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-border/30 bg-surface-1/20 overflow-hidden">
        {/* Compact Filters */}
        <div className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tarefa…"
                className="pl-9 bg-surface-2/40 border-border/30 h-8 text-sm"
              />
            </div>
          </div>

          <ToggleGroup
            type="single"
            value={responsible === "all" ? "all" : responsible === "João" ? "joao" : "amanda"}
            onValueChange={(val) => {
              if (!val) return;
              setResponsible(val === "all" ? "all" : val === "joao" ? "João" : "Amanda");
            }}
            className="justify-start sm:justify-end"
          >
            <ToggleGroupItem value="all" aria-label="Todos" className="text-xs h-8">Todos</ToggleGroupItem>
            <ToggleGroupItem value="joao" aria-label="João" className="text-xs h-8">João</ToggleGroupItem>
            <ToggleGroupItem value="amanda" aria-label="Amanda" className="text-xs h-8">Amanda</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* Compact Stage Navigator */}
          <aside className="border-b lg:border-b-0 lg:border-r border-border/20 bg-surface-2/20">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">ETAPAS</p>
                {daysSinceUpdate >= 3 && (
                  <Badge variant="outline" className="text-[9px] border-status-danger/40 text-status-danger px-1.5 py-0">
                    {daysSinceUpdate}d sem ação
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {visibleSections.map(({ section, idx, done, total, percent, isComplete, isCurrent }) => {
                  const isActive = section.id === active.section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionId(section.id)}
                      className={cn(
                        "w-full text-left rounded-lg border p-2 transition-all",
                        isActive
                          ? "border-primary/40 bg-primary/5"
                          : "border-transparent bg-surface-1/20 hover:bg-surface-1/40",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                            isComplete
                              ? "bg-status-success text-status-success-foreground"
                              : isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {isComplete ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium truncate",
                            isCurrent && !isComplete ? "text-primary" : "text-foreground",
                          )}>
                            {section.title.replace(/^\d+\.\s*/, '')}
                          </p>
                        </div>

                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {done}/{total}
                        </span>
                      </div>

                      {/* Mini progress */}
                      <div className="mt-1.5 h-1 bg-surface-3/60 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isComplete ? "bg-status-success" : isCurrent ? "bg-primary" : "bg-muted-foreground/40",
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </button>
                  );
                })}

                {/* Show more/less */}
                {sections.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={() => setShowAllSections(!showAllSections)}
                  >
                    {showAllSections ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Ver todas ({sections.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Active Stage */}
          <article className="bg-background/20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Etapa {active.idx + 1} de {checklist.length}</p>
                  <h3 className="text-sm font-semibold text-foreground">{active.section.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {pendingCount} pendentes
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px]",
                      active.isComplete
                        ? "border-status-success/40 text-status-success"
                        : active.isCurrent
                          ? "border-primary/40 text-primary"
                          : "border-border/40 text-muted-foreground",
                    )}
                  >
                    {active.percent}%
                  </Badge>
                </div>
              </div>

              <Separator className="mb-3" />

              {filteredItems.length === 0 ? (
                <div className="rounded-xl border border-border/30 bg-surface-1/20 p-6 text-center">
                  <p className="text-sm text-foreground">Nada para mostrar aqui.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajuste filtros ou ative "Concluídas".
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isStalled = !item.completed && daysSinceUpdate >= 3;
                    return (
                      <ChecklistItem
                        key={item.id}
                        item={item}
                        clientId={clientId}
                        clientName={clientName}
                        sectionTitle={active.section.title}
                        isStalled={isStalled}
                        onToggle={() => onToggleItem(active.section.id, item.id)}
                        onAttachmentChange={(url) => onAttachmentChange(active.section.id, item.id, url)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
