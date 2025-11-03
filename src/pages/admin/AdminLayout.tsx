import { Link, Outlet, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  FileBarChart 
} from "lucide-react"
import { cn } from "@/lib/utils"

const adminNav = [
  { name: "Dashboard", path: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Usuários", path: "/dashboard/admin/users", icon: Users },
  { name: "Processos", path: "/dashboard/admin/processes", icon: FileText },
  { name: "Transações", path: "/dashboard/admin/transactions", icon: CreditCard },
  { name: "APIs", path: "/dashboard/admin/apis", icon: Settings },
  { name: "Logs", path: "/dashboard/admin/logs", icon: FileBarChart },
]

const AdminLayout = () => {
  const location = useLocation()

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
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
