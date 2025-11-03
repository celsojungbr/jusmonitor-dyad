import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { ConsultaCadastralData } from "../types/consulta.types"

interface ConsultaCadastralProps {
  onSubmit: (data: ConsultaCadastralData) => void
  loading?: boolean
}

export const ConsultaCadastral = ({ onSubmit, loading }: ConsultaCadastralProps) => {
  const [tipoIdentificador, setTipoIdentificador] = useState<'cpf' | 'cnpj'>("cpf")
  const [valor, setValor] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valor.trim()) return
    onSubmit({ tipoIdentificador, valor: valor.trim() })
  }

  const getPlaceholder = () => {
    return tipoIdentificador === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Documento</Label>
          <Select value={tipoIdentificador} onValueChange={(v) => setTipoIdentificador(v as 'cpf' | 'cnpj')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-2 space-y-2">
          <Label>Número do Documento</Label>
          <Input 
            placeholder={getPlaceholder()}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={loading || !valor.trim()}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Buscando..." : "Buscar Dados"}
          </Button>
        </div>
      </div>
    </form>
  )
}
