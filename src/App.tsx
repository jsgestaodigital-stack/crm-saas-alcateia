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
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import Landing from "./pages/Landing";
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
import Upgrade from "./pages/Upgrade";
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
import MeuPerfil from "./pages/MeuPerfil";
import SubscriptionLocked from "./pages/SubscriptionLocked";
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
                      {/* ============ LANDING PAGE PÚBLICA ============ */}
                      <Route path="/" element={<Landing />} />

                      {/* ============ DASHBOARD / HOME (Autenticado) ============ */}
                      <Route path="/dashboard" element={
                        <SubscriptionGuard><Dashboard /></SubscriptionGuard>
                      } />

                      {/* ============ COMERCIAL ============ */}
                      <Route path="/propostas" element={
                        <SubscriptionGuard><Propostas /></SubscriptionGuard>
                      } />
                      <Route path="/contratos" element={
                        <SubscriptionGuard><Contratos /></SubscriptionGuard>
                      } />
                      <Route path="/commissions" element={
                        <SubscriptionGuard><Commissions /></SubscriptionGuard>
                      } />

                      {/* ============ PRODUÇÃO / OPERACIONAL ============ */}
                      <Route path="/raio-x" element={
                        <SubscriptionGuard><RaioX /></SubscriptionGuard>
                      } />
                      <Route path="/agente-seo" element={
                        <SubscriptionGuard><AgenteSEO /></SubscriptionGuard>
                      } />
                      <Route path="/agente-suspensoes" element={
                        <SubscriptionGuard><AgenteSuspensoes /></SubscriptionGuard>
                      } />
                      <Route path="/historico" element={
                        <SubscriptionGuard><Historico /></SubscriptionGuard>
                      } />
                      <Route path="/duvidas" element={
                        <SubscriptionGuard><Questions /></SubscriptionGuard>
                      } />
                      <Route path="/recorrencia" element={
                        <SubscriptionGuard><Recorrencia /></SubscriptionGuard>
                      } />
                      <Route path="/clientes-crm" element={
                        <SubscriptionGuard><ClientsCRM /></SubscriptionGuard>
                      } />

                      {/* ============ GESTÃO / ADMINISTRAÇÃO ============ */}
                      <Route path="/admin" element={
                        <SubscriptionGuard><Admin /></SubscriptionGuard>
                      } />
                      <Route path="/admin/users" element={
                        <SubscriptionGuard><AdminUsers /></SubscriptionGuard>
                      } />
                      <Route path="/admin/plan" element={
                        <SubscriptionGuard><AgencyPlan /></SubscriptionGuard>
                      } />
                      <Route path="/upgrade" element={
                        <SubscriptionGuard><Upgrade /></SubscriptionGuard>
                      } />
                      <Route path="/admin/audit" element={
                        <SubscriptionGuard><AuditLogs /></SubscriptionGuard>
                      } />
                      <Route path="/admin/permissions" element={
                        <SubscriptionGuard><AdminPermissions /></SubscriptionGuard>
                      } />
                      <Route path="/admin/activation" element={
                        <SubscriptionGuard><ActivationDashboard /></SubscriptionGuard>
                      } />
                      <Route path="/admin/agencia/:id" element={
                        <SubscriptionGuard><AgencyDetail /></SubscriptionGuard>
                      } />
                      <Route path="/equipe" element={
                        <SubscriptionGuard><Equipe /></SubscriptionGuard>
                      } />
                      <Route path="/relatorio-gestor" element={
                        <SubscriptionGuard><ManagerReport /></SubscriptionGuard>
                      } />
                      
                      <Route path="/notifications" element={
                        <SubscriptionGuard><Notifications /></SubscriptionGuard>
                      } />
                      <Route path="/sugestoes" element={
                        <SubscriptionGuard><Suggestions /></SubscriptionGuard>
                      } />
                      <Route path="/agency/settings/permissions" element={
                        <SubscriptionGuard><AgencyPermissions /></SubscriptionGuard>
                      } />
                      <Route path="/settings/security" element={
                        <SubscriptionGuard><SecuritySettings /></SubscriptionGuard>
                      } />
                      <Route path="/meu-perfil" element={<MeuPerfil />} />
                      <Route path="/super-admin" element={<SuperAdmin />} />

                      {/* ============ AUTENTICAÇÃO ============ */}
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/convite/:token" element={<Convite />} />
                      <Route path="/locked" element={<SubscriptionLocked />} />

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
