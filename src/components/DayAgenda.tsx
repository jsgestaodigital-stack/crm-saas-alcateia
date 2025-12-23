import { useState, useMemo } from "react";
import { AlertTriangle, Clock, Calendar, ChevronRight, Zap, ChevronLeft, Plus, Trash2, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useClientStore } from "@/stores/clientStore";
import { getDaysSinceUpdate } from "@/lib/clientUtils";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/client";
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UrgentAction {
  id: string;
  clientId: string;
  clientName: string;
  taskTitle: string;
  responsible: string;
  urgencyReason: string;
  urgencyLevel: "critical" | "high" | "medium";
  daysStalled: number;
  daysToDeadline: number;
}

type ViewMode = "day" | "week" | "month" | "year";

function getDaysToDeadline(startDate: string): number {
  const start = new Date(startDate);
  const deadline = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function DayAgenda() {
  const { clients, setSelectedClient, setDetailOpen } = useClientStore();
  
  // Local state for appointments (starts empty - no fake data)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "09:00", clientId: "none" });
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Collapsible states - default open
  const [urgentOpen, setUrgentOpen] = useState(true);
  const [agendaOpen, setAgendaOpen] = useState(true);

  // Calculate urgent actions
  const urgentActions = useMemo(() => {
    const actions: UrgentAction[] = [];

    clients.forEach(client => {
      if (["finalized", "delivered", "suspended"].includes(client.columnId)) return;

      const daysStalled = getDaysSinceUpdate(client.lastUpdate);
      const daysToDeadline = getDaysToDeadline(client.startDate);

      for (const section of client.checklist) {
        for (const item of section.items) {
          if (!item.completed) {
            let urgencyLevel: "critical" | "high" | "medium" = "medium";
            let urgencyReason = "";

            if (daysToDeadline <= 3) {
              urgencyLevel = "critical";
              urgencyReason = `⚠️ Prazo em ${daysToDeadline} dias!`;
            } else if (daysStalled >= 5) {
              urgencyLevel = "critical";
              urgencyReason = `🔴 Parado há ${daysStalled} dias`;
            } else if (daysToDeadline <= 7) {
              urgencyLevel = "high";
              urgencyReason = `⏰ ${daysToDeadline} dias restantes`;
            } else if (daysStalled >= 3) {
              urgencyLevel = "high";
              urgencyReason = `⚡ Sem ação há ${daysStalled} dias`;
            } else {
              urgencyReason = "Próxima tarefa";
            }

            actions.push({
              id: `${client.id}-${item.id}`,
              clientId: client.id,
              clientName: client.companyName,
              taskTitle: item.title,
              responsible: item.responsible,
              urgencyReason,
              urgencyLevel,
              daysStalled,
              daysToDeadline,
            });

            break;
          }
        }
        if (actions.find(a => a.clientId === client.id)) break;
      }
    });

    return actions
      .sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2 };
        if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
          return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
        }
        return a.daysToDeadline - b.daysToDeadline;
      })
      .slice(0, 5);
  }, [clients]);

  // Filter appointments based on view mode and selected date
  const filteredAppointments = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (viewMode) {
      case "day":
        return appointments.filter(apt => isSameDay(new Date(apt.date), selectedDate));
      case "week":
        start = startOfWeek(selectedDate, { locale: ptBR });
        end = endOfWeek(selectedDate, { locale: ptBR });
        return appointments.filter(apt => isWithinInterval(new Date(apt.date), { start, end }));
      case "month":
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
        return appointments.filter(apt => isWithinInterval(new Date(apt.date), { start, end }));
      case "year":
        start = startOfYear(selectedDate);
        end = endOfYear(selectedDate);
        return appointments.filter(apt => isWithinInterval(new Date(apt.date), { start, end }));
      default:
        return appointments;
    }
  }, [appointments, selectedDate, viewMode]);

  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [filteredAppointments]);

  const handleOpenClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setDetailOpen(true);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const multiplier = direction === "next" ? 1 : -1;
    switch (viewMode) {
      case "day":
        setSelectedDate(prev => addDays(prev, multiplier));
        break;
      case "week":
        setSelectedDate(prev => addWeeks(prev, multiplier));
        break;
      case "month":
        setSelectedDate(prev => addMonths(prev, multiplier));
        break;
      case "year":
        setSelectedDate(prev => addYears(prev, multiplier));
        break;
    }
  };

  const goToToday = () => setSelectedDate(new Date());

  const getDateLabel = () => {
    switch (viewMode) {
      case "day":
        return format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
      case "week": {
        const weekStart = startOfWeek(selectedDate, { locale: ptBR });
        const weekEnd = endOfWeek(selectedDate, { locale: ptBR });
        return `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM", { locale: ptBR })}`;
      }
      case "month":
        return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
      case "year":
        return format(selectedDate, "yyyy");
      default:
        return format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    }
  };

  const handleAddAppointment = () => {
    if (!newAppointment.title.trim()) return;
    
    const appointment: Appointment = {
      id: `apt-${Date.now()}`,
      title: newAppointment.title,
      date: newAppointment.date || format(selectedDate, "yyyy-MM-dd"),
      time: newAppointment.time,
      clientId: newAppointment.clientId && newAppointment.clientId !== "none" ? newAppointment.clientId : undefined,
      completed: false,
    };
    
    setAppointments(prev => [...prev, appointment]);
    setNewAppointment({ title: "", date: "", time: "09:00", clientId: "none" });
    setDialogOpen(false);
  };

  const handleToggleAppointment = (id: string) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, completed: !apt.completed } : apt)
    );
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
  };

  const activeClients = clients.filter(c => 
    !["finalized", "delivered", "suspended"].includes(c.columnId)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-3 sm:px-6 py-4">
      {/* Day Agenda - Calendar-style (First) */}
      <Collapsible open={agendaOpen} onOpenChange={setAgendaOpen}>
        <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-surface-1 to-surface-2/50 p-5 h-full min-h-[420px]">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between mb-4 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-status-info/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-status-info" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-foreground">Agenda</h2>
                  <p className="text-xs text-muted-foreground capitalize">{getDateLabel()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-surface-1 border-border">
                    <DialogHeader>
                      <DialogTitle>Novo Compromisso</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Título</label>
                        <Input
                          placeholder="Ex: Briefing com cliente..."
                          value={newAppointment.title}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-surface-2 border-border"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Data</label>
                          <Input
                            type="date"
                            value={newAppointment.date || format(selectedDate, "yyyy-MM-dd")}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                            className="bg-surface-2 border-border"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Horário</label>
                          <Input
                            type="time"
                            value={newAppointment.time}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                            className="bg-surface-2 border-border"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Cliente (opcional)</label>
                        <Select 
                          value={newAppointment.clientId} 
                          onValueChange={(v) => setNewAppointment(prev => ({ ...prev, clientId: v }))}
                        >
                          <SelectTrigger className="bg-surface-2 border-border">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {activeClients.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddAppointment} className="w-full">
                        Adicionar Compromisso
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", agendaOpen && "rotate-180")} />
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 mb-3 bg-surface-2/50 rounded-lg p-1">
              {(["day", "week", "month", "year"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    viewMode === mode 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  )}
                >
                  {mode === "day" ? "Hoje" : mode === "week" ? "Semana" : mode === "month" ? "Mês" : "Ano"}
                </button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                size="icon" 
                variant="ghost" 
                className="w-8 h-8" 
                onClick={() => navigateDate("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToToday}
                className="text-xs text-primary hover:text-primary"
              >
                Ir para hoje
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="w-8 h-8" 
                onClick={() => navigateDate("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Appointments List */}
            <div className="space-y-2 min-h-[200px]">
              {sortedAppointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum compromisso</p>
                  <p className="text-xs">Clique em "Novo" para adicionar</p>
                </div>
              ) : (
                sortedAppointments.map((apt) => {
                  const linkedClient = apt.clientId ? clients.find(c => c.id === apt.clientId) : null;
                  const aptDate = new Date(apt.date);
                  const showDate = viewMode !== "day";
                  
                  return (
                    <div 
                      key={apt.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all group",
                        apt.completed 
                          ? "bg-surface-2/30 border-border/20 opacity-60" 
                          : "bg-surface-2/50 border-border/30 hover:border-primary/30"
                      )}
                    >
                      <button
                        onClick={() => handleToggleAppointment(apt.id)}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                          apt.completed 
                            ? "bg-primary border-primary" 
                            : "border-muted-foreground/30 hover:border-primary"
                        )}
                      >
                        {apt.completed && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                      </button>
                      
                      <div className={cn("text-xs font-mono text-primary font-medium", showDate ? "w-24" : "w-14")}>
                        {showDate && (
                          <span className="text-muted-foreground mr-1">
                            {format(aptDate, "dd/MM")}
                          </span>
                        )}
                        {apt.time}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm",
                          apt.completed && "line-through text-muted-foreground"
                        )}>{apt.title}</p>
                        {linkedClient && (
                          <button 
                            onClick={() => handleOpenClient(linkedClient.id)}
                            className="text-[10px] text-primary hover:underline"
                          >
                            → {linkedClient.companyName}
                          </button>
                        )}
                      </div>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-status-danger"
                        onClick={() => handleDeleteAppointment(apt.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Ações Urgentes (Second) */}
      <Collapsible open={urgentOpen} onOpenChange={setUrgentOpen}>
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-surface-1 to-surface-2/50 p-5 neon-border h-full min-h-[420px]">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between mb-4 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center neon-glow">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-foreground">Ações Urgentes</h2>
                  <p className="text-xs text-muted-foreground">Top 5 prioridades do dia</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary font-mono">
                  {urgentActions.length}
                </Badge>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", urgentOpen && "rotate-180")} />
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="space-y-2">
              {urgentActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-status-success/50" />
                  <p className="text-sm">Nenhuma ação urgente!</p>
                  <p className="text-xs">Tudo sob controle 🎉</p>
                </div>
              ) : (
                urgentActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => handleOpenClient(action.clientId)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] text-left",
                      action.urgencyLevel === "critical" 
                        ? "bg-status-danger/10 border-status-danger/30 hover:border-status-danger/50" 
                        : action.urgencyLevel === "high"
                        ? "bg-status-warning/10 border-status-warning/30 hover:border-status-warning/50"
                        : "bg-surface-2/50 border-border/30 hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                      action.urgencyLevel === "critical" 
                        ? "bg-status-danger text-white" 
                        : action.urgencyLevel === "high"
                        ? "bg-status-warning text-white"
                        : "bg-primary/20 text-primary"
                    )}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{action.clientName}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] px-1.5 py-0",
                            action.responsible === "João" 
                              ? "border-status-info/40 text-status-info" 
                              : "border-status-purple/40 text-status-purple"
                          )}
                        >
                          {action.responsible}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                        {action.taskTitle}
                      </p>
                      <span className={cn(
                        "text-[10px] font-medium",
                        action.urgencyLevel === "critical" ? "text-status-danger" :
                        action.urgencyLevel === "high" ? "text-status-warning" : "text-muted-foreground"
                      )}>
                        {action.urgencyReason}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
