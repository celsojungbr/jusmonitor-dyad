import { BuscaCard } from "./BuscaCard"
import { Busca } from "../types/consulta.types"
import { Process } from "@/shared/types/database.types"
import { Separator } from "@/components/ui/separator"

interface HistoricoBuscasProps {
  buscas: Busca[]
  getProcessosByBusca?: (buscaId: string) => Process[]
}

export const HistoricoBuscas = ({ buscas, getProcessosByBusca }: HistoricoBuscasProps) => {
  if (buscas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhuma busca realizada</h3>
        <p className="text-muted-foreground">
          Realize uma consulta para ver os resultados aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Histórico de Buscas</h2>
        <span className="text-sm text-muted-foreground">
          {buscas.length} {buscas.length === 1 ? 'busca' : 'buscas'}
        </span>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        {buscas.map((busca) => (
          <BuscaCard
            key={busca.id}
            busca={busca}
            processos={getProcessosByBusca ? getProcessosByBusca(busca.id) : []}
          />
        ))}
      </div>
    </div>
  )
}
