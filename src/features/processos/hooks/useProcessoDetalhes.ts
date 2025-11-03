import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Process, ProcessMovement, ProcessAttachment } from "@/shared/types/database.types"
import { useToast } from "@/hooks/use-toast"

export const useProcessoDetalhes = (cnjNumber: string) => {
  const [processo, setProcesso] = useState<Process | null>(null)
  const [movimentos, setMovimentos] = useState<ProcessMovement[]>([])
  const [anexos, setAnexos] = useState<ProcessAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [capturandoAnexos, setCapturandoAnexos] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (cnjNumber) {
      fetchProcessoDetalhes()
    }
  }, [cnjNumber])

  const fetchProcessoDetalhes = async () => {
    try {
      setLoading(true)

      // Buscar processo
      const { data: processoData, error: processoError } = await supabase
        .from("processes")
        .select("*")
        .eq("cnj_number", cnjNumber)
        .maybeSingle()

      if (processoError) throw processoError

      if (!processoData) {
        toast({
          title: "Processo não encontrado",
          description: "O processo solicitado não foi encontrado no sistema",
          variant: "destructive"
        })
        return
      }

      // Transform Json types to expected types
      const transformedProcesso: Process = {
        ...processoData,
        author_names: Array.isArray(processoData.author_names) 
          ? (processoData.author_names as string[])
          : [],
        defendant_names: Array.isArray(processoData.defendant_names) 
          ? (processoData.defendant_names as string[])
          : [],
        parties_cpf_cnpj: Array.isArray(processoData.parties_cpf_cnpj) 
          ? (processoData.parties_cpf_cnpj as string[])
          : []
      }

      setProcesso(transformedProcesso)

      // Buscar movimentações
      const { data: movimentosData, error: movimentosError } = await supabase
        .from("process_movements")
        .select("*")
        .eq("process_id", processoData.id)
        .order("movement_date", { ascending: false })

      if (movimentosError) throw movimentosError
      setMovimentos(movimentosData || [])

      // Buscar anexos
      const { data: anexosData, error: anexosError } = await supabase
        .from("process_attachments")
        .select("*")
        .eq("process_id", processoData.id)
        .order("filing_date", { ascending: false })

      if (anexosError) throw anexosError
      setAnexos(anexosData || [])

    } catch (error) {
      console.error("Erro ao buscar detalhes do processo:", error)
      toast({
        title: "Erro ao carregar processo",
        description: "Não foi possível carregar os detalhes do processo",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const capturarAnexos = async () => {
    if (!processo) return

    setCapturandoAnexos(true)
    try {
      // TODO: Integrar com edge function download-attachments
      toast({
        title: "Captura iniciada",
        description: "Os anexos estão sendo capturados. Este processo pode levar até 48h."
      })
      
      console.log("Capturando anexos para:", cnjNumber)
      
      // Simular captura
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Captura agendada",
        description: "Você será notificado quando os anexos estiverem disponíveis"
      })
    } catch (error) {
      toast({
        title: "Erro na captura",
        description: "Não foi possível iniciar a captura de anexos",
        variant: "destructive"
      })
    } finally {
      setCapturandoAnexos(false)
    }
  }

  const baixarPDF = async () => {
    if (!processo) return

    try {
      // TODO: Integrar com edge function para gerar PDF completo
      toast({
        title: "Gerando dossiê",
        description: "O PDF completo está sendo preparado..."
      })
      
      console.log("Gerando PDF para:", cnjNumber)
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o dossiê",
        variant: "destructive"
      })
    }
  }

  const monitorarProcesso = async () => {
    if (!processo) return

    try {
      // TODO: Integrar com edge function create-monitoring
      toast({
        title: "Monitoramento ativado",
        description: "Você receberá alertas sobre atualizações neste processo"
      })
      
      console.log("Monitorar processo:", cnjNumber)
    } catch (error) {
      toast({
        title: "Erro ao monitorar",
        description: "Não foi possível ativar o monitoramento",
        variant: "destructive"
      })
    }
  }

  return {
    processo,
    movimentos,
    anexos,
    loading,
    capturandoAnexos,
    capturarAnexos,
    baixarPDF,
    monitorarProcesso,
    refetch: fetchProcessoDetalhes
  }
}
