import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, FileText, User, Scale } from "lucide-react"
import { Busca } from "../types/consulta.types"
import { ResultadosDetalhes } from "./ResultadosDetalhes"
import { Process } from "@/shared/types/database.types"

interface BuscaCardProps {
  busca: Busca
  processos?: Process[]
}

export const BuscaCard = ({ busca, processos = [] }: BuscaCardProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = () => {
    switch (busca.tipo) {
      case 'processual':
        return <Scale className="w-5 h-5" />
      case 'cadastral':
        return <User className="w-5 h-5" />
      case 'penal':
        return <FileText className="w-5 h-5" />
    }
  }

  const getTipoLabel = () => {
    switch (busca.tipo) {
      case 'processual':
        return 'Consulta Processual'
      case 'cadastral':
        return 'Consulta Cadastral'
      case 'penal':
        return 'Consulta Penal'
    }
  }

  const getIdentificadorLabel = () => {
    if (busca.tipoIdentificador) {
      return busca.tipoIdentificador.toUpperCase()
    }
    return 'Documento'
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="animate-fade-in">
        <CardContent className="p-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getIcon()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline">{getTipoLabel()}</Badge>
                    <span className="text-sm font-medium">
                      {getIdentificadorLabel()}: {busca.valor}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      <strong>{busca.resultados}</strong> {busca.resultados === 1 ? 'resultado' : 'resultados'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(busca.data).toLocaleDateString('pt-BR')} às {new Date(busca.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </>
                )}
              </Button>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4">
            <div className="border-t pt-4 animate-accordion-down">
              <ResultadosDetalhes processos={processos} />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}
