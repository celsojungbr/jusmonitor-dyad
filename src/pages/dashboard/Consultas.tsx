import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { ConsultasTabs } from "@/features/consultas/components/ConsultasTabs"
import { HistoricoBuscas } from "@/features/consultas/components/HistoricoBuscas"
import { ConsultaProcessualData, ConsultaCadastralData, ConsultaPenalData, Busca } from "@/features/consultas/types/consulta.types"
import { Process } from "@/shared/types/database.types"
import { ConsultaService } from "@/features/consultas/services/consultaService"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const Consultas = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [buscas, setBuscas] = useState<Busca[]>([])
  const [processosCache, setProcessosCache] = useState<Record<string, Process[]>>({})
  const [dadosCadastraisCache, setDadosCadastraisCache] = useState<Record<string, any>>({})
  const [dadosPenaisCache, setDadosPenaisCache] = useState<Record<string, any>>({})
  const [buscasOcultas, setBuscasOcultas] = useState<Set<string>>(new Set()) // IDs das buscas ocultadas pelo usuário
  
  // Estado para busca simples e aprofundamento
  const [simpleSearchResult, setSimpleSearchResult] = useState<any>(null)
  const [deepSearchInProgress, setDeepSearchInProgress] = useState<any>(null)
  
  // Estados para UX de loading com etapas
  const [loadingStep, setLoadingStep] = useState<string>('')
  const [searchStartTime, setSearchStartTime] = useState<number>(0)

  // Carregar histórico de buscas com delay para melhor UX inicial
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id
        if (!userId) return

        // Buscar histórico de buscas do usuário
        const { data: searches, error } = await supabase
          .from('user_searches')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Erro ao carregar histórico:', error)
          return
        }

        if (!searches || searches.length === 0) return

        // Transformar dados do banco para formato Busca
        const buscasCarregadas: Busca[] = searches.map((search) => {
          // Determinar o tipo de busca baseado no search_type
          let tipo: 'processual' | 'cadastral' | 'penal' = 'processual'
          let tipoIdentificador: 'cpf' | 'cnpj' | 'cnj' | 'oab' | undefined = undefined
          
          // SearchType pode ser: 'cpf' | 'cnpj' | 'cnj' | 'oab'
          if (['cpf', 'cnpj', 'cnj', 'oab'].includes(search.search_type)) {
            tipo = 'processual'
            tipoIdentificador = search.search_type as 'cpf' | 'cnpj' | 'cnj' | 'oab'
          }
          
          return {
            id: search.id,
            tipo,
            tipoIdentificador,
            valor: search.search_value,
            resultados: search.results_count || 0,
            data: new Date(search.created_at),
            fromCache: search.from_cache || false,
            creditsConsumed: search.credits_consumed || 0,
            apiUsed: (search.api_used || 'escavador') as 'judit' | 'escavador'
          }
        })

        setBuscas(buscasCarregadas)

        // Lazy load processos após renderizar UI inicial
        setTimeout(() => {
          loadProcessosParaBuscas(buscasCarregadas)
        }, 300)
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      }
    }

    // Delay de 400ms para não bloquear renderização inicial
    const timer = setTimeout(() => {
      loadSearchHistory()
    }, 400)

    return () => clearTimeout(timer)
  }, [])

  const loadProcessosParaBuscas = async (buscasCarregadas: Busca[]) => {
    try {
      // Carregar processos relacionados para cada busca processual
        const processosPromises = buscasCarregadas
          .filter(b => b.tipo === 'processual' && b.resultados > 0) // Apenas buscas com resultados
          .map(async (busca) => {
            try {
              let query = supabase
                .from('processes')
                .select('*')

              // Diferenciar filtro por tipo de identificador
              if (busca.tipoIdentificador === 'cnj') {
                // Para CNJ, buscar pelo número CNJ diretamente
                query = query.eq('cnj_number', busca.valor.replace(/\s/g, ''))
              } else if (busca.tipoIdentificador === 'cpf' || busca.tipoIdentificador === 'cnpj') {
                // Para CPF/CNPJ, usar filtro contains com JSON válido
                const onlyDigits = busca.valor.replace(/\D/g, '')
                const jsonArray = JSON.stringify([onlyDigits])
                query = query.filter('parties_cpf_cnpj', 'cs', jsonArray)
              } else {
                // Outros tipos não suportados ainda
                return { buscaId: busca.id, processos: [] }
              }

              const { data: procs, error: procsError } = await query.order('distribution_date', { ascending: false })

              if (procsError) {
                console.error(`Erro ao carregar processos para busca ${busca.id}:`, procsError)
                return { buscaId: busca.id, processos: [] }
              }

              const processos: Process[] = (procs || []).map(p => ({
                ...p,
                author_names: Array.isArray(p.author_names) ? p.author_names : [],
                defendant_names: Array.isArray(p.defendant_names) ? p.defendant_names : [],
                parties_cpf_cnpj: Array.isArray(p.parties_cpf_cnpj) ? p.parties_cpf_cnpj : []
              })) as Process[]

              return { buscaId: busca.id, processos }
            } catch (error) {
              console.error(`Erro ao processar busca ${busca.id}:`, error)
              return { buscaId: busca.id, processos: [] }
            }
          })

        const processosResults = await Promise.all(processosPromises)
        
        const newCache: Record<string, Process[]> = {}
        processosResults.forEach(result => {
          newCache[result.buscaId] = result.processos
        })

        setProcessosCache(newCache)

        console.log(`Histórico carregado: ${buscasCarregadas.length} buscas`)
    } catch (error) {
      console.error('Erro ao carregar processos:', error)
    }
  }

  // Polling para buscas assíncronas
  useEffect(() => {
    if (!deepSearchInProgress) return

    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('async_searches')
          .select('*')
          .eq('id', deepSearchInProgress.async_search_id)
          .single()

        if (error) {
          console.error('Erro ao verificar status da busca:', error)
          return
        }

        if (data.status === 'completed') {
          console.log('Busca assíncrona concluída!')
          
          // Buscar processos encontrados
          const onlyDigits = String(deepSearchInProgress.searchValue ?? '').replace(/\D/g, '')
          const jsonArray = JSON.stringify([onlyDigits])
          const { data: rawProcesses } = await supabase
            .from('processes')
            .select('*')
            .filter('parties_cpf_cnpj', 'cs', jsonArray)
            .order('distribution_date', { ascending: false })

          // Garantir que os tipos estão corretos
          const processes: Process[] = (rawProcesses || []).map(p => ({
            ...p,
            author_names: Array.isArray(p.author_names) ? p.author_names : [],
            defendant_names: Array.isArray(p.defendant_names) ? p.defendant_names : [],
            parties_cpf_cnpj: Array.isArray(p.parties_cpf_cnpj) ? p.parties_cpf_cnpj : []
          })) as Process[]

          const buscaId = Date.now().toString()
          const novaBusca: Busca = {
            id: buscaId,
            tipo: 'processual',
            tipoIdentificador: deepSearchInProgress.searchType,
            valor: deepSearchInProgress.searchValue,
            resultados: data.results_count,
            data: new Date(),
            fromCache: false,
            creditsConsumed: deepSearchInProgress.credits_consumed,
            apiUsed: 'judit'
          }

          setBuscas(prev => [novaBusca, ...prev])
          setProcessosCache(prev => ({ ...prev, [buscaId]: processes }))
          setDeepSearchInProgress(null)
          setSimpleSearchResult(null)

          toast({
            title: "Busca completa finalizada!",
            description: `${data.results_count} processo(s) encontrado(s) nos tribunais`,
          })

          clearInterval(pollInterval)
        } else if (data.status === 'failed') {
          console.error('Busca assíncrona falhou:', data.error_message)
          setDeepSearchInProgress(null)
          
          toast({
            title: "Erro na busca completa",
            description: data.error_message || "A busca falhou. Tente novamente.",
            variant: "destructive"
          })

          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Erro no polling:', error)
      }
    }, 5000) // Verificar a cada 5 segundos

    return () => clearInterval(pollInterval)
  }, [deepSearchInProgress, toast])

  const handleConsultaProcessual = async (data: ConsultaProcessualData) => {
    setSearchStartTime(Date.now())
    setLoading(true)
    setLoadingStep('Conectando à API...')
    setSimpleSearchResult(null)
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id

      // Para CPF/CNPJ: usar nova função Escavador v2
      if (data.tipoIdentificador === 'cpf' || data.tipoIdentificador === 'cnpj') {
        console.log('Iniciando busca CPF/CNPJ:', data.valor)
        
        setLoadingStep('Criando requisição de busca...')
        
        const response = await supabase.functions.invoke('search-document-orchestrator', {
          body: {
            userId,
            document: data.valor
          }
        })

        console.log('Resposta da função:', response)
        
        setLoadingStep('Recebendo dados dos processos...')

        if (response.error) {
          console.error('Erro na invocação:', response.error)
          throw response.error
        }

        const result = response.data

        if (!result) {
          throw new Error('Resposta vazia da API')
        }

        // Tratar erros específicos
        if (result.error) {
          if (result.error === 'Unauthenticated') {
            toast({
              title: "Erro de autenticação",
              description: "Problema com as credenciais da API de busca",
              variant: "destructive",
            })
          } else if (result.error.includes('saldo')) {
            toast({
              title: "Sem créditos na API",
              description: "Você não possui saldo para realizar esta busca",
              variant: "destructive",
            })
          } else if (result.error.includes('Timeout')) {
            toast({
              title: "Tempo esgotado",
              description: "A busca demorou muito. Tente novamente.",
              variant: "destructive",
            })
          } else {
            throw new Error(result.error)
          }
          return
        }

        console.log('Resultados encontrados:', result.results_count)
        
        setLoadingStep('Organizando resultados...')

        const buscaId = Date.now().toString()
        const novaBusca: Busca = {
          id: buscaId,
          tipo: 'processual',
          tipoIdentificador: data.tipoIdentificador,
          valor: data.valor,
          resultados: result.results_count || 0,
          data: new Date(),
          fromCache: false,
          creditsConsumed: 0,
          apiUsed: result.provider || 'unknown'
        }

        setBuscas([novaBusca, ...buscas])

        // Detectar formato da resposta (JUDiT ou Escavador)
        let processosMapeados: Process[] = []

        if (result.lawsuits) {
          // Formato JUDiT
          console.log('Processando resultados JUDiT:', result.lawsuits.length)
          
          processosMapeados = result.lawsuits.map((lawsuit: any) => {
            const authors = lawsuit.parties
              ?.filter((p: any) => p.side === 'Active')
              .map((p: any) => p.name) || []
            
            const defendants = lawsuit.parties
              ?.filter((p: any) => p.side === 'Passive')
              .map((p: any) => p.name) || []
            
            const documents = lawsuit.parties
              ?.filter((p: any) => p.document)
              .map((p: any) => p.document) || []

            return {
              id: lawsuit.code,
              cnj_number: lawsuit.code,
              tribunal: lawsuit.tribunal_acronym || 'Desconhecido',
              court_name: lawsuit.courts?.[0]?.name || null,
              distribution_date: lawsuit.distribution_date || null,
              status: lawsuit.status || null,
              phase: lawsuit.phase || null,
              case_value: lawsuit.amount || null,
              author_names: authors,
              defendant_names: defendants,
              parties_cpf_cnpj: documents.length > 0 ? documents : [data.valor.replace(/\D/g, '')],
              last_update: new Date().toISOString(),
              created_at: new Date().toISOString(),
            } as Process
          })
        } else if (result.items) {
          // Formato Escavador
          console.log('Processando resultados Escavador:', result.items.length)
          
          processosMapeados = result.items.map((item: any) => ({
            id: item.numero_cnj,
            cnj_number: item.numero_cnj,
            tribunal: item.fontes?.[0]?.sigla || item.fontes?.[0]?.tribunal?.sigla || 'Desconhecido',
            court_name: item.fontes?.[0]?.nome || null,
            distribution_date: item.data_inicio || null,
            status: item.fontes?.[0]?.status_predito || item.fontes?.[0]?.capa?.situacao || null,
            author_names: item.titulo_polo_ativo ? [item.titulo_polo_ativo] : [],
            defendant_names: item.titulo_polo_passivo ? [item.titulo_polo_passivo] : [],
            parties_cpf_cnpj: [data.valor.replace(/\D/g, '')],
            last_update: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })) as Process[]
        }

        setProcessosCache(prev => ({ ...prev, [buscaId]: processosMapeados }))

        // Guardar resultado para opção de aprofundamento
        setSimpleSearchResult({
          searchType: data.tipoIdentificador,
          searchValue: data.valor,
          results: processosMapeados,
          resultsCount: result.results_count
        })

        // Calcular estatísticas para o toast
        const executionTimeSeconds = Math.round((Date.now() - searchStartTime) / 1000)
        const totalProcessos = processosMapeados.length
        const processosAtivos = processosMapeados.filter(p => 
          p.status?.toLowerCase().includes('ativo') || 
          p.phase?.toLowerCase().includes('ativo')
        ).length
        const processosInativos = totalProcessos - processosAtivos

        toast({
          title: `✅ Busca concluída em ${executionTimeSeconds}s`,
          description: `${totalProcessos} processo(s) encontrado(s) (${processosAtivos} ativos, ${processosInativos} inativos)`,
          duration: 5000,
        })
      } else {
        // Para CNJ/OAB: usar lógica anterior
        const response = await supabase.functions.invoke('search-processes-simple', {
          body: {
            searchType: data.tipoIdentificador,
            searchValue: data.valor,
            userId
          }
        })

        if (response.error) throw response.error

        const simpleResult = response.data
        
        const buscaId = Date.now().toString()
        const novaBusca: Busca = {
          id: buscaId,
          tipo: 'processual',
          tipoIdentificador: data.tipoIdentificador,
          valor: data.valor,
          resultados: simpleResult.results_count,
          data: new Date(),
          fromCache: simpleResult.from_cache,
          creditsConsumed: 0,
          apiUsed: 'escavador'
        }
        
        setBuscas([novaBusca, ...buscas])
        setProcessosCache(prev => ({ ...prev, [buscaId]: simpleResult.processes || [] }))
        
        // Guardar resultado para opção de aprofundamento
        setSimpleSearchResult({
          searchType: data.tipoIdentificador,
          searchValue: data.valor,
          results: simpleResult.processes || [],
          resultsCount: simpleResult.results_count
        })

        toast({
          title: "Busca simples concluída (gratuita)",
          description: `${simpleResult.results_count} processo(s) encontrado(s)`,
        })
      }
    } catch (error: any) {
      console.error('Erro na consulta simples:', error)
      
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível realizar a consulta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingStep('')
      setSearchStartTime(0)
    }
  }

  const handleDeepSearch = async () => {
    if (!simpleSearchResult) return

    setLoading(true)
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      
      const response = await supabase.functions.invoke('search-processes-async', {
        body: {
          searchType: simpleSearchResult.searchType,
          searchValue: simpleSearchResult.searchValue,
          userId
        }
      })

      if (response.error) throw response.error

      const asyncResult = response.data

      if (asyncResult.status === 'processing') {
        // Busca assíncrona iniciada
        setDeepSearchInProgress({
          async_search_id: asyncResult.async_search_id,
          request_id: asyncResult.request_id,
          searchType: simpleSearchResult.searchType,
          searchValue: simpleSearchResult.searchValue,
          credits_consumed: asyncResult.credits_consumed,
          started_at: new Date()
        })

        toast({
          title: "Busca completa iniciada",
          description: `Buscando nos tribunais... Tempo estimado: ${asyncResult.estimated_time_minutes} minutos`,
        })
      } else if (asyncResult.status === 'completed') {
        // Cache hit - dados retornados imediatamente
        const buscaId = Date.now().toString()
        const novaBusca: Busca = {
          id: buscaId,
          tipo: 'processual',
          tipoIdentificador: simpleSearchResult.searchType,
          valor: simpleSearchResult.searchValue,
          resultados: asyncResult.results_count,
          data: new Date(),
          fromCache: true,
          creditsConsumed: asyncResult.credits_consumed,
          apiUsed: 'judit'
        }

        setBuscas(prev => [novaBusca, ...prev])
        setProcessosCache(prev => ({ ...prev, [buscaId]: asyncResult.processes || [] }))
        setSimpleSearchResult(null)

        toast({
          title: "Busca completa (cache)",
          description: `${asyncResult.results_count} processo(s) encontrado(s) • ${asyncResult.credits_consumed} créditos`,
        })
      }
    } catch (error: any) {
      console.error('Erro na busca completa:', error)
      
      toast({
        title: "Erro na busca completa",
        description: error.message || "Não foi possível iniciar a busca nos tribunais",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConsultaCadastral = async (data: ConsultaCadastralData) => {
    setLoading(true)
    try {
      const response = await ConsultaService.searchRegistrationData(
        data.tipoIdentificador,
        data.valor
      )
      
      const buscaId = Date.now().toString()
      
      const novaBusca: Busca = {
        id: buscaId,
        tipo: 'cadastral',
        tipoIdentificador: data.tipoIdentificador,
        valor: data.valor,
        resultados: 1,
        data: new Date(),
        fromCache: response.from_cache,
        creditsConsumed: response.credits_consumed,
        apiUsed: 'judit'
      }
      
      setBuscas([novaBusca, ...buscas])
      setDadosCadastraisCache(prev => ({ ...prev, [buscaId]: response.data }))
      
      toast({
        title: response.from_cache ? "Consulta cadastral (cache)" : "Consulta cadastral realizada",
        description: `Dados de ${response.data.name} • ${response.credits_consumed} crédito(s) consumido(s)`,
      })
    } catch (error) {
      console.error('Erro na consulta cadastral:', error)
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Não foi possível realizar a consulta cadastral",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConsultaPenal = async (data: ConsultaPenalData) => {
    setLoading(true)
    try {
      const response = await ConsultaService.searchCriminalRecords(data.cpf)
      
      const buscaId = Date.now().toString()
      
      const totalRecords = 
        (response.data.warrants?.length || 0) + 
        (response.data.criminal_executions?.length || 0)
      
      const novaBusca: Busca = {
        id: buscaId,
        tipo: 'penal',
        valor: data.cpf,
        resultados: totalRecords,
        data: new Date(),
        fromCache: response.from_cache,
        creditsConsumed: response.credits_consumed,
        apiUsed: 'judit'
      }
      
      setBuscas([novaBusca, ...buscas])
      setDadosPenaisCache(prev => ({ ...prev, [buscaId]: response.data }))
      
      toast({
        title: response.from_cache ? "Consulta penal (cache)" : "Consulta penal realizada",
        description: response.data.has_active_warrants 
          ? `⚠️ ${totalRecords} registro(s) encontrado(s) • ${response.credits_consumed} crédito(s)` 
          : `Nada consta • ${response.credits_consumed} crédito(s)`,
        variant: response.data.has_active_warrants ? "destructive" : "default"
      })
    } catch (error) {
      console.error('Erro na consulta penal:', error)
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Não foi possível realizar a consulta penal",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOcultarBusca = (buscaId: string) => {
    setBuscasOcultas(prev => new Set([...prev, buscaId]))
    toast({
      title: "Busca ocultada",
      description: "A busca foi removida do seu histórico visual",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Consultas</h1>
        <p className="text-muted-foreground">
          Realize consultas processuais, cadastrais e penais
        </p>
      </div>

      <ConsultasTabs
        onConsultaProcessual={handleConsultaProcessual}
        onConsultaCadastral={handleConsultaCadastral}
        onConsultaPenal={handleConsultaPenal}
        loading={loading}
        loadingStep={loadingStep}
      />

      {/* Card de resultado da busca simples com opção de aprofundar */}
      {simpleSearchResult && !deepSearchInProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Busca Simples Concluída</CardTitle>
            <CardDescription>
              Encontramos {simpleSearchResult.resultsCount} processo(s) em consulta rápida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deseja aprofundar a busca e pesquisar diretamente nos tribunais em tempo real?
              <br />
              <strong>Custo: 3 créditos</strong> • Tempo estimado: 2-5 minutos
            </p>
            <Button onClick={handleDeepSearch} disabled={loading}>
              Buscar nos Tribunais (3 créditos)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Card de busca em andamento */}
      {deepSearchInProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Busca Completa em Andamento
            </CardTitle>
            <CardDescription>
              Pesquisando nos tribunais... Tempo estimado: 2-5 minutos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Você será notificado quando a busca for concluída. Pode continuar navegando.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Iniciada há {Math.floor((new Date().getTime() - new Date(deepSearchInProgress.started_at).getTime()) / 1000)} segundos
            </p>
          </CardContent>
        </Card>
      )}

      {buscas.length > 0 && (
        <HistoricoBuscas
          buscas={buscas.filter(b => !buscasOcultas.has(b.id))}
          getProcessosByBusca={(buscaId) => processosCache[buscaId] || []}
          onOcultarBusca={handleOcultarBusca}
        />
      )}
    </div>
  )
}

export default Consultas