import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { 
  Brain, Search, AlertTriangle, Zap, BarChart3, FileText, 
  Target, Menu, ArrowRight, Sparkles
} from "lucide-react";

import { AgenteSEOModal } from "@/components/agents/AgenteSEOModal";
import { AgenteSuspensoesModal } from "@/components/agents/AgenteSuspensoesModal";
import { AgenteRaioXModal } from "@/components/agents/AgenteRaioXModal";
import { AgenteRelatorioModal } from "@/components/agents/AgenteRelatorioModal";

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof Brain;
  color: string;
  bgColor: string;
  category: "vendas" | "otimizacao" | "gestao";
  modalKey?: string;
}

const agents: AgentConfig[] = [
  {
    id: "lead-copilot",
    name: "Lead Copilot",
    description: "Assistente IA para qualificação de leads, sugestões de abordagem e previsão de conversão.",
    icon: Target,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    category: "vendas",
  },
  {
    id: "raio-x",
    name: "Raio-X",
    description: "Análise profunda de leads com pontuação de fechamento e recomendações personalizadas.",
    icon: Zap,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 border-violet-500/20",
    category: "vendas",
    modalKey: "raiox",
  },
  {
    id: "seo",
    name: "Agente SEO",
    description: "Otimização inteligente de perfis Google Meu Negócio com sugestões de palavras-chave e categorias.",
    icon: Search,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    category: "otimizacao",
    modalKey: "seo",
  },
  {
    id: "suspensoes",
    name: "Agente Suspensões",
    description: "Detecção de riscos de suspensão e análise preventiva de perfis GMB.",
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    category: "otimizacao",
    modalKey: "suspensoes",
  },
  {
    id: "relatorio",
    name: "Agente Relatórios",
    description: "Geração automatizada de relatórios com insights de performance e tendências.",
    icon: BarChart3,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 border-violet-500/20",
    category: "gestao",
    modalKey: "relatorio",
  },
  {
    id: "propostas",
    name: "Gerador de Propostas",
    description: "Criação inteligente de propostas comerciais com templates e variáveis dinâmicas.",
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    category: "vendas",
  },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  vendas: { label: "Vendas", color: "bg-amber-500/20 text-amber-600" },
  otimizacao: { label: "Otimização", color: "bg-primary/20 text-primary" },
  gestao: { label: "Gestão", color: "bg-violet-500/20 text-violet-600" },
};

export default function AgentesIA() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [seoOpen, setSeoOpen] = useState(false);
  const [suspensoesOpen, setSuspensoesOpen] = useState(false);
  const [raioxOpen, setRaioxOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);

  if (isLoading || !user) return null;

  const handleAgentAction = (agent: AgentConfig) => {
    switch (agent.modalKey) {
      case "seo": setSeoOpen(true); break;
      case "suspensoes": setSuspensoesOpen(true); break;
      case "raiox": setRaioxOpen(true); break;
      case "relatorio": setRelatorioOpen(true); break;
      case undefined:
        if (agent.id === "lead-copilot") navigate("/clientes-crm");
        if (agent.id === "propostas") navigate("/propostas");
        break;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <DashboardHeader />
        
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <main className="pt-20 pb-8 px-4 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Hub de Agentes IA</h1>
                  <p className="text-muted-foreground text-sm">
                    Central unificada de todos os agentes inteligentes do sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {agents.length} agentes disponíveis
              </Badge>
            </div>

            {/* Agents Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => {
                const Icon = agent.icon;
                const cat = categoryLabels[agent.category];
                return (
                  <Card
                    key={agent.id}
                    className={cn(
                      "group cursor-pointer transition-all duration-300 hover:shadow-lg border",
                      agent.bgColor
                    )}
                    onClick={() => handleAgentAction(agent)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className={cn("p-2.5 rounded-xl", agent.bgColor)}>
                          <Icon className={cn("h-5 w-5", agent.color)} />
                        </div>
                        <Badge className={cn("text-xs", cat.color)}>{cat.label}</Badge>
                      </div>
                      <CardTitle className="text-base mt-3">{agent.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs leading-relaxed">
                        {agent.description}
                      </CardDescription>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        <span>Abrir agente</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Agent Modals */}
      {seoOpen && <AgenteSEOModal trigger={<span />} />}
      {suspensoesOpen && <AgenteSuspensoesModal trigger={<span />} />}
      {raioxOpen && <AgenteRaioXModal trigger={<span />} />}
      {relatorioOpen && <AgenteRelatorioModal trigger={<span />} />}
    </div>
  );
}
