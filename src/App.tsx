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
import DashboardGerencial from "./pages/DashboardGerencial";
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
import Convite from "./pages/Convite";
import AgencyDetail from "./pages/AgencyDetail";
import AdminPermissions from "./pages/AdminPermissions";
import AgencyPermissions from "./pages/AgencyPermissions";
import SecuritySettings from "./pages/SecuritySettings";
import ActivationDashboard from "./pages/ActivationDashboard";
import Propostas from "./pages/Propostas";
import PropostaPublica from "./pages/PropostaPublica";
import Contratos from "./pages/Contratos";
import ContratoPublico from "./pages/ContratoPublico";
import NotFound from "./pages/NotFound";
import { ImpersonateBanner } from "@/components/ImpersonateBanner";
import { NPSModal } from "@/components/nps";

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
                      {/* ============ DASHBOARD / HOME ============ */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />

                      {/* ============ COMERCIAL ============ */}
                      <Route path="/propostas" element={<Propostas />} />
                      <Route path="/contratos" element={<Contratos />} />
                      <Route path="/commissions" element={<Commissions />} />

                      {/* ============ PRODUÇÃO / OPERACIONAL ============ */}
                      <Route path="/raio-x" element={<RaioX />} />
                      <Route path="/agente-seo" element={<AgenteSEO />} />
                      <Route path="/agente-suspensoes" element={<AgenteSuspensoes />} />
                      <Route path="/historico" element={<Historico />} />
                      <Route path="/duvidas" element={<Questions />} />
                      <Route path="/recorrencia" element={<Recorrencia />} />
                      <Route path="/clientes-crm" element={<ClientsCRM />} />

                      {/* ============ GESTÃO / ADMINISTRAÇÃO ============ */}
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/plan" element={<AgencyPlan />} />
                      <Route path="/admin/audit" element={<AuditLogs />} />
                      <Route path="/admin/permissions" element={<AdminPermissions />} />
                      <Route path="/admin/activation" element={<ActivationDashboard />} />
                      <Route path="/admin/agencia/:id" element={<AgencyDetail />} />
                      <Route path="/equipe" element={<Equipe />} />
                      <Route path="/relatorio-gestor" element={<ManagerReport />} />
                      <Route path="/dashboard-gerencial" element={<DashboardGerencial />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/sugestoes" element={<Suggestions />} />
                      <Route path="/agency/settings/permissions" element={<AgencyPermissions />} />
                      <Route path="/settings/security" element={<SecuritySettings />} />
                      <Route path="/super-admin" element={<SuperAdmin />} />

                      {/* ============ AUTENTICAÇÃO ============ */}
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/convite/:token" element={<Convite />} />

                      {/* ============ PÁGINAS PÚBLICAS (sem auth) ============ */}
                      <Route path="/proposta/:token" element={<PropostaPublica />} />
                      <Route path="/contrato/:token" element={<ContratoPublico />} />

                      {/* ============ CATCH-ALL (404) ============ */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    {/* Global Modals */}
                    <NPSModal />
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
