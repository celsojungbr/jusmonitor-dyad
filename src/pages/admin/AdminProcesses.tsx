import { useEffect, useState } from "react"
import { AdminTable } from "@/components/admin/AdminTable"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

const AdminProcesses = () => {
  const [processes, setProcesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadProcesses()
  }, [])

  const loadProcesses = async () => {
    try {
      const data = await AdminApiService.getAllProcesses()
      setProcesses(data || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar processos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProcesses = processes.filter(proc => 
    proc.cnj_number?.includes(searchTerm) ||
    proc.tribunal?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: "cnj_number",
      label: "Número CNJ",
      render: (proc: any) => (
        <span className="font-mono text-sm">{proc.cnj_number}</span>
      )
    },
    {
      key: "tribunal",
      label: "Tribunal",
      render: (proc: any) => proc.tribunal || "-"
    },
    {
      key: "status",
      label: "Status",
      render: (proc: any) => (
        <Badge variant="outline">{proc.status || "N/A"}</Badge>
      )
    },
    {
      key: "search_count",
      label: "Consultas",
      render: (proc: any) => (
        <div className="flex items-center gap-2">
          <span>{proc.search_count || 0}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => viewConsultations(proc.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    {
      key: "last_update",
      label: "Última Atualização",
      render: (proc: any) => new Date(proc.last_update).toLocaleDateString('pt-BR')
    }
  ]

  const viewConsultations = (processId: string) => {
    toast({
      title: "Visualizar Consultas",
      description: "Funcionalidade em desenvolvimento"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DataLake de Processos</h1>
        <p className="text-muted-foreground mt-2">
          {processes.length} processos no banco de dados
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNJ ou tribunal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <AdminTable
        data={filteredProcesses}
        columns={columns}
      />
    </div>
  )
}

export default AdminProcesses
