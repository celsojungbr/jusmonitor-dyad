import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface LogEntry {
  id: string
  created_at: string
  log_type: string
  user_id: string | null
  action: string
  metadata: any
}

const AdminEscavadorLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await AdminApiService.getEscavadorLogs(100)
      setLogs(data || [])
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast({
        title: "Erro ao carregar logs",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getLogIcon = (action: string) => {
    if (action.includes('sucesso')) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    } else if (action.includes('erro') || action.includes('error')) {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getLogBadge = (logType: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      api_call: "default",
      error: "destructive",
      admin_action: "secondary"
    }
    return <Badge variant={variants[logType] || "default"}>{logType}</Badge>
  }

  const formatMetadata = (metadata: any) => {
    if (!metadata) return '-'
    
    const important = []
    
    if (metadata.document) important.push(`Doc: ${metadata.document}`)
    if (metadata.status) important.push(`Status: ${metadata.status}`)
    if (metadata.results_count !== undefined) important.push(`Resultados: ${metadata.results_count}`)
    if (metadata.credits_consumed !== undefined) important.push(`Créditos: ${metadata.credits_consumed}`)
    if (metadata.error) important.push(`Erro: ${metadata.error}`)
    if (metadata.details) important.push(`Detalhes: ${metadata.details}`)
    
    return important.length > 0 ? important.join(' | ') : JSON.stringify(metadata).substring(0, 100)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs do Escavador</h1>
          <p className="text-muted-foreground mt-2">
            Histórico detalhado de chamadas à API Escavador
          </p>
        </div>
        <Button onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas 100 Chamadas</CardTitle>
          <CardDescription>
            Logs de sucesso, erro e debug da integração com Escavador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                Execute uma consulta no Escavador para ver os logs aqui
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead className="w-[200px]">Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {getLogBadge(log.log_type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLogIcon(log.action)}
                          <span className="text-sm">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatMetadata(log.metadata)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sucessos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.action.includes('sucesso')).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.action.includes('erro') || l.action.includes('error')).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Créditos Consumidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.reduce((sum, l) => sum + (l.metadata?.credits_consumed || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminEscavadorLogs