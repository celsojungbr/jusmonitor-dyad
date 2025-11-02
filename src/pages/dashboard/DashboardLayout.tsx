import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Search, FileText, Bell, Key, CreditCard, User, Settings, LogOut } from "lucide-react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logoTypo from "@/assets/logotype-black.png";
import logoHorizontal from "@/assets/logo-horizontal-black.png";
import avatarIcon from "@/assets/avatar-icon.png";

const navigation = [
  { name: "Consultas", href: "/dashboard/consultas", icon: Search },
  { name: "Processos", href: "/dashboard/processos", icon: FileText },
  { name: "Monitoramentos", href: "/dashboard/monitoramentos", icon: Bell },
  { name: "Senhas", href: "/dashboard/senhas", icon: Key },
  { name: "Planos", href: "/dashboard/planos", icon: CreditCard },
];

const DashboardLayout = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-4">
              <img src={logoTypo} alt="JM" className="h-8 group-data-[collapsible=icon]:hidden" />
              <img src={logoHorizontal} alt="JusMonitor" className="h-8 hidden group-data-[collapsible=icon]:block" />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
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
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center justify-between px-6">
            <SidebarTrigger />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="text-right">
                    <div className="text-sm font-medium">João Silva</div>
                    <div className="text-xs text-muted-foreground">Advogado</div>
                  </div>
                  <Avatar>
                    <AvatarImage src={avatarIcon} />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
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

export default DashboardLayout;
