import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Precos from "./pages/Precos";
import Sobre from "./pages/Sobre";
import { ResetPassword } from "@/components/auth/ResetPassword";
import { EmailVerification } from "@/components/auth/EmailVerification";
import { OAuthCallback } from "@/components/auth/OAuthCallback";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Consultas from "./pages/dashboard/Consultas";
import { ProcessoDetalhes } from "@/features/processos/components/ProcessoDetalhes";
import Monitoramentos from "./pages/dashboard/Monitoramentos";
import Senhas from "./pages/dashboard/Senhas";
import Planos from "./pages/dashboard/Planos";
import ProfilePage from "./pages/dashboard/ProfilePage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminProcesses from "./pages/admin/AdminProcesses";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminApis from "./pages/admin/AdminApis";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminSandbox from "./pages/admin/AdminSandbox";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/precos" element={<Precos />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="consultas" element={<Consultas />} />
          <Route path="processo/:cnjNumber" element={<ProcessoDetalhes />} />
          <Route path="monitoramentos" element={<Monitoramentos />} />
          <Route path="senhas" element={<Senhas />} />
          <Route path="planos" element={<Planos />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="/dashboard/admin" element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetails />} />
          <Route path="processes" element={<AdminProcesses />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="apis" element={<AdminApis />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="sandbox" element={<AdminSandbox />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;