import { useEffect, useState } from "react"
import { AdminApiService } from "@/features/admin"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Activity, AlertCircle } from "lucide-react"
import { AdminTable } from "@/components/admin/AdminTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const AdminApis = () => {
  const [balances, setBalances] = useState<any>(null)
  const [configs, setConfigs] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [balanceData, configData]: [any, any] = await Promise.all([
        AdminApiService.checkApiBalance(),
        AdminApiService.listApiConfigurations()
      ])

      setBalances((balanceData as any).balances)
      setConfigs((configData as any).configurations || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar dados das APIs",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const data: any = await AdminApiService.getApiLogs()
      setLogs(data.logs || [])
    } catch (error) {
      toast({
        title: "Erro ao carregar logs",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setLogsLoading(false)
    }
  }

  const refreshBalances = async () => {
    setRefreshing(true)
    try {
      const data: any = await AdminApiService.checkApiBalance()
      setBalances(data.balances)
      toast({
        title: "Saldo atualizado",
        description: "Os saldos foram atualizados com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar saldo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  const columns = [
    {
      key: "api_name",
      label: "API",
      render: (config: any) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase">{config.api_name}</span>
          {config.is_active ? (
            <Badge variant="default">Ativa</Badge>
          ) : (
            <Badge variant="secondary">Inativa</Badge>
          )}
        </div>
      )
    },
    {
      key: "endpoint_url",
      label: "Endpoint",
      render: (config: any) => (
        <span className="text-sm text-muted-foreground">{config.endpoint_url}</span>
      )
    },
    {
      key: "priority",
      label: "Prioridade",
      render: (config: any) => config.priority
    },
    {
      key: "rate_limit",
      label: "Rate Limit",
      render: (config: any) => `${config.rate_limit}/min`
    },
    {
      key: "last_health_check",
      label: "Última Verificação",
      render: (config: any) => config.last_health_check 
        ? new Date(config.last_health_check).toLocaleString('pt-BR')
        : "Nunca"
    }
  ]

  const logColumns = [
    {
      key: "created_at",
      label: "Data/Hora",
      render: (log: any) => new Date(log.created_at).toLocaleString('pt-BR')
    },
    {
      key: "action",
      label: "Ação",
      render: (log: any) => (
        <Badge variant="outline">{log.action}</Badge>
      )
    },
    {
      key: "log_type",
      label: "Tipo",
      render: (log: any) => {
        const variants: Record<string, "default" | "secondary" | "destructive"> = {
          api_call: "default",
          admin_action: "secondary",
          error: "destructive"
        }
        return <Badge variant={variants[log.log_type] || "default"}>{log.log_type}</Badge>
      }
    },
    {
      key: "metadata",
      label: "Detalhes",
      render: (log: any) => (
        <div className="text-xs max-w-md truncate">
          {log.metadata?.provider && (
            <span className="font-semibold">{log.metadata.provider}: </span>
          )}
          {log.metadata?.error && (
            <span className="text-red-600">{log.metadata.error}</span>
          )}
          {log.metadata?.balances && (
            <span>Saldos verificados</span>
          )}
        </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de APIs</h1>
          <p className="text-muted-foreground mt-2">
            Configurações e saldos dos provedores
          </p>
        </div>
        <Button onClick={refreshBalances} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar Saldos
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* JUDiT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>JUDiT API</span>
              {balances?.judit?.success ? (
                <Activity className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balances?.judit?.success ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Saldo:</span>
                  <span className="font-semibold">{balances.judit.balance || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Consumido:</span>
                  <span>{balances.judit.consumed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span>{balances.judit.total || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Última verificação: {new Date(balances.judit.lastCheck).toLocaleString('pt-BR')}
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-600">
                Erro: {balances?.judit?.error || "Não disponível"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escavador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Escavador API</span>
              {balances?.escavador?.success ? (
                <Activity className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balances?.escavador?.success ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Saldo:</span>
                  <span className="font-semibold">{balances.escavador.balance || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Consumido:</span>
                  <span>{balances.escavador.consumed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span>{balances.escavador.total || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Última verificação: {new Date(balances.escavador.lastCheck).toLocaleString('pt-BR')}
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-600">
                Erro: {balances?.escavador?.error || "Não disponível"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configs" className="w-full">
        <TabsList>
          <TabsTrigger value="configs">Configurações</TabsTrigger>
          <TabsTrigger value="logs" onClick={loadLogs}>Logs de API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminTable
                data={configs}
                columns={columns}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Logs de Chamadas de API</span>
                <Button onClick={loadLogs} disabled={logsLoading} size="sm" variant="outline">
                  <RefreshCw className={`h-3 w-3 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <AdminTable
                  data={logs}
                  columns={logColumns}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminApis
