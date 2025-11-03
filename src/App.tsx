import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Consultas from "./pages/dashboard/Consultas";
import { ProcessoDetalhes } from "@/features/processos/components/ProcessoDetalhes";
import Monitoramentos from "./pages/dashboard/Monitoramentos";
import Senhas from "./pages/dashboard/Senhas";
import Planos from "./pages/dashboard/Planos";
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
