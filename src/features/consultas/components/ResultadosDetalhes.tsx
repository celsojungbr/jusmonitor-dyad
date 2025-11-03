import { ProcessoCard } from "./ProcessoCard"
import { Process } from "@/shared/types/database.types"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

interface ResultadosDetalhesProps {
  processos: Process[]
}

export const ResultadosDetalhes = ({ processos }: ResultadosDetalhesProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleVerDetalhes = (cnjNumber: string) => {
    navigate(`/dashboard/processo/${cnjNumber}`)
  }

  const handleBaixarPDF = async (cnjNumber: string) => {
    // TODO: Integrar com edge function para gerar PDF
    toast({
      title: "Gerando PDF",
      description: "O dossiê está sendo preparado para download..."
    })
    console.log("Baixar PDF:", cnjNumber)
  }

  const handleMonitorar = async (cnjNumber: string) => {
    // TODO: Integrar com edge function create-monitoring
    toast({
      title: "Monitoramento ativado",
      description: "Este processo será monitorado automaticamente"
    })
    console.log("Monitorar:", cnjNumber)
  }

  if (processos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum resultado encontrado
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {processos.map((processo) => (
        <ProcessoCard
          key={processo.id}
          processo={processo}
          onVerDetalhes={handleVerDetalhes}
          onBaixarPDF={handleBaixarPDF}
          onMonitorar={handleMonitorar}
        />
      ))}
    </div>
  )
}
