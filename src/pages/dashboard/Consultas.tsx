import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ConsultasTabs } from "@/features/consultas/components/ConsultasTabs"
import { HistoricoBuscas } from "@/features/consultas/components/HistoricoBuscas"
import { ConsultaProcessualData, ConsultaCadastralData, ConsultaPenalData, Busca } from "@/features/consultas/types/consulta.types"
import { Process } from "@/shared/types/database.types"
import { ConsultaService } from "@/features/consultas/services/consultaService"

const Consultas = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [buscas, setBuscas] = useState<Busca[]>([])
  const [processosCache, setProcessosCache] = useState<Record<string, Process[]>>({})
  const [dadosCadastraisCache, setDadosCadastraisCache] = useState<Record<string, any>>({})
  const [dadosPenaisCache, setDadosPenaisCache] = useState<Record<string, any>>({})

  const handleConsultaProcessual = async (data: ConsultaProcessualData) => {
    setLoading(true)
    try {
      // Chamar API real via ConsultaService
      const response = await ConsultaService.searchProcesses(
        data.tipoIdentificador,
        data.valor
      )
      
      const buscaId = Date.now().toString()
      
      const novaBusca: Busca = {
        id: buscaId,
        tipo: 'processual',
        tipoIdentificador: data.tipoIdentificador,
        valor: data.valor,
        resultados: response.results_count,
        data: new Date(),
        fromCache: response.from_cache,
        creditsConsumed: response.credits_consumed,
        apiUsed: 'judit'
      }
      
      setBuscas([novaBusca, ...buscas])
      setProcessosCache(prev => ({ ...prev, [buscaId]: response.processes }))
      
      toast({
        title: response.from_cache ? "Busca (cache)" : "Busca realizada",
        description: `${response.results_count} processo(s) encontrado(s) • ${response.credits_consumed} crédito(s) consumido(s)`,
      })
    } catch (error: any) {
      console.error('Erro na consulta processual:', error)
      
      // Tratar 404 como "nenhum processo encontrado" em vez de erro
      if (error.status === 404 || error.message?.includes('No processes found')) {
        const buscaId = Date.now().toString()
        const novaBusca: Busca = {
          id: buscaId,
          tipo: 'processual',
          tipoIdentificador: data.tipoIdentificador,
          valor: data.valor,
          resultados: 0,
          data: new Date(),
          fromCache: false,
          creditsConsumed: 0,
          apiUsed: 'judit'
        }
        setBuscas([novaBusca, ...buscas])
        setProcessosCache(prev => ({ ...prev, [buscaId]: [] }))
        
        toast({
          title: "Nenhum processo encontrado",
          description: "Não foram encontrados processos para este identificador",
        })
      } else {
        toast({
          title: "Erro na busca",
          description: error instanceof Error ? error.message : "Não foi possível realizar a consulta",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConsultaCadastral = async (data: ConsultaCadastralData) => {
    setLoading(true)
    try {
      // Chamar API real
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
      // Chamar API real
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
      />

      {buscas.length > 0 && (
        <HistoricoBuscas
          buscas={buscas}
          getProcessosByBusca={(buscaId) => processosCache[buscaId] || []}
        />
      )}
    </div>
  )
}

export default Consultas
