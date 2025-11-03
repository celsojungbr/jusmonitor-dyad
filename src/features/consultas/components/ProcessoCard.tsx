import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Bell } from "lucide-react"
import { Process } from "@/shared/types/database.types"

interface ProcessoCardProps {
  processo: Process
  onVerDetalhes?: (cnjNumber: string) => void
  onBaixarPDF?: (cnjNumber: string) => void
  onMonitorar?: (cnjNumber: string) => void
}

export const ProcessoCard = ({
  processo,
  onVerDetalhes,
  onBaixarPDF,
  onMonitorar
}: ProcessoCardProps) => {
  return (
    <Card className="hover:border-primary transition-colors animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold">
                Processo nº {processo.cnj_number}
              </h3>
              {processo.tribunal && (
                <Badge variant="outline">{processo.tribunal}</Badge>
              )}
              {processo.status && (
                <Badge>{processo.status}</Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              {processo.phase && (
                <p><strong>Fase:</strong> {processo.phase}</p>
              )}
              {processo.author_names && processo.author_names.length > 0 && (
                <p><strong>Autor:</strong> {processo.author_names.join(', ')}</p>
              )}
              {processo.defendant_names && processo.defendant_names.length > 0 && (
                <p><strong>Réu:</strong> {processo.defendant_names.join(', ')}</p>
              )}
              {processo.distribution_date && (
                <p><strong>Distribuição:</strong> {new Date(processo.distribution_date).toLocaleDateString('pt-BR')}</p>
              )}
              {processo.court_name && (
                <p><strong>Vara:</strong> {processo.court_name}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {onVerDetalhes && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onVerDetalhes(processo.cnj_number)}
                className="hover-scale"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
            )}
            {onBaixarPDF && (
              <Button 
                size="sm"
                onClick={() => onBaixarPDF(processo.cnj_number)}
                className="hover-scale"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            )}
            {onMonitorar && (
              <Button 
                size="sm"
                variant="secondary"
                onClick={() => onMonitorar(processo.cnj_number)}
                className="hover-scale"
              >
                <Bell className="w-4 h-4 mr-2" />
                Monitorar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
