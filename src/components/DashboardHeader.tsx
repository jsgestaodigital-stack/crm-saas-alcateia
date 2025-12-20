import { useState } from "react";
import { Search, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UndoRedoButtons } from "@/components/UndoRedoButtons";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
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
    <header className="h-16 glass-header fixed top-0 right-0 left-16 lg:left-64 z-40 transition-all duration-300">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Breadcrumbs */}
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>

        {/* Mobile menu placeholder */}
        <div className="sm:hidden">
          <span className="text-sm font-medium text-foreground">RANKEIA</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 bg-surface-2/50 border-border/30 backdrop-blur-sm",
                "focus:border-primary/50 focus:ring-primary/20 focus:bg-surface-2/80",
                "transition-all duration-200"
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Undo/Redo Buttons */}
          <UndoRedoButtons />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full hover:bg-primary/10 transition-all hover-scale"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/30 transition-all hover:border-primary/50">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 glass border-border/30" 
              align="end"
              sideOffset={8}
            >
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
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
              <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-primary/10 focus:bg-primary/10">
                <User className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive gap-2 hover:bg-destructive/10 focus:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
