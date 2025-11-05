import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { Search, Bell, Key, CreditCard, User, Settings, Shield, LogOut, UserRound } from "lucide-react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAdmin } from "@/shared/hooks/useAdmin";
import { useCredits } from "@/shared/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const navigation = [
  { name: "Consultas", href: "/dashboard/consultas", icon: Search },
  { name: "Monitoramentos", href: "/dashboard/monitoramentos", icon: Bell },
  { name: "Senhas", href: "/dashboard/senhas", icon: Key },
  { name: "Planos", href: "/dashboard/planos", icon: CreditCard },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { balance } = useCredits();
  const { toast } = useToast();

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = profile?.full_name || "Usuário";
  const userType = profile?.user_type === "lawyer" ? "Advogado" : profile?.user_type === "admin" ? "Administrador" : "Usuário";
  const userInitials = getInitials(userName);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logout realizado", description: "Até logo!" });
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível sair. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-3 py-4">
              <img src="https://res.cloudinary.com/dsdzoebyq/image/upload/v1762059245/JUSMONITOR_Logo_Horizontal_Black_ppc9km.png" alt="JusMonitor" className="h-8 group-data-[collapsible=icon]:hidden" />
              <img src="https://res.cloudinary.com/dsdzoebyq/image/upload/v1762059245/JUSMONITOR_Logo_Horizontal_Black_ppc9km.png" alt="JusMonitor" className="h-8 hidden group-data-[collapsible=icon]:block" />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-3">
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} className="rounded-lg pl-2">
                      <Link to={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="px-3 pb-2">
              <div className="rounded-lg bg-sidebar-accent/60 text-sidebar-accent-foreground p-2 flex items-center justify-between">
                <span className="text-xs">Saldo</span>
                <span className="text-sm font-medium">{balance} créditos</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center justify-between px-6">
            <SidebarTrigger />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="text-right">
                    <div className="text-sm font-medium">{userName}</div>
                    <div className="text-xs text-muted-foreground">{userType}</div>
                  </div>
                  <Avatar className="bg-muted">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-muted">
                      <UserRound className="w-4 h-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-50 bg-background">
                <DropdownMenuItem onClick={() => navigate('/dashboard/perfil')}>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/configuracoes')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Painel Administrativo
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 p-6 bg-secondary/20">
            <div className="max-w-7xl mx-auto">
              <Suspense fallback={<LoadingSkeleton />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;