import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
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
  FlaskConical
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/shared/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import avatarIcon from "@/assets/avatar-icon.png"

const adminNav = [
  { name: "Dashboard", path: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Usuários", path: "/dashboard/admin/users", icon: Users },
  { name: "Processos", path: "/dashboard/admin/processes", icon: FileText },
  { name: "Transações", path: "/dashboard/admin/transactions", icon: CreditCard },
  { name: "Planos", path: "/dashboard/admin/plans", icon: Package },
  { name: "APIs", path: "/dashboard/admin/apis", icon: Settings },
  { name: "Logs", path: "/dashboard/admin/logs", icon: FileBarChart },
  { name: "Sandbox", path: "/dashboard/admin/sandbox", icon: FlaskConical },
]

const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      })
      navigate("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast({
        title: "Erro",
        description: "Não foi possível sair. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const userName = profile?.full_name || "Usuário"
  const userInitials = getInitials(userName)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary">Painel Admin</h2>
        </div>
        <nav className="space-y-1 px-3">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-background flex items-center justify-end px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="text-right">
                  <div className="text-sm font-medium">{userName}</div>
                  <div className="text-xs text-muted-foreground">Administrador</div>
                </div>
                <Avatar>
                  <AvatarImage src={profile?.avatar_url || avatarIcon} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
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

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
