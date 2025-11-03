import { useEffect, useState } from "react"
import { AdminTable } from "@/components/admin/AdminTable"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [logType, setLogType] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    loadLogs()
  }, [logType])

  const loadLogs = async () => {
    try {
      const typeFilter = logType === "all" ? undefined : logType
      const data: any = await AdminApiService.getApiLogs(typeFilter)
      setLogs(data.logs || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar logs",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getLogTypeBadge = (type: string) => {
    const variants: any = {
      api_call: "default",
      user_action: "secondary",
      admin_action: "outline",
      error: "destructive"
    }
    return <Badge variant={variants[type] || "default"}>{type}</Badge>
  }

  const columns = [
    {
      key: "created_at",
      label: "Data/Hora",
      render: (log: any) => new Date(log.created_at).toLocaleString('pt-BR')
    },
    {
      key: "log_type",
      label: "Tipo",
      render: (log: any) => getLogTypeBadge(log.log_type)
    },
    {
      key: "action",
      label: "Ação",
      render: (log: any) => log.action || "-"
    },
    {
      key: "user_id",
      label: "Usuário",
      render: (log: any) => log.user_id ? log.user_id.substring(0, 8) + "..." : "Sistema"
    },
    {
      key: "metadata",
      label: "Detalhes",
      render: (log: any) => (
        <details className="cursor-pointer">
          <summary className="text-sm text-muted-foreground">Ver mais</summary>
          <pre className="text-xs mt-2 p-2 bg-muted rounded">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </details>
      )
    }
  ]

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
        <h1 className="text-3xl font-bold">Logs do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          {logs.length} registros encontrados
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={logType} onValueChange={setLogType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="api_call">API Calls</SelectItem>
            <SelectItem value="user_action">Ações de Usuário</SelectItem>
            <SelectItem value="admin_action">Ações Admin</SelectItem>
            <SelectItem value="error">Erros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminTable
        data={logs}
        columns={columns}
      />
    </div>
  )
}

export default AdminLogs
