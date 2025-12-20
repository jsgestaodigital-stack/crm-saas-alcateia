import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Bug, 
  X, 
  Navigation, 
  Globe, 
  MousePointer, 
  AlertTriangle, 
  User, 
  Copy, 
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  RotateCcw,
  Shield,
  ChevronDown,
  ChevronRight,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQADebug } from '@/contexts/QADebugContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function QADebugDrawer() {
  const {
    isEnabled,
    isDrawerOpen,
    toggleDrawer,
    toggleEnabled,
    navigationLogs,
    apiLogs,
    uiEvents,
    jsErrors,
    sessionState,
    simulate401,
    simulateOffline,
    clearLocalStorage,
    resetState,
    forceRefreshSession,
    generateBugReport,
    clearLogs,
  } = useQADebug();

  const [copied, setCopied] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    session: true,
    navigation: true,
    api: true,
    events: false,
    errors: true
  });

  if (!isEnabled || !isDrawerOpen) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyBugReport = () => {
    const report = generateBugReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success('Bug report copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateOffline = () => {
    setIsOffline(!isOffline);
    simulateOffline();
    toast.info(isOffline ? 'Modo online restaurado' : 'Simulando offline...');
  };

  const getStatusColor = (status: number | null) => {
    if (status === null) return 'text-muted-foreground';
    if (status >= 500) return 'text-red-500';
    if (status >= 400) return 'text-amber-500';
    if (status >= 300) return 'text-blue-500';
    return 'text-green-500';
  };

  const errorCount = jsErrors.length + apiLogs.filter(a => a.status && a.status >= 400).length;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-background/95 backdrop-blur-xl border-l border-border z-[9999] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-1">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">QA Console</span>
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5">
              {errorCount} erros
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearLogs} title="Limpar logs">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDrawer}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Session State */}
      <div 
        className="p-3 border-b border-border cursor-pointer hover:bg-surface-1/50"
        onClick={() => toggleSection('session')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expandedSections.session ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Sessão</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className={cn(
              "h-2 w-2 fill-current",
              sessionState.isLoggedIn ? "text-green-500" : "text-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {sessionState.isLoggedIn ? 'Logado' : 'Deslogado'}
            </span>
          </div>
        </div>
        {expandedSections.session && (
          <div className="mt-2 ml-6 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono">{sessionState.userId?.substring(0, 12) || '—'}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono truncate max-w-[200px]">{sessionState.userEmail || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline" className="text-[10px]">{sessionState.role || '—'}</Badge>
            </div>
          </div>
        )}
      </div>

      {/* Tabs for logs */}
      <Tabs defaultValue="navigation" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start px-2 pt-2 bg-transparent">
          <TabsTrigger value="navigation" className="text-xs gap-1">
            <Navigation className="h-3 w-3" />
            Nav ({navigationLogs.length})
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs gap-1">
            <Globe className="h-3 w-3" />
            API ({apiLogs.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs gap-1">
            <MousePointer className="h-3 w-3" />
            UI ({uiEvents.length})
          </TabsTrigger>
          <TabsTrigger value="errors" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            Erros ({jsErrors.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Navigation Logs */}
          <TabsContent value="navigation" className="m-0 p-2">
            {navigationLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Nenhuma navegação registrada
              </div>
            ) : (
              <div className="space-y-1">
                {navigationLogs.map(log => (
                  <div key={log.id} className="bg-surface-2/50 rounded p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{log.reason}</Badge>
                      <span className="text-muted-foreground">
                        {format(log.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="font-mono">
                      <span className="text-muted-foreground">{log.from}</span>
                      <span className="mx-2">→</span>
                      <span className="text-primary">{log.to}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* API Logs */}
          <TabsContent value="api" className="m-0 p-2">
            {apiLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Nenhuma chamada de API registrada
              </div>
            ) : (
              <div className="space-y-1">
                {apiLogs.map(log => (
                  <div key={log.id} className="bg-surface-2/50 rounded p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{log.method}</Badge>
                        <span className={cn("font-mono font-bold", getStatusColor(log.status))}>
                          {log.status || 'ERR'}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {log.duration}ms • {format(log.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] truncate">
                      {log.endpoint.replace(/^https?:\/\/[^\/]+/, '')}
                    </div>
                    {log.error && (
                      <div className="text-red-400 mt-1">{log.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* UI Events */}
          <TabsContent value="events" className="m-0 p-2">
            {uiEvents.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Nenhum evento de UI registrado
              </div>
            ) : (
              <div className="space-y-1">
                {uiEvents.map(event => (
                  <div key={event.id} className="bg-surface-2/50 rounded p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{event.type}</Badge>
                      <span className="text-muted-foreground">
                        {format(event.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="font-mono">{event.target}</div>
                    {event.details && (
                      <div className="text-muted-foreground mt-1">{event.details}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* JS Errors */}
          <TabsContent value="errors" className="m-0 p-2">
            {jsErrors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Nenhum erro JS capturado
              </div>
            ) : (
              <div className="space-y-1">
                {jsErrors.map(error => (
                  <div key={error.id} className="bg-red-500/10 border border-red-500/20 rounded p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">
                        {format(error.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="text-red-400 font-medium">{error.message}</div>
                    {error.source && (
                      <div className="text-muted-foreground mt-1 font-mono text-[10px]">
                        {error.source}:{error.lineno}:{error.colno}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Actions */}
      <div className="border-t border-border p-3 space-y-2 bg-surface-1">
        <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Simulações QA
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { simulate401(); toast.info('401 simulado - redirecionando...'); }}
            className="text-xs gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Simular 401
          </Button>
          <Button 
            variant={isOffline ? "destructive" : "outline"}
            size="sm" 
            onClick={handleSimulateOffline}
            className="text-xs gap-1"
          >
            {isOffline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
            {isOffline ? 'Online' : 'Offline'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { clearLocalStorage(); toast.success('Cache limpo!'); }}
            className="text-xs gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Limpar Cache
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetState}
            className="text-xs gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Estado
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { forceRefreshSession(); toast.info('Refreshing session...'); }}
            className="text-xs gap-1 col-span-2"
          >
            <RefreshCw className="h-3 w-3" />
            Forçar Refresh Sessão
          </Button>
        </div>

        {/* Bug Report */}
        <Button 
          onClick={copyBugReport}
          className="w-full gap-2 mt-3"
          variant={copied ? "secondary" : "default"}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado!' : 'Copiar Bug Report'}
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2 text-center text-[10px] text-muted-foreground bg-surface-2">
        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Ctrl</kbd>
        {' + '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Alt</kbd>
        {' + '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">D</kbd>
        {' para alternar'}
      </div>
    </div>
  );
}

// Floating trigger button
export function QADebugTrigger() {
  const { isEnabled, toggleDrawer, jsErrors, apiLogs } = useQADebug();
  
  if (!isEnabled) return null;

  const errorCount = jsErrors.length + apiLogs.filter(a => a.status && a.status >= 400).length;

  return (
    <Button
      onClick={toggleDrawer}
      className="fixed bottom-20 right-6 z-[9998] h-12 w-12 rounded-full shadow-lg"
      variant={errorCount > 0 ? "destructive" : "default"}
      size="icon"
    >
      <Bug className="h-5 w-5" />
      {errorCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
          {errorCount > 9 ? '9+' : errorCount}
        </span>
      )}
    </Button>
  );
}
