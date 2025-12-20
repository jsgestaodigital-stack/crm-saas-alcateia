import { useState } from "react";
import { useClientStore } from "@/stores/clientStore";
import { calculateProgress, getDaysSinceUpdate } from "@/lib/clientUtils";
import { COLUMNS } from "@/types/client";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function CalendarView() {
  const { clients, setSelectedClient } = useClientStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Get clients with activity on each day
  const getClientsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return clients.filter(client => {
      const startDate = client.startDate.slice(0, 10);
      const lastUpdate = client.lastUpdate.slice(0, 10);
      return startDate === dateStr || lastUpdate === dateStr;
    });
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Calendário</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border/50 rounded-xl overflow-hidden">
        {/* Day names */}
        <div className="grid grid-cols-7 bg-surface-1">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border/30">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayClients = day ? getClientsForDay(day) : [];
            const isToday = day === new Date().getDate() && 
                           month === new Date().getMonth() && 
                           year === new Date().getFullYear();

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[80px] sm:min-h-[100px] p-1 border-b border-r border-border/20",
                  !day && "bg-surface-1/30",
                  isToday && "bg-primary/5"
                )}
              >
                {day && (
                  <>
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      isToday && "text-primary"
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayClients.slice(0, 3).map(client => {
                        const progress = calculateProgress(client);
                        const isStalled = getDaysSinceUpdate(client.lastUpdate) >= 3;
                        
                        return (
                          <div
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={cn(
                              "text-[10px] px-1 py-0.5 rounded truncate cursor-pointer",
                              isStalled 
                                ? "bg-status-danger/20 text-status-danger" 
                                : progress >= 80 
                                  ? "bg-status-success/20 text-status-success"
                                  : "bg-primary/20 text-primary"
                            )}
                            title={client.companyName}
                          >
                            {client.companyName}
                          </div>
                        );
                      })}
                      {dayClients.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayClients.length - 3} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
