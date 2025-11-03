import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ConsultasTabs } from "@/features/consultas/components/ConsultasTabs"
import { HistoricoBuscas } from "@/features/consultas/components/HistoricoBuscas"
import { ConsultaProcessualData, ConsultaCadastralData, ConsultaPenalData, Busca } from "@/features/consultas/types/consulta.types"
import { Process } from "@/shared/types/database.types"

const Consultas = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [buscas, setBuscas] = useState<Busca[]>([])
  const [processosCache, setProcessosCache] = useState<Record<string, Process[]>>({})

  const handleConsultaProcessual = async (data: ConsultaProcessualData) => {
    setLoading(true)
    try {
      // TODO: Integrar com edge function search-processes
      console.log("Consulta Processual:", data)
      
      // Simular resposta para desenvolvimento
      const buscaId = Date.now().toString()
      const numResultados = Math.floor(Math.random() * 15) + 1
      
      const novaBusca: Busca = {
        id: buscaId,
        tipo: 'processual',
        tipoIdentificador: data.tipoIdentificador,
        valor: data.valor,
        resultados: numResultados,
        data: new Date()
      }
      
      // Simular processos encontrados
      const processosMock: Process[] = Array.from({ length: numResultados }, (_, i) => ({
        id: `${buscaId}-processo-${i}`,
        cnj_number: `${String(i).padStart(7, '0')}-${Math.floor(Math.random() * 99)}.2024.8.26.${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        tribunal: ['TJ-SP', 'TJ-RJ', 'TJ-MG'][Math.floor(Math.random() * 3)],
        distribution_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        status: ['Ativo', 'Arquivado', 'Suspenso'][Math.floor(Math.random() * 3)],
        case_value: Math.random() * 100000,
        judge_name: 'Dr. João Silva',
        court_name: `${Math.floor(Math.random() * 50) + 1}ª Vara Cível`,
        phase: ['Conhecimento', 'Execução', 'Recursal'][Math.floor(Math.random() * 3)],
        author_names: ['João da Silva', 'Maria Santos'],
        defendant_names: ['Empresa XYZ Ltda', 'José Oliveira'],
        parties_cpf_cnpj: ['12345678900', '98765432100'],
        last_update: new Date().toISOString(),
        created_at: new Date().toISOString()
      }))
      
      setBuscas([novaBusca, ...buscas])
      setProcessosCache(prev => ({ ...prev, [buscaId]: processosMock }))
      
      toast({
        title: "Busca realizada",
        description: `Encontrados ${novaBusca.resultados} processos`
      })
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a consulta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConsultaCadastral = async (data: ConsultaCadastralData) => {
    setLoading(true)
    try {
      // TODO: Integrar com edge function
      console.log("Consulta Cadastral:", data)
      
      const novaBusca: Busca = {
        id: Date.now().toString(),
        tipo: 'cadastral',
        tipoIdentificador: data.tipoIdentificador,
        valor: data.valor,
        resultados: 1,
        data: new Date()
      }
      
      setBuscas([novaBusca, ...buscas])
      
      toast({
        title: "Consulta cadastral realizada",
        description: "Dados cadastrais encontrados"
      })
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: "Não foi possível realizar a consulta cadastral",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConsultaPenal = async (data: ConsultaPenalData) => {
    setLoading(true)
    try {
      // TODO: Integrar com edge function
      console.log("Consulta Penal:", data)
      
      const novaBusca: Busca = {
        id: Date.now().toString(),
        tipo: 'penal',
        valor: data.cpf,
        resultados: Math.floor(Math.random() * 5),
        data: new Date()
      }
      
      setBuscas([novaBusca, ...buscas])
      
      toast({
        title: "Consulta penal realizada",
        description: `${novaBusca.resultados} registro(s) encontrado(s)`
      })
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: "Não foi possível realizar a consulta penal",
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
