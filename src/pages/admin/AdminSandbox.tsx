import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code,
  FileText,
  Loader2
} from "lucide-react"

// Lista de edge functions disponíveis para teste
const EDGE_FUNCTIONS = [
  { value: "search-document-orchestrator", label: "Busca por CPF/CNPJ (Orchestrator)", params: ["cpf", "cnpj"], creditCost: 10 },
  { value: "search-processes-simple", label: "Busca Processual Simples", params: ["cpf", "cnpj", "oab"], creditCost: 5 },
  { value: "search-processes-async", label: "Busca Processual Assíncrona", params: ["cpf", "cnpj", "oab"], creditCost: 10 },
  { value: "judit-search-document", label: "JUDiT - Busca por Documento", params: ["cpf", "cnpj"], creditCost: 8 },
  { value: "escavador_consulta_CPF_CNPJ", label: "Escavador - Consulta CPF/CNPJ", params: ["cpf", "cnpj"], creditCost: 8 },
  { value: "search-criminal-records", label: "Busca de Antecedentes Criminais", params: ["cpf", "cnj"], creditCost: 5 },
  { value: "search-registration-data", label: "Busca de Dados Cadastrais", params: ["cpf", "cnpj"], creditCost: 3 },
  { value: "check-judit-request-status", label: "Verificar Status JUDiT", params: ["requestId"], creditCost: 0 },
  { value: "check-api-balance", label: "Verificar Saldo de APIs", params: [], creditCost: 0 },
  { value: "get-process-details", label: "Detalhes de Processo", params: ["cnj"], creditCost: 2 },
]

// Validação de parâmetros
const validateParameter = (paramType: string, value: string): boolean => {
  if (!value.trim()) return false
  
  switch(paramType) {
    case 'cpf':
      return /^\d{11}$/.test(value.replace(/\D/g, ''))
    case 'cnpj':
      return /^\d{14}$/.test(value.replace(/\D/g, ''))
    case 'cnj':
      return /^\d{20}$/.test(value.replace(/\D/g, ''))
    case 'requestId':
      return /^[a-f0-9-]{36}$/i.test(value)
    case 'oab':
      return value.length >= 3
    default:
      return true
  }
}

// Construir payload específico para cada função
const buildPayload = (functionName: string, paramType: string, paramValue: string, userId: string) => {
  const payloadMap: Record<string, any> = {
    'search-document-orchestrator': {
      document: paramValue,
      documentType: paramType,
      userId
    },
    'search-registration-data': {
      documentType: paramType,
      document: paramValue,
      userId
    },
    'search-criminal-records': 
      paramType === 'cpf' 
        ? { cpf: paramValue, userId }
        : { cnj: paramValue, userId },
    'search-processes-simple': {
      searchType: paramType,
      searchValue: paramValue,
      userId
    },
    'search-processes-async': {
      searchType: paramType,
      searchValue: paramValue,
      userId
    },
    'judit-search-document': {
      document: paramValue,
      documentType: paramType,
      userId
    },
    'escavador_consulta_CPF_CNPJ': {
      [paramType]: paramValue,
      userId
    },
    'get-process-details': {
      cnjNumber: paramValue
    },
    'check-judit-request-status': {
      requestId: paramValue
    },
    'check-api-balance': {}
  }

  return payloadMap[functionName] || {}
}

interface TestResult {
  id: string
  functionName: string
  parameter: string
  parameterType: string
  timestamp: Date
  duration: number
  status: "success" | "error" | "running"
  statusCode?: number
  logs: string[]
  response: any
  error?: string
}

