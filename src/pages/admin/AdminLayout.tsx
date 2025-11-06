import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  FileBarChart,
  LogOut,
  User,
  ArrowLeft,
  Package,
  FlaskConical,
  UserRound,
  ScrollText
} from "lucide-react";
// import { cn } from "@/lib/utils"; // Removido: import não utilizado
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/shared/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar";

const adminNav = [
  { name: "Dashboard", path: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Usuários", path: "/dashboard/admin/users", icon: Users },
  { name: "Processos", path: "/dashboard/admin/processes", icon: FileText },
  { name: "Transações", path: "/dashboard/admin/transactions", icon: CreditCard },
  { name: "Planos", path: "/dashboard/admin/plans", icon: Package },
  { name: "APIs", path: "/dashboard/admin/apis", icon: Settings },
  { name: "Logs", path: "/dashboard/admin/logs", icon: FileBarChart },
  { name: "Sandbox", path: "/dashboard/admin/sandbox", icon: FlaskConical },
  { name: "Logs Escavador", path: "/dashboard/admin/escavador-logs", icon: ScrollText },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = profile?.full_name || "Usuário";
  // const userInitials = getInitials(userName); // Removido: variável não utilizada

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-3 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
              <img
                src="https://res.cloudinary.com/dsdzoebyq/image/upload/v1762059245/JUSMONITOR_Logo_Horizontal_Black_ppc9km.png"
                alt="JusMonitor"
                className="h-8 group-data-[collapsible=icon]:hidden"
              />
              <img
                src="https://res.cloudinary.com/dsdzoebyq/image/upload/v1762059245/JUSMONITOR_Logotype_Black_aqwfyp.png"
                alt="JusMonitor"
                className="w-10 h-10 object-contain hidden group-data-[collapsible=icon]:block"
              />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarMenu className="gap-1">
              {adminNav.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} className="rounded-lg pl-2">
                      <Link to={item.path}>
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
              <div className="rounded-lg bg-sidebar-accent/60 text-sidebar-accent-foreground p-2 flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:gap-0">
                <span className="text-xs group-data-[collapsible=icon]:hidden">Modo</span>
                <span className="text-sm font-medium group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:leading-none">Admin</span>
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
                    <div className="text-xs text-muted-foreground">Administrador</div>
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/consultas')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Painel de Usuário
                </DropdownMenuItem>
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
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;