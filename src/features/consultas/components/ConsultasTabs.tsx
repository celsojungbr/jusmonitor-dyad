import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsultaProcessual } from "./ConsultaProcessual"
import { ConsultaCadastral } from "./ConsultaCadastral"
import { ConsultaPenal } from "./ConsultaPenal"
import { ConsultaProcessualData, ConsultaCadastralData, ConsultaPenalData } from "../types/consulta.types"

interface ConsultasTabsProps {
  onConsultaProcessual: (data: ConsultaProcessualData) => void
  onConsultaCadastral: (data: ConsultaCadastralData) => void
  onConsultaPenal: (data: ConsultaPenalData) => void
  loading?: boolean
  loadingStep?: string
}

export const ConsultasTabs = ({
  onConsultaProcessual,
  onConsultaCadastral,
  onConsultaPenal,
  loading,
  loadingStep
}: ConsultasTabsProps) => {
  return (
    <Tabs defaultValue="processual" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="processual">Processual</TabsTrigger>
        <TabsTrigger value="cadastral">Cadastral</TabsTrigger>
        <TabsTrigger value="penal">Penal</TabsTrigger>
      </TabsList>

      <TabsContent value="processual">
        <Card>
          <CardHeader>
            <CardTitle>Consulta Processual</CardTitle>
            <CardDescription>
              Busque processos por CPF, CNPJ, OAB ou número CNJ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsultaProcessual onSubmit={onConsultaProcessual} loading={loading} loadingStep={loadingStep} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cadastral">
        <Card>
          <CardHeader>
            <CardTitle>Consulta Cadastral</CardTitle>
            <CardDescription>
              Busque dados cadastrais de pessoas físicas ou jurídicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsultaCadastral onSubmit={onConsultaCadastral} loading={loading} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="penal">
        <Card>
          <CardHeader>
            <CardTitle>Consulta Penal</CardTitle>
            <CardDescription>
              Verifique mandados de prisão e execuções penais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsultaPenal onSubmit={onConsultaPenal} loading={loading} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
