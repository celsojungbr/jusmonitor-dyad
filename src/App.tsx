import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Precos from "./pages/Precos";
import Sobre from "./pages/Sobre";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Consultas from "./pages/dashboard/Consultas";
import { ProcessoDetalhes } from "@/features/processos/components/ProcessoDetalhes";
import Monitoramentos from "./pages/dashboard/Monitoramentos";
import Senhas from "./pages/dashboard/Senhas";
import Planos from "./pages/dashboard/Planos";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProcesses from "./pages/admin/AdminProcesses";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminApis from "./pages/admin/AdminApis";
import AdminLogs from "./pages/admin/AdminLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
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
            <Route path="processes" element={<AdminProcesses />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="apis" element={<AdminApis />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
