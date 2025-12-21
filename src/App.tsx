import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UndoRedoProvider } from "@/contexts/UndoRedoContext";
import { FunnelModeProvider } from "@/contexts/FunnelModeContext";
import { QADebugProvider } from "@/contexts/QADebugContext";
import { ClientsProvider } from "@/components/ClientsProvider";
import { QADebugDrawer, QADebugTrigger } from "@/components/QADebugDrawer";
import { ConsentGuard } from "@/components/ConsentGuard";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import Dashboard from "./pages/Dashboard";
import Commissions from "./pages/Commissions";
import Questions from "./pages/Questions";
import RaioX from "./pages/RaioX";
import AgenteSEO from "./pages/AgenteSEO";
import AgenteSuspensoes from "./pages/AgenteSuspensoes";
import Historico from "./pages/Historico";
import ManagerReport from "./pages/ManagerReport";
import Recorrencia from "./pages/Recorrencia";
import Suggestions from "./pages/Suggestions";
import SuperAdmin from "./pages/SuperAdmin";
import Register from "./pages/Register";
import AgencyPlan from "./pages/AgencyPlan";
import AuditLogs from "./pages/AuditLogs";
import Notifications from "./pages/Notifications";
import ClientsCRM from "./pages/ClientsCRM";
import Equipe from "./pages/Equipe";
import NotFound from "./pages/NotFound";
import { ImpersonateBanner } from "@/components/ImpersonateBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FunnelModeProvider>
            <UndoRedoProvider>
              <ClientsProvider>
                <QADebugProvider>
                  <ConsentGuard>
                    <ImpersonateBanner />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/raio-x" element={<RaioX />} />
                      <Route path="/agente-seo" element={<AgenteSEO />} />
                      <Route path="/agente-suspensoes" element={<AgenteSuspensoes />} />
                      <Route path="/historico" element={<Historico />} />
                      <Route path="/relatorio-gestor" element={<ManagerReport />} />
                      <Route path="/recorrencia" element={<Recorrencia />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/plan" element={<AgencyPlan />} />
                      <Route path="/admin/audit" element={<AuditLogs />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/super-admin" element={<SuperAdmin />} />
                      <Route path="/commissions" element={<Commissions />} />
                      <Route path="/duvidas" element={<Questions />} />
                      <Route path="/sugestoes" element={<Suggestions />} />
                      <Route path="/clientes-crm" element={<ClientsCRM />} />
                      <Route path="/equipe" element={<Equipe />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    {/* QA Debug Tools */}
                    <QADebugTrigger />
                    <QADebugDrawer />
                  </ConsentGuard>
                </QADebugProvider>
              </ClientsProvider>
            </UndoRedoProvider>
          </FunnelModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
