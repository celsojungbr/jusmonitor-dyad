import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, AlertTriangle } from "lucide-react"
import { ConsultaPenalData } from "../types/consulta.types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConsultaPenalProps {
  onSubmit: (data: ConsultaPenalData) => void
  loading?: boolean
}

export const ConsultaPenal = ({ onSubmit, loading }: ConsultaPenalProps) => {
  const [cpf, setCpf] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cpf.trim()) return
    onSubmit({ cpf: cpf.trim() })
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Esta consulta retorna informações sobre mandados de prisão e execuções penais ativas.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label>CPF</Label>
            <Input 
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={loading || !cpf.trim()}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Buscando..." : "Consultar"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