const AdminSandbox = () => {
  const [selectedFunction, setSelectedFunction] = useState<string>("")
  const [parameter, setParameter] = useState<string>("")
  const [parameterType, setParameterType] = useState<string>("cpf")
  const [isRunning, setIsRunning] = useState(false)
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null)
  const [testHistory, setTestHistory] = useState<TestResult[]>([])
  const { toast } = useToast()

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sandbox-test-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTestHistory(parsed.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })))
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      }
    }
  }, [])

  // Salvar histórico no localStorage
  useEffect(() => {
    if (testHistory.length > 0) {
      localStorage.setItem('sandbox-test-history', JSON.stringify(testHistory))
    }
  }, [testHistory])

  const addLog = (message: string) => {
    setCurrentResult(prev => prev ? {
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString('pt-BR')}] ${message}`]
    } : null)
  }

  const executeTest = async () => {
    if (!selectedFunction) {
      toast({
        title: "Função não selecionada",
        description: "Selecione uma edge function para testar",
        variant: "destructive"
      })
      return
    }

    // Obter userId autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para executar testes",
        variant: "destructive"
      })
      return
    }
    const userId = user.id

    // Validar parâmetro se necessário
    if (selectedFunctionData?.params.length && selectedFunctionData.params.length > 0) {
      if (!validateParameter(parameterType, parameter)) {
        toast({
          title: "Parâmetro inválido",
          description: `O ${parameterType.toUpperCase()} fornecido não é válido`,
          variant: "destructive"
        })
        return
      }
    }

    const startTime = Date.now()
    const testId = `test-${Date.now()}`

    const initialResult: TestResult = {
      id: testId,
      functionName: selectedFunction,
      parameter,
      parameterType,
      timestamp: new Date(),
      duration: 0,
      status: "running",
      logs: [],
      response: null
    }

    setCurrentResult(initialResult)
    setIsRunning(true)

    try {
      addLog(`Iniciando teste da função: ${selectedFunction}`)
      addLog(`Parâmetro: ${parameter || 'Nenhum'}`)
      addLog(`Tipo: ${parameterType}`)
      addLog(`User ID: ${userId}`)
      addLog('Construindo payload...')

      // Construir payload usando a função helper
      const payload = buildPayload(selectedFunction, parameterType, parameter, userId)

      addLog(`Payload: ${JSON.stringify(payload)}`)
      addLog('Enviando requisição...')

      const response = await supabase.functions.invoke(selectedFunction, {
        body: payload
      })

      const duration = Date.now() - startTime

      if (response.error) {
        addLog(`❌ Erro na requisição: ${response.error.message}`)

        // Categorizar erro
        let errorCategory = 'API Error'
        const errorMsg = response.error.message?.toLowerCase() || ''
        
        if (errorMsg.includes('crédito') || errorMsg.includes('saldo')) {
          errorCategory = 'Créditos Insuficientes'
        } else if (errorMsg.includes('autenticação') || errorMsg.includes('unauthorized')) {
          errorCategory = 'Erro de Autenticação'
        } else if (errorMsg.includes('configuração') || errorMsg.includes('config')) {
          errorCategory = 'Configuração de API'
        } else if (errorMsg.includes('timeout') || errorMsg.includes('tempo')) {
          errorCategory = 'Timeout'
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          errorCategory = 'Recurso Não Encontrado'
        }
        
        addLog(`📁 Categoria: ${errorCategory}`)

        const errorResult: TestResult = {
          ...initialResult,
          status: "error",
          duration,
          error: response.error.message,
          response: response.error
        }

        setCurrentResult(errorResult)
        setTestHistory(prev => [errorResult, ...prev].slice(0, 50))

        toast({
          title: "Erro no teste",
          description: `${errorCategory}: ${response.error.message}`,
          variant: "destructive"
        })
      } else {
        addLog(`✅ Requisição concluída com sucesso`)
        addLog(`Tempo de resposta: ${duration}ms`)
        addLog(`Status: 200 OK`)

        const successResult: TestResult = {
          ...initialResult,
          status: "success",
          duration,
          statusCode: 200,
          response: response.data
        }

        setCurrentResult(successResult)
        setTestHistory(prev => [successResult, ...prev].slice(0, 50))

        toast({
          title: "Teste concluído",
          description: `Executado em ${duration}ms`,
        })
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

      addLog(`❌ Erro na execução: ${errorMessage}`)

      const errorResult: TestResult = {
        ...initialResult,
        status: "error",
        duration,
        error: errorMessage,
        response: null
      }

      setCurrentResult(errorResult)
      setTestHistory(prev => [errorResult, ...prev].slice(0, 50))

      toast({
        title: "Erro na execução",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Sucesso</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      case 'running':
        return <Badge className="bg-blue-500">Executando</Badge>
    }
  }

  const selectedFunctionData = EDGE_FUNCTIONS.find(f => f.value === selectedFunction)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sandbox - Teste de APIs</h1>
        <p className="text-muted-foreground mt-2">
          Teste e valide o funcionamento das edge functions e APIs de fornecedores
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Teste</CardTitle>
          <CardDescription>
            Selecione a função e insira os parâmetros necessários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Função */}
            <div className="space-y-2">
              <Label htmlFor="function">Edge Function</Label>
              <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                <SelectTrigger id="function">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {EDGE_FUNCTIONS.map((func) => (
                    <SelectItem key={func.value} value={func.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{func.label}</span>
                        {func.creditCost > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            💳 {func.creditCost}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFunctionData && selectedFunctionData.creditCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  💳 Custo: {selectedFunctionData.creditCost} créditos
                </p>
              )}
            </div>

            {/* Tipo de Parâmetro */}
            {selectedFunctionData && selectedFunctionData.params.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="param-type">Tipo de Parâmetro</Label>
                <Select value={parameterType} onValueChange={setParameterType}>
                  <SelectTrigger id="param-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFunctionData.params.map((param) => (
                      <SelectItem key={param} value={param}>
                        {param.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Parâmetro */}
            {selectedFunctionData && selectedFunctionData.params.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parameter">Parâmetro</Label>
                <div className="flex gap-2">
                  <Input
                    id="parameter"
                    placeholder={`Digite o ${parameterType.toUpperCase()}`}
                    value={parameter}
                    onChange={(e) => setParameter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isRunning && executeTest()}
                  />
                  <Button
                    onClick={executeTest}
                    disabled={isRunning || !selectedFunction}
                    className="shrink-0"
                  >
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Botão para funções sem parâmetros */}
            {selectedFunctionData && selectedFunctionData.params.length === 0 && (
              <div className="space-y-2">
                <Label>Executar</Label>
                <Button
                  onClick={executeTest}
                  disabled={isRunning}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Executar Teste
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {currentResult && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs e Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Summary */}
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Status:</span>
                  {getStatusBadge(currentResult.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Duração:</span>
                  <span className="text-sm">{currentResult.duration}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Função:</span>
                  <span className="text-sm font-mono">{currentResult.functionName}</span>
                </div>
                {currentResult.parameter && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Parâmetro:</span>
                    <span className="text-sm">{currentResult.parameterType}: {currentResult.parameter}</span>
                  </div>
                )}
                {currentResult.error && (
                  <div className="pt-2 border-t">
                    <span className="font-semibold text-red-600">Erro:</span>
                    <p className="text-sm text-red-600 mt-1">{currentResult.error}</p>
                  </div>
                )}
              </div>

              {/* Logs */}
              <div>
                <h4 className="font-semibold mb-2">Logs de Execução:</h4>
                <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-xs space-y-1 max-h-[400px] overflow-y-auto">
                  {currentResult.logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Resposta da API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="formatted" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="formatted">Formatado</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="formatted" className="mt-4">
                  <div className="bg-muted rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    {currentResult.response ? (
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(currentResult.response, null, 2)}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center text-muted-foreground py-8">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Nenhuma resposta disponível
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="raw" className="mt-4">
                  <div className="bg-black text-white rounded-lg p-4 font-mono text-xs max-h-[500px] overflow-y-auto">
                    {currentResult.response ? (
                      <pre>{JSON.stringify(currentResult.response)}</pre>
                    ) : (
                      <div className="flex items-center justify-center text-gray-400 py-8">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Nenhuma resposta disponível
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Testes
            {testHistory.length > 0 && (
              <Badge variant="secondary">{testHistory.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Últimos testes executados no sandbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum teste realizado</h3>
              <p className="text-muted-foreground">
                Execute um teste acima para ver o histórico aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {testHistory.map((test) => (
                <Collapsible key={test.id}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(test.status)}
                            <div className="text-left">
                              <div className="font-semibold">{test.functionName}</div>
                              <div className="text-sm text-muted-foreground">
                                {test.parameter && `${test.parameterType}: ${test.parameter}`}
                                {!test.parameter && 'Sem parâmetros'}
                                {' • '}
                                {test.timestamp.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{test.duration}ms</Badge>
                            {getStatusBadge(test.status)}
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4 border-t">
                        <div className="space-y-4 mt-4">
                          {/* Logs */}
                          <div>
                            <h5 className="font-semibold mb-2 text-sm">Logs:</h5>
                            <div className="bg-black text-green-400 rounded p-3 font-mono text-xs max-h-[200px] overflow-y-auto">
                              {test.logs.map((log, idx) => (
                                <div key={idx}>{log}</div>
                              ))}
                            </div>
                          </div>
                          {/* Response */}
                          {test.response && (
                            <div>
                              <h5 className="font-semibold mb-2 text-sm">Resposta:</h5>
                              <div className="bg-muted rounded p-3 text-xs max-h-[200px] overflow-y-auto">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(test.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          {/* Error */}
                          {test.error && (
                            <div>
                              <h5 className="font-semibold mb-2 text-sm text-red-600">Erro:</h5>
                              <div className="bg-red-50 dark:bg-red-950 rounded p-3 text-sm text-red-600">
                                {test.error}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminSandbox
