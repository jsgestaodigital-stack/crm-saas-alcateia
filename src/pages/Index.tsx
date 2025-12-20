import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ProgressTable } from "@/components/ProgressTable";
import { ClientDetailPanel } from "@/components/ClientDetailPanel";
import { StatsBar } from "@/components/StatsBar";
import { useClientStore } from "@/stores/clientStore";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { viewMode } = useClientStore();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <StatsBar />
        
        {viewMode === "kanban" ? (
          <KanbanBoard />
        ) : (
          <ProgressTable />
        )}
      </main>

      <ClientDetailPanel />
    </div>
  );
};

export default Index;
