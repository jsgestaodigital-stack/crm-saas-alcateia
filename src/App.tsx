import { Suspense, lazy } from "react";
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
import { ImpersonateBanner } from "@/components/ImpersonateBanner";
import { PendingRegistrationsBanner } from "@/components/admin/PendingRegistrationsBanner";
import { ErrorBoundaryLogger } from "@/components/ErrorBoundaryLogger";
import { NPSModal } from "@/components/nps";
import { Loader2 } from "lucide-react";

// ============ LAZY LOADED PAGES ============
// Critical path - loaded immediately
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Heavy pages - lazy loaded for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ClientsCRM = lazy(() => import("./pages/ClientsCRM"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Propostas = lazy(() => import("./pages/Propostas"));
const ManagerReport = lazy(() => import("./pages/ManagerReport"));
const Commissions = lazy(() => import("./pages/Commissions"));
const Recorrencia = lazy(() => import("./pages/Recorrencia"));

// Admin pages - lazy loaded
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const AgencyPlan = lazy(() => import("./pages/AgencyPlan"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const AdminPermissions = lazy(() => import("./pages/AdminPermissions"));
const AgencyDetail = lazy(() => import("./pages/AgencyDetail"));
const ActivationDashboard = lazy(() => import("./pages/ActivationDashboard"));

// Other pages - lazy loaded
const Questions = lazy(() => import("./pages/Questions"));
const RaioX = lazy(() => import("./pages/RaioX"));
const AgenteSEO = lazy(() => import("./pages/AgenteSEO"));
const AgenteSuspensoes = lazy(() => import("./pages/AgenteSuspensoes"));
const Historico = lazy(() => import("./pages/Historico"));
const Suggestions = lazy(() => import("./pages/Suggestions"));
const Register = lazy(() => import("./pages/Register"));
const RegisterAlcateia = lazy(() => import("./pages/RegisterAlcateia"));
const LandingAlcateia = lazy(() => import("./pages/LandingAlcateia"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Equipe = lazy(() => import("./pages/Equipe"));
const Convite = lazy(() => import("./pages/Convite"));
const AgencyPermissions = lazy(() => import("./pages/AgencyPermissions"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const PropostaPublica = lazy(() => import("./pages/PropostaPublica"));
const ContratoPublico = lazy(() => import("./pages/ContratoPublico"));
const MeuPerfil = lazy(() => import("./pages/MeuPerfil"));
const SubscriptionLocked = lazy(() => import("./pages/SubscriptionLocked"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

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
                    <PendingRegistrationsBanner />
                    <ImpersonateBanner />
                    <ErrorBoundaryLogger />
                    <Suspense fallback={<PageLoader />}>
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
                        <Route path="/alcateia" element={<LandingAlcateia />} />
                        <Route path="/register-alcateia" element={<RegisterAlcateia />} />
                        <Route path="/convite/:token" element={<Convite />} />
                        <Route path="/locked" element={<SubscriptionLocked />} />

                        {/* ============ PÁGINAS PÚBLICAS (sem auth) ============ */}
                        <Route path="/proposta/:token" element={<PropostaPublica />} />
                        <Route path="/contrato/:token" element={<ContratoPublico />} />

                        {/* ============ CATCH-ALL (404) ============ */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
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
