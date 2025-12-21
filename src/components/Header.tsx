import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Table, Plus, Search, Shield, LogOut, User, Calendar, Clock, LayoutDashboard, Menu, ClipboardList, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientStore } from "@/stores/clientStore";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { QuestionsBell } from "@/components/QuestionsBell";
import alcateiaLogo from "@/assets/alcateia-logo.png";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = [
  { id: "kanban", label: "Kanban", icon: LayoutGrid, tooltip: "Visualização em colunas por estágio do cliente" },
  { id: "table", label: "Tabela", icon: Table, tooltip: "Lista estruturada com todas as informações" },
  { id: "checklist", label: "Execução", icon: ClipboardList, tooltip: "Acompanhamento de tarefas e progresso" },
  { id: "mytasks", label: "Tarefas", icon: ListChecks, tooltip: "Minhas tarefas pendentes de todos os clientes" },
  { id: "timeline", label: "Timeline", icon: Clock, tooltip: "Histórico temporal dos clientes" },
  { id: "calendar", label: "Calendário", icon: Calendar, tooltip: "Visualização por datas" },
  { id: "cards", label: "Cards", icon: LayoutDashboard, tooltip: "Cartões visuais dos clientes" },
] as const;

interface HeaderProps {
  onNewClient?: () => void;
}

export function Header({ onNewClient }: HeaderProps) {
  const { viewMode, setViewMode } = useClientStore();
  const { user, isAdmin, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="h-14 sm:h-16 border-b border-primary/20 bg-surface-1/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-full px-3 sm:px-6">
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4 bg-surface-1 border-primary/20">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <img src={alcateiaLogo} alt="Alcateia" className="h-8 w-auto" />
                <ThemeToggle />
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-primary font-semibold mb-3 uppercase tracking-wider">Visualizações</p>
                {VIEW_OPTIONS.map((view) => (
                  <Button
                    key={view.id}
                    variant="ghost"
                    size="lg"
                    className={cn(
                      "w-full justify-start gap-3 h-12",
                      viewMode === view.id 
                        ? "bg-primary/10 text-primary border border-primary/30" 
                        : "hover:bg-primary/5 hover:text-primary"
                    )}
                    onClick={() => {
                      setViewMode(view.id as any);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <view.icon className="w-5 h-5" />
                    {view.label}
                  </Button>
                ))}
              </div>

              {isAdmin && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start gap-3 h-12 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    navigate("/admin");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Shield className="w-5 h-5" />
                  Painel Admin
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <img src={alcateiaLogo} alt="Alcateia" className="h-6 sm:h-8 w-auto hidden sm:block" />
          <div className="h-6 w-px bg-border/50 hidden lg:block" />
          <span className="text-xs sm:text-sm text-muted-foreground font-medium hidden lg:block">Painel Operacional</span>
        </div>

        {/* Search - Hidden on mobile */}
        <div className="flex-1 max-w-md mx-2 sm:mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Toggle - Desktop */}
          <TooltipProvider delayDuration={800}>
            <div className="hidden lg:flex items-center bg-surface-2 rounded-xl p-1.5 border border-primary/20 neon-border">
              {VIEW_OPTIONS.map((view) => (
                <Tooltip key={view.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-10 px-3 text-sm font-medium rounded-lg transition-all",
                        viewMode === view.id 
                          ? "bg-primary text-primary-foreground neon-glow" 
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      )}
                      onClick={() => setViewMode(view.id as any)}
                    >
                      <view.icon className="w-5 h-5 mr-2" />
                      <span className="hidden xl:inline">{view.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{view.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          {/* View Dropdown - Tablet */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden sm:flex lg:hidden">
              <Button variant="outline" size="default" className="gap-2 border-primary/30 hover:border-primary/50">
                {VIEW_OPTIONS.find(v => v.id === viewMode)?.icon && (
                  <span className="w-5 h-5">
                    {(() => {
                      const Icon = VIEW_OPTIONS.find(v => v.id === viewMode)?.icon;
                      return Icon ? <Icon className="w-5 h-5 text-primary" /> : null;
                    })()}
                  </span>
                )}
                {VIEW_OPTIONS.find(v => v.id === viewMode)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-surface-1 border-border/50">
              {VIEW_OPTIONS.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => setViewMode(view.id as any)}
                  className={cn(
                    "gap-2",
                    viewMode === view.id && "bg-primary/10 text-primary"
                  )}
                >
                  <view.icon className="w-5 h-5" />
                  {view.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification Bell */}
          <NotificationBell />
          <QuestionsBell />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Link - Desktop only */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hidden xl:flex"
              onClick={() => navigate("/admin")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </Button>
          )}

          {/* New Client */}
          <TooltipProvider delayDuration={800}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow hidden sm:flex"
                  onClick={onNewClient}
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Novo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Criar novo cliente ou lead</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Mobile New Client */}
          <Button 
            size="icon" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 sm:hidden w-8 h-8"
            onClick={onNewClient}
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 border border-primary/30">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-surface-1 border-border/50" align="end">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-foreground">
                    {user?.user_metadata?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/settings/security")}>
                <User className="w-4 h-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/admin")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Painel Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
