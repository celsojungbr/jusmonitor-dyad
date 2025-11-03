import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { AdminApiService } from '../services/adminApiService'
import { FEATURES_CONFIG } from '../config/featuresConfig'
import { EdgeFunctionConfig } from '../types/feature.types'
import { Loader2 } from 'lucide-react'

export const FeatureManagement = () => {
  const [configs, setConfigs] = useState<EdgeFunctionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const data = await AdminApiService.getFeatureConfigs()
      // Cast dos dados para o tipo correto
      const typedData = data.map(config => ({
        ...config,
        enabled_apis: Array.isArray(config.enabled_apis) ? config.enabled_apis : [],
        api_priority: Array.isArray(config.api_priority) ? config.api_priority : []
      })) as EdgeFunctionConfig[]
      setConfigs(typedData)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProviderToggle = async (
    functionName: string,
    providerName: string,
    enabled: boolean
  ) => {
    const currentConfig = configs.find(c => c.function_name === functionName)
    if (!currentConfig) return

    try {
      setUpdating(functionName)

      let enabledApis = [...currentConfig.enabled_apis]
      
      if (enabled) {
        if (!enabledApis.includes(providerName)) {
          enabledApis.push(providerName)
        }
      } else {
        enabledApis = enabledApis.filter(api => api !== providerName)
      }

      const newStatus = enabledApis.length > 0 ? 'active' : 'inactive'

      await AdminApiService.updateFeatureConfig(
        functionName,
        enabledApis,
        enabledApis, // api_priority igual a enabled_apis por ora
        currentConfig.fallback_enabled,
        newStatus
      )

      await loadConfigs()

      toast({
        title: 'Sucesso',
        description: `Provider ${enabled ? 'ativado' : 'desativado'} com sucesso`
      })
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a configuração',
        variant: 'destructive'
      })
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestão de Processos</h2>
        <p className="text-muted-foreground mt-1">
          Configure quais provedores serão utilizados em cada funcionalidade
        </p>
      </div>

      {FEATURES_CONFIG.map(feature => {
        const featureFunctions = feature.functions.map(func => {
          const config = configs.find(c => c.function_name === func.functionName)
          return { ...func, config }
        })

        const allActive = featureFunctions.every(f => f.config?.status === 'active')
        const someActive = featureFunctions.some(f => f.config?.status === 'active')

        return (
          <Card key={feature.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {feature.name}
                    <Badge variant={allActive ? 'default' : someActive ? 'secondary' : 'outline'}>
                      {allActive ? 'ATIVA' : someActive ? 'PARCIAL' : 'INATIVA'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {feature.functions.map(func => {
                const config = configs.find(c => c.function_name === func.functionName)
                const isUpdating = updating === func.functionName

                return (
                  <div key={func.functionName} className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Edge Function: {func.displayName}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Provedores Disponíveis:</div>
                      
                      {func.availableProviders.map((provider, index) => {
                        const isEnabled = config?.enabled_apis.includes(provider.name) || false
                        const priorityIndex = config?.api_priority.indexOf(provider.name) ?? -1
                        const priority = priorityIndex >= 0 ? priorityIndex + 1 : null

                        return (
                          <div
                            key={provider.name}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{provider.displayName}</span>
                              {priority && (
                                <Badge variant="secondary" className="text-xs">
                                  {priority}º
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isUpdating && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                              <Switch
                                checked={isEnabled}
                                disabled={isUpdating || !config}
                                onCheckedChange={(checked) =>
                                  handleProviderToggle(func.functionName, provider.name, checked)
                                }
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {config && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Configurações:</span>
                        </div>
                        <div className="text-muted-foreground">
                          • Fallback: {config.fallback_enabled ? 'Habilitado' : 'Desabilitado'}
                        </div>
                        {config.enabled_apis.length > 1 && (
                          <div className="text-muted-foreground">
                            • Execução simultânea de múltiplos provedores
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
