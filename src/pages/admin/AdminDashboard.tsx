import { useEffect, useState } from "react"
import { Users, FileText, CreditCard, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/admin/StatCard"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await AdminApiService.getUserStats()
      setStats(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral da plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Usuários"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Usuários cadastrados"
        />
        <StatCard
          title="Usuários Ativos"
          value={stats?.activeUsers || 0}
          icon={Users}
          description="Com créditos disponíveis"
        />
        <StatCard
          title="Processos no DataLake"
          value={stats?.totalProcesses || 0}
          icon={FileText}
          description="Total de processos"
        />
        <StatCard
          title="Créditos Hoje"
          value={stats?.creditsConsumedToday || 0}
          icon={CreditCard}
          description="Consumidos hoje"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Consumo de Créditos (7 dias)
          </h3>
          <div className="text-center py-8 text-muted-foreground">
            Gráfico em desenvolvimento
          </div>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-4">Últimas Atividades</h3>
          <div className="text-center py-8 text-muted-foreground">
            Feed de atividades em desenvolvimento
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
